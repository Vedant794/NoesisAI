import React from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  filePath?: string;
  content?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ filePath, content }) => {
  const getLanguage = (path?: string) => {
    if (!path) return "javascript";
    const ext = path.split(".").pop();
    switch (ext) {
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "json":
        return "json";
      case "env":
        return "plaintext";
      default:
        return "javascript";
    }
  };

  return (
    <div className="h-full w-full bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <h2 className="text-sm font-medium text-gray-300">
          {filePath || "Select a file to view"}
        </h2>
      </div>
      <Editor
        height="calc(100% - 37px)"
        defaultLanguage={getLanguage(filePath)}
        value={content || "// Select a file to view its contents"}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          padding: { top: 10 },
        }}
      />
    </div>
  );
};

export default CodeEditor;
