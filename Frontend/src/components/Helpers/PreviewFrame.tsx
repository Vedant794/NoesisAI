import { WebContainer } from "@webcontainer/api";
import { useEffect, useState, useRef } from "react";

interface PreviewFrameProps {
  files: Record<string, string>; // Object with filename as key and content as value
}

export function PreviewFrame({ files }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const webContainerRef = useRef<WebContainer | null>(null); // Store WebContainer instance

  useEffect(() => {
    async function initWebContainer() {
      if (webContainerRef.current) return; // Prevent multiple instances

      const container = await WebContainer.boot();
      webContainerRef.current = container; // Store the instance

      // Write files dynamically
      await Promise.all(
        Object.entries(files).map(([filename, content]) =>
          container.fs.writeFile(`/${filename}`, content)
        )
      );

      console.log("Files written to WebContainer");

      // Install dependencies
      const installProcess = await container.spawn("npm", ["install"]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log(data);
          },
        })
      );

      await container.spawn("npm", ["run", "dev"]);

      // Handle server-ready event
      const handleServerReady = (port: number, serverUrl: string) => {
        console.log(`Server running at ${serverUrl}:${port}`);
        setUrl(serverUrl);
      };

      container.on("server-ready", handleServerReady);
    }

    initWebContainer();

    // Cleanup function (optional)
    return () => {
      console.log("Cleaning up WebContainer instance...");
      if (webContainerRef.current) {
        webContainerRef.current.teardown(); // Properly destroy the instance
        webContainerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url ? (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      ) : (
        <iframe width="100%" height="100%" src={url} />
      )}
    </div>
  );
}
