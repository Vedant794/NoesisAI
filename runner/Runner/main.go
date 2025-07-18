package main

import (
	"archive/tar"
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type App struct {
	dockerConn *client.Client
	Router     *gin.Engine
	Network    string
}

type File struct {
	Filepath string `json:"filepath"`
	Content  string `json:"content"`
}

type Output struct {
	Output []File `json:"output"`
}

/* This method initializes the gin router and also connects to the dockers socket
 */
func (app *App) initialize() {
	// connection to docker socket
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Println("Connection with Docker failed:", err)
		os.Exit(1)
	}
	app.dockerConn = cli

	// creating gin router
	app.Router = gin.Default()

	app.Router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},                                       // Allow all origins
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, // Allow all HTTP methods
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"}, // Allow common headers
		ExposeHeaders:    []string{"Content-Length"},                          // Expose specific headers
		AllowCredentials: true,                                                // Allow credentials (e.g., cookies)
		MaxAge:           12 * time.Hour,                                      // Cache the preflight response
	}))

	// route to handle request
	app.Router.POST("/deploy", app.handleTestDeploy)

	//route to read the container logs
	app.Router.POST("/create-code", app.handleCreateCode)

	//
	app.Router.GET("/logs/:container_id", app.readContainerLogs)
	log.Println("Server is running on http://localhost:9000")
	log.Fatal(app.Router.Run(":9000"))
}

/*
this method deploys the contaiener it takes the path of the node js code
several other methods need to be created
*/
func (app *App) handleTestDeploy(c *gin.Context) {
	// Example path to the Node.js application directory
	//path := "/home/shreyash/Desktop/test(2)/test/"
	path := "./code/user102/"
	// Build Docker image
	imageName, err := app.createImage(path)
	if err != nil {

	}

	// Launch the container
	containerId, url, err := app.launchContainer(imageName)
	if err != nil {

	}

	//clearnup after a fixed timeout
	go func() {
		time.Sleep(1 * time.Minute)
		app.handleCleanUp(imageName, containerId)
	}()

	c.JSON(200, gin.H{
		"message": url,
	})
}

/* thos method creates the image on providing the path of the code
 */
func (app *App) createImage(path string) (string, error) {
	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)

	//Image name
	ImageName := uuid.New()

	// Define the Dockerfile
	dockerfile := `
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "./src/index.js"]`

	// Add Dockerfile to tar
	err := addFileToTar(tw, "Dockerfile", dockerfile)
	if err != nil {
		log.Println(fmt.Printf("Error adding Dockerfile to tar: %v", err))
	}

	// Add application files to tar
	err = addDirectoryToTar(tw, path)
	if err != nil {
		log.Println(fmt.Sprintf("Error adding directory to tar: %v", err))
	}

	// Close the tar writer
	err = tw.Close()
	if err != nil {
		log.Println(fmt.Sprintf("Error closing tar writer: %v", err))
	}

	// Build the Docker image
	imageBuildResponse, err := app.dockerConn.ImageBuild(
		context.Background(),
		&buf,
		types.ImageBuildOptions{
			Tags:       []string{string(ImageName.String())},
			Dockerfile: "Dockerfile",
			Remove:     true,
		},
	)
	if err != nil {
		log.Println(fmt.Sprintf("Error building image: %v", err))
		return "", err
	}
	defer imageBuildResponse.Body.Close()

	//reading the logs for error identifications ,to be removed later on
	log.Println("Building image...")
	_, err = io.Copy(os.Stdout, imageBuildResponse.Body)
	if err != nil {
		log.Println(fmt.Sprintf("Error reading build output: %v", err))
		return "", err
	}
	log.Println("Image built successfully!")

	//returning the image name
	return ImageName.String(), nil
}

/* launching the docker container on providing the image it also connect to the traffic label for reverse proxy
 */
