package main

import (
	"archive/tar"
	"bytes"
	"context"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type App struct {
	dockerConn *client.Client
	Router     *gin.Engine
	Network    string
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

	// route to handle request
	app.Router.POST("/deploy", app.handleDeploy)

	log.Println("Server is running on http://localhost:9000")
	log.Fatal(app.Router.Run(":9000"))
}

/*
this method deploys the contaiener it takes the path of the node js code
several other methods need to be created
*/
func (app *App) handleDeploy(c *gin.Context) {
	// Example path to the Node.js application directory
	path := "/home/shreyash/Desktop/test(2)/test/"

	// Build Docker image
	imageName := app.createImage(path)

	// Launch the container
	containerId, url := app.launchContainer(imageName)

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
func (app *App) createImage(path string) string {
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
CMD ["node", "index.js"]`

	// Add Dockerfile to tar
	err := addFileToTar(tw, "Dockerfile", dockerfile)
	if err != nil {
		log.Fatalf("Error adding Dockerfile to tar: %v", err)
	}

	// Add application files to tar
	err = addDirectoryToTar(tw, path)
	if err != nil {
		log.Fatalf("Error adding directory to tar: %v", err)
	}

	// Close the tar writer
	err = tw.Close()
	if err != nil {
		log.Fatalf("Error closing tar writer: %v", err)
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
		log.Fatalf("Error building image: %v", err)
	}
	defer imageBuildResponse.Body.Close()

	//reading the logs for error identifications ,to be removed later on
	log.Println("Building image...")
	_, err = io.Copy(os.Stdout, imageBuildResponse.Body)
	if err != nil {
		log.Fatalf("Error reading build output: %v", err)
	}
	log.Println("Image built successfully!")

	//returning the image name
	return ImageName.String()
}

/* launching the docker container on providing the image it also connect to the traffic label for reverse proxy
 */
func (app *App) launchContainer(imageName string) (string, string) {

	host := fmt.Sprintf("Host(`%s-node1s.localhost`)", imageName)
	url := fmt.Sprintf("%s-node1s.localhost", imageName)
	containerName := imageName

	rule_pathprefix := fmt.Sprintf("traefik.http.routers.%s.rule", containerName)
	//rule_middleware:=fmt.Sprintf("traefik.http.routers.%s.middlewares",containerName)
	//rule_remove_middleware:=fmt.Sprintf("traefik.http.middlewares.remove-%s.stripprefix.prefixes",containerName)
	rule_loadbalance := fmt.Sprintf("traefik.http.services.%s.loadbalancer.server.port")

	// container configuration
	resp, err := app.dockerConn.ContainerCreate(
		context.Background(),
		&container.Config{
			Image: imageName,
			Labels: map[string]string{
				"traefik.enable": "true", //enable traefik
				rule_pathprefix:  host,   //pathprefix
				rule_loadbalance: "3000", //loadbalancing to port 3000
			},
		},
		&container.HostConfig{
			NetworkMode: container.NetworkMode(app.Network), // Connect to the desired network
		},
		&network.NetworkingConfig{
			EndpointsConfig: map[string]*network.EndpointSettings{
				"trafiektest_default": {}, // Attach to the specific network
			},
		},
		nil,           // Platform
		containerName, // Container name
	)

	if err != nil {
		log.Fatalf("Error creating container: %v", err)
	}

	err = app.dockerConn.ContainerStart(context.Background(), resp.ID, container.StartOptions{})
	if err != nil {
		log.Fatalf("Error starting container: %v", err)
	}

	log.Printf("Container started successfully with ID: %s\n", resp.ID)
	log.Println("Your application is running, and Traefik should route traffic based on the configured labels.")

	//returning the cotnainer id
	containerId := resp.ID
	return containerId, url
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

		f, err := os.Open(file)
		if err != nil {
			return err
		}
		defer f.Close()

		relPath := strings.TrimPrefix(file, filepath.Dir(path)+"/")

		header := &tar.Header{
			Name: relPath,
			Mode: int64(fi.Mode()),
			Size: fi.Size(),
		}
		if err := tw.WriteHeader(header); err != nil {
			return err
		}

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

/*main function
 */
func main() {

	network := flag.String("network", "trafiektest_default", "Specify the network name")

	app := &App{Network: *network}
	app.initialize()
}
