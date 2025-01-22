import { useEffect, useState } from "react";
import FileExplorer from "./FileExplorer";
import CodeEditor from "./CodeEditor";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { cleanResponse } from "./Helpers/Cleaner";

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
  const [url, setUrl] = useState<string>("");
  const [json, setJson] = useState<jsonResponseType>();
  const [active, setActive] = useState(false);
  const [jsonResponse, setJsonResponse] = useState<jsonResponseType>({
    output: [],
  });

  async function generateTestingUrl() {
    try {
      const response = await axios.post("http://localhost:3000/generateurl", {
        code: json,
      });
      console.log(response.data);
      setUrl(`20.244.37.45/${response.data.message}`);
    } catch (error: any) {
      throw Error(`Takniki Kharabi hai thoda sabar karo: ${error}`);
    }
  }

  async function init() {
    try {
      const response = await axios.post("http://localhost:3000/chats", {
        messages: prompt,
      });
      // console.log(response.data.Content);
      const cleanJson = cleanResponse(response.data.Content);
      console.log(cleanJson);
      // const final = cleanJson.replace(/;/g, ";\\n");
      // console.log(final);
      setJson(JSON.parse(cleanJson));
      setJsonResponse(JSON.parse(cleanJson));
      // console.log(jsonResponse);
    } catch (error: any) {
      console.error("Something related to the apiReasponse", error);
    }
  }

  useEffect(() => {
    init();
  }, []);

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile({ path, content });
  };

  return (
    <div className="h-screen flex bg-gray-900">
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
              File Types
            </h3>
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
                  <span className="text-sm font-medium text-blue-400">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Recent Changes
            </h3>
            <div className="space-y-2">
              {jsonResponse.output.slice(0, 3).map((file, index) => (
                <div key={index} className="text-sm text-gray-400">
                  <p className="font-medium text-gray-300">{file.filepath}</p>
                  <p className="text-xs text-gray-500">Modified recently</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="ouputSection mt-3 text-center">
          {url.length > 0 ? (
            <div>
              <span className="text-xl text-slate-100 font-serif">{url}</span>
              <button
                className="text-white rounded-lg bg-blue-500 hover:bg-blue-700 px-4 py-2 h-[4vh] w[50%] text-lg font-mono"
                onClick={async () => await navigator.clipboard.writeText(url)}
              >
                Copy Url
              </button>
            </div>
          ) : (
            <></>
          )}
          {active ? (
            <h1 className="text-xl font-mono text-white">Loading.....</h1>
          ) : (
            <></>
          )}
          <button
            className={`h-[6vh] w-[80%] px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-700 text-slate-100 disabled:${
              url.length > 0
            }`}
            onClick={() => {
              generateTestingUrl(), setActive(true);
            }}
          >
            Generate Url to test the Api
          </button>
        </div>
      </div>

      {/* Right panel - Horizontal layout */}
      <div className="w-[70%] h-full flex bg-gray-900">
        {/* Explorer section */}
        <div className="w-1/3 p-4 border-r border-gray-700">
          <FileExplorer
            files={jsonResponse.output}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Code panel section */}
        <div className="w-2/3">
          <CodeEditor
            filePath={selectedFile?.path}
            content={selectedFile?.content}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