func (app *App) launchContainer(imageName string) (string, string, error) {

	//url to send to the user
	url := fmt.Sprintf("/%s", imageName)

	//name of the container same as imagename for easier refernce
	containerName := imageName

	//host rule value
	host := fmt.Sprintf("PathPrefix(`/%s`)", imageName)
	rm_mid := fmt.Sprintf("/%s", containerName)

	labels := map[string]string{
		"traefik.enable": "true", // Enable Traefik
		fmt.Sprintf("traefik.http.routers.%s.rule", containerName):                            host,
		fmt.Sprintf("traefik.http.routers.%s.middlewares", containerName):                     fmt.Sprintf("remove-%s", containerName),
		fmt.Sprintf("traefik.http.middlewares.remove-%s.stripprefix.prefixes", containerName): rm_mid,
		fmt.Sprintf("traefik.http.services.%s.loadbalancer.server.port", containerName):       "3000",
	}

	// Container configuration
	resp, err := app.dockerConn.ContainerCreate(
		context.Background(),
		&container.Config{
			Image:  imageName,
			Labels: labels, // Pass the corrected labels map
		},
		&container.HostConfig{
			NetworkMode: container.NetworkMode(app.Network), // Connect to the desired network
		},
		&network.NetworkingConfig{
			EndpointsConfig: map[string]*network.EndpointSettings{
				app.Network: {}, // Attach to the specific network
			},
		},
		nil,           // Platform
		containerName, // Container name
	)

	if err != nil {
		log.Println(fmt.Sprintf("Error creating container: %v", err))
		return "", "", err
	}

	err = app.dockerConn.ContainerStart(context.Background(), resp.ID, container.StartOptions{})
	if err != nil {
		log.Println(fmt.Sprintf("Error starting container: %v", err))
		return "", "", errors.New("error starting the container")
	}

	log.Printf("Container started successfully with ID: %s\n", resp.ID)
	log.Println("Your application is running, and Traefik should route traffic based on the configured labels.")

	//returning the cotnainer id
	containerId := resp.ID

	//waiting for a second to see if the container doesnt exited
	time.Sleep(1 * time.Second)

	containerJSON, err := app.dockerConn.ContainerInspect(context.Background(), containerId)
	if err != nil {
		log.Println(fmt.Sprintf("Error inspecting container: %v", err))
	}

	// Check the container's status
	if containerJSON.State.Status == "exited" {

		logs, err := app.dockerConn.ContainerLogs(context.Background(), containerId, container.LogsOptions{
			ShowStdout: true,
			ShowStderr: true,
			Follow:     false,
		})
		if err != nil {
			log.Println(fmt.Sprintf("Error fetching logs: %v", err))
		}
		defer logs.Close()
		fmt.Println("Container Logs:")
		logData, err := io.ReadAll(logs) // Read all logs at once
		if err != nil {
			log.Println(fmt.Sprintf("Error reading logs: %v", err))
		}

		go app.handleCleanUp(imageName, containerId) //cleanup this failed container for now
		return "", "", errors.New(fmt.Sprintf("error occured on running the code:- %s", string(logData)))
	}

	return containerId, url, nil
}

/*adding the file to tar because docker need it
 */
func addFileToTar(tw *tar.Writer, name, content string) error {
	header := &tar.Header{
		Name: name,
		Mode: 0600,
		Size: int64(len(content)),
	}
	if err := tw.WriteHeader(header); err != nil {
		return err
	}
	_, err := tw.Write([]byte(content))
	return err
}

/*adding the directory tar ,reason:-   docker needs it
 */
func addDirectoryToTar(tw *tar.Writer, path string) error {
	return filepath.Walk(path, func(file string, fi os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if fi.IsDir() {
			return nil
		}

		// Open the file
		f, err := os.Open(file)
		if err != nil {
			return err
		}
		defer f.Close()

		// Compute relative path in a cross-platform way
		relPath, err := filepath.Rel(path, file)
		if err != nil {
			return err
		}

		// Normalize to Unix-style paths for tar archive (platform-agnostic)
		relPath = filepath.ToSlash(relPath)

		// Create tar header
		header := &tar.Header{
			Name: relPath,
			Mode: int64(fi.Mode()),
			Size: fi.Size(),
		}
		if err := tw.WriteHeader(header); err != nil {
			return err
		}

		// Write file content
		_, err = io.Copy(tw, f)
		return err
	})
}

/*clean up funcion which delete the container and the image as well
 */
