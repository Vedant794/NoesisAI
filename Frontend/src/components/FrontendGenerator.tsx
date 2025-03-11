import { useEffect, useState } from "react";
import { cleanResponse } from "./Helpers/Cleaner";
import axios from "axios";
import JSZip from "jszip";
import CodeEditor from "./CodeEditor";
import FileExplorer from "./FileExplorer";
import { TabView } from "./Helpers/TabView";
import { PreviewFrame } from "./Helpers/PreviewFrame";
import { useWebContainer } from "./Hooks/WebContainerUse";
import { BACKEND_URL } from "../config";
import { useLocation } from "react-router-dom";

interface FileDataResponse {
  filepath: string;
  content: string;
}

interface jsonResponseType {
  output: FileDataResponse[];
}

function FrontendGenerator() {
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    content: string;
  } | null>(null);
  const location = useLocation();
  const prompt = location.state?.prompt || "";
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [jsonResponse, setJsonResponse] = useState<jsonResponseType>({
    output: [],
  });
  const [errorOccured, setErrorOccured] = useState(false);
  const webcontainer = useWebContainer();

  async function init() {
    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/chats`, {
        messages: prompt,
        template: "frontend",
      });
      // console.log(response.data.Content);
      let cleanJson = cleanResponse(response.data.Content);
      // console.log(cleanJson);
      // const final = cleanJson.replace(/;/g, ";\\n");

      // console.log(final);
      setJsonResponse(JSON.parse(cleanJson));
      // console.log(jsonResponse);
      setLoading(false);
      setErrorOccured(false);
    } catch (error: any) {
      setErrorOccured(true);
      console.error("Something related to the apiReasponse", error);
    }
  }

  useEffect(() => {
    init();
  }, []);

  //Webcontainer Logic Part

  useEffect(() => {
    if (!webcontainer) return;

    const createMountStructure = (files: FileDataResponse[]) => {
      const mountStructure: Record<string, any> = {};
      files.forEach(({ filepath, content }) => {
        const pathSegments = filepath.split("/").filter(Boolean);
        let current = mountStructure;

        pathSegments.forEach((segment, index) => {
          if (!current[segment]) {
            current[segment] =
              index === pathSegments.length - 1
                ? { file: { contents: content } }
                : { directory: {} };
          }
          current = current[segment].directory || current[segment];
        });
      });
      return mountStructure;
    };

    const mountStructure = createMountStructure(jsonResponse.output);
    webcontainer.mount(mountStructure);
  }, [jsonResponse.output, webcontainer]);

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  const handleDownload = async () => {
    const zip = new JSZip();

    // Add all files to the zip
    jsonResponse.output.forEach((file) => {
      const normalizedPath = file.filepath.replace(/^\//, "");
      zip.file(normalizedPath, file.content);
    });

    // Generate the zip file
    const content = await zip.generateAsync({ type: "blob" });

    // Create download link
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Noesis-generation.zip";
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex bg-[linear-gradient(to_bottom_right,#0c2025_23%,#020271_65%,#078fab_100%)]">
      {loading ? (
        <>
          <h1 className="text-lg text-white text-center">Wait.....</h1>
          {errorOccured ? (
            <h1 className="text-lg text-white text-center">
              Some Server Error Occured Please refresh the page
            </h1>
          ) : (
            <></>
          )}
        </>
      ) : (
        <>
          {/* Left panel - Status */}
          <div className="w-[30%] h-full p-4 bg-gray-800 border-r border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-100">
              Project Status
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Project Structure
                </h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-3xl font-bold text-blue-400">
                      {jsonResponse.output.length}
                    </p>
                    <p className="text-sm text-gray-400">Total Files</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-400">
                      {
                        new Set(
                          jsonResponse.output.map((f) =>
                            f.filepath.split("/").slice(0, -1).join("/")
                          )
                        ).size
                      }
                    </p>
                    <p className="text-sm text-gray-400">Total Folders</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Recent Changes
                </h3>
                <div className="space-y-2">
                  {jsonResponse.output.slice(0, 3).map((file, index) => (
                    <div key={index} className="text-sm text-gray-400">
                      <p className="font-medium text-gray-300">
                        {file.filepath}
                      </p>
                      <p className="text-xs text-gray-500">Modified recently</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Right panel - Horizontal layout */}
          <div className="w-[70%] h-full flex bg-gray-900">
            {/* Explorer section */}
            <div className="w-1/3 p-4 border-r border-gray-700">
              <FileExplorer
                files={jsonResponse.output}
                onFileSelect={handleFileSelect}
                downloadFile={handleDownload}
              />
            </div>

            {/* Code panel section */}
            <div className="w-2/3 h-[100%] col-span-2 bg-gray-900 rounded-lg shadow-lg mt-2">
              <TabView activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="h-[calc(100%-4rem)]">
                {activeTab === "code" ? (
                  <CodeEditor
                    filePath={selectedFile?.path}
                    content={selectedFile?.content}
                  />
                ) : (
                  <PreviewFrame
                    files={jsonResponse.output}
                    webContainer={webcontainer}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FrontendGenerator;
