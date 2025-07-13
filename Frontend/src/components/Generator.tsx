import { useEffect, useState } from "react";
import FileExplorer from "./FileExplorer";
import CodeEditor from "./CodeEditor";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { cleanResponse } from "./Helpers/Cleaner";
import JSZip from "jszip";
import ModalCard from "./ModelCard";



const BASE_URL = "https://noesisbackend-efcbdbe6ffgegfcf.centralindia-01.azurewebsites.net";


interface FileDataResponse {
  filepath: string;
  content: string;
}

interface jsonResponseType {
  output: FileDataResponse[];
}

function App() {
  const location = useLocation();
  const prompt = location.state?.prompt || "";
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    content: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [json, setJson] = useState<jsonResponseType>();
  const [active, setActive] = useState(false);
  const [jsonResponse, setJsonResponse] = useState<jsonResponseType>({
    output: [],
  });
  const [errorOccured, setErrorOccured] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false); // modal trigger
  
  async function generateTestingUrl() {
    try {
      setActive(true);
      const response = await axios.post(BASE_URL + "/generateurl", json);
      setActive(false);
      setUrl(`${response.data.url}`);
      setErrorOccured(false);
    } catch (error: any) {
      setErrorOccured(true);
      throw Error(`Takniki Kharabi hai thoda sabar karo: ${error}`);
    }
  }

  async function init() {
    try {
      setLoading(true);
      const response = await axios.post(BASE_URL+"/chats", {
        messages: prompt,
        template: "backend",
      });
      let cleanJson = cleanResponse(response.data.Content);
      setJson(JSON.parse(cleanJson));
      setJsonResponse(JSON.parse(cleanJson));
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

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    jsonResponse.output.forEach((file) => {
      const normalizedPath = file.filepath.replace(/^\//, "");
      zip.file(normalizedPath, file.content);
    });
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Noesis-generation.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
  <div className="h-screen flex bg-gray-900 relative">

      {loading ? (
        <>
          <h1 className="text-lg text-white text-center">Wait.....</h1>
          {errorOccured && (
            <h1 className="text-lg text-white text-center">
              Some Server Error Occurred. Please refresh the page.
            </h1>
          )}
        </>
      ) : (
        <>
          {/* Left panel */}
          <div className="w-[30%] h-full p-4 bg-gray-800 border-r border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-100">Project Status</h2>

            <div className="space-y-4">
              {/* Project Structure */}
              <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Project Structure</h3>
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

              {/* File Types */}
              <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">File Types</h3>
                <div className="space-y-2">
                  {Object.entries(
                    jsonResponse.output.reduce((acc, file) => {
                      const ext = file.filepath.split(".").pop() || "unknown";
                      acc[ext] = (acc[ext] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([ext, count]) => (
                    <div key={ext} className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">.{ext} files</span>
                      <span className="text-sm font-medium text-blue-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Show How to Use */}
              <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
                <button
                  onClick={() => setShowHowToUse(true)}
                  className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  Show How to Use
                </button>
              </div>
            </div>

            {/* Output & Buttons */}
            <div className="ouputSection mt-3 text-center">
              {url.length > 0 && (
                <div>
                  <span className="text-sm text-slate-100 font-serif">{url}</span>
                  <h1 className="text-sm text-red-400 font-mono mt-2">
                    ** This URL is valid for 5 minutes. Test quickly! **
                  </h1>
                  <button
                    className="text-white rounded-lg bg-blue-500 ml-5 hover:bg-blue-700 px-4 py-2 mt-4 font-mono text-sm"
                    onClick={async () => await navigator.clipboard.writeText(url)}
                  >
                    Copy Url
                  </button>
                </div>
              )}

              {active && (
                <h1 className="text-lg font-mono text-white mt-2">
                  Loading...
                  {errorOccured && (
                    <p className="text-sm text-red-400">Error occurred. Try again later.</p>
                  )}
                </h1>
              )}

              <button
                className={`h-[6vh] w-[80%] mt-5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-700 text-slate-100`}
                onClick={generateTestingUrl}
              >
                Generate URL to Test API
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-[70%] h-full flex bg-gray-900">
            <div className="w-1/3 p-4 border-r border-gray-700">
              <FileExplorer
                files={jsonResponse.output}
                onFileSelect={handleFileSelect}
                downloadFile={handleDownload}
              />
            </div>

            <div className="w-2/3">
              <CodeEditor
                filePath={selectedFile?.path}
                content={selectedFile?.content}
              />
            </div>
          </div>
        </>
      )}

      {/* ModalCard Rendered Outside Panels */}
      {showHowToUse && (
        <ModalCard show={showHowToUse} onClose={() => setShowHowToUse(false)} />
      )}
    </div>
  );
}

export default App;