func (app *App) handleCleanUp(imageName string, containerId string) {
	ctx := context.Background()

	//stopping the container
	err := app.dockerConn.ContainerStop(ctx, containerId, container.StopOptions{})
	if err != nil {
		log.Println(err)
	}
	log.Println(fmt.Sprintf("stopped the container with id %s", containerId))

	//removing the container
	err = app.dockerConn.ContainerRemove(ctx, containerId, container.RemoveOptions{})
	if err != nil {
		log.Println(err)
	}
	log.Println(fmt.Sprintf("removed the container with id %s", containerId))

	//deleting the image
	_, err = app.dockerConn.ImageRemove(ctx, imageName, image.RemoveOptions{})
	if err != nil {
		fmt.Println(err)
	}
	log.Println(fmt.Sprintf(" removed the image with name:-%s", imageName))

}

/* This function creates the code file
 */
func createCode(out Output) (string, error) {
	temp := uuid.New()
	workingpath := fmt.Sprintf("./code/user%s/", temp.String())

	err := os.MkdirAll(workingpath, os.ModePerm)
	if err != nil {
		return "", fmt.Errorf("error creating working directory: %w", err)
	}

	for _, file := range out.Output {

		dirpath := filepath.Join(workingpath, filepath.Dir(file.Filepath))
		err = os.MkdirAll(dirpath, os.ModePerm)
		if err != nil {
			return "", fmt.Errorf("error creating directory path %s: %w", dirpath, err)
		}

		// Create the file
		filepath := filepath.Join(workingpath, file.Filepath)
		f, err := os.Create(filepath)
		if err != nil {
			return "", fmt.Errorf("error creating file %s: %w", filepath, err)
		}

		// Write content to the file
		_, err = f.Write([]byte(file.Content))
		if err != nil {
			f.Close() // Close file before returning
			return "", fmt.Errorf("error writing to file %s: %w", filepath, err)
		}

		// Close the file properly
		err = f.Close()
		if err != nil {
			return "", fmt.Errorf("error closing file %s: %w", filepath, err)
		}
	}

	return workingpath, nil
}

/*
this functions create teh images and containers basically handles everything
*/
func (app *App) handleCreateCode(c *gin.Context) {
	var output Output

	// Bind JSON payload
	if err := c.ShouldBindJSON(&output); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid input: " + err.Error(),
		})
		return
	}
	fmt.Println(output)

	// Call createCode
	workingpath, err := createCode(output)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create code: " + err.Error(),
		})
		return
	}

	log.Printf("Working path: %s", workingpath)

	// Build Docker image
	imageName, err := app.createImage(workingpath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to build Docker image: " + err.Error(),
		})
		return
	}

	log.Printf("Docker image created: %s", imageName)

	// Launch the container
	containerId, url, err := app.launchContainer(imageName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to launch container: " + err.Error(),
		})
		return
	}

	log.Printf("Container launched: ID=%s, URL=%s", containerId, url)

	//delete the files
	go func() {
		deleteFilesInDir(workingpath)
	}()

	// Cleanup after a fixed timeout
	go func() {
		time.Sleep(5 * time.Minute)
		app.handleCleanUp(imageName, containerId)

	}()

	// Respond with the container URL
	c.JSON(http.StatusOK, gin.H{
		"message": url,
	})
}

/*
	clean up function to delete all the required files

it delete the files based on the path
*/
func deleteFilesInDir(path string) error {
	// Open the directory
	err := os.RemoveAll(path)
	if err != nil {
		return fmt.Errorf("error deleting directory %s: %w", path, err)
	}

	fmt.Printf("Deleted directory: %s\n", path)
	return nil
}

/*
read the logs of the container
*/
func (app *App) readContainerLogs(c *gin.Context) {
	container_id := c.Param("container_id")

	//getting logs
	logs, err := app.dockerConn.ContainerLogs(context.Background(), container_id, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Follow:     false,
	})
	//if err occured reading the logs means container doest exist
	if err != nil {
		log.Println(fmt.Sprintf("Error fetching logs: %v", err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to launch container: " + err.Error(),
		})
		return
	}

	defer logs.Close()
	fmt.Println("Container Logs:")
	logData, err := io.ReadAll(logs) // Read all logs at once
	if err != nil {
		log.Println(fmt.Sprintf("Error reading logs: %v", err))
	}
	c.JSON(http.StatusOK, gin.H{
		"logs": logData,
	})

}

/*main function
 */
func main() {

	network := flag.String("network", "trafiektest_default", "Specify the network name")

	app := &App{Network: *network}
	app.initialize()
}
