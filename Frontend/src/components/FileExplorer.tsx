import React from "react";
import { Folder, FileCode, ChevronRight, ChevronDown } from "lucide-react";

type FileData = {
  filepath: string;
  content: string;
};

type FileItem = {
  type: "file" | "folder";
  children?: Record<string, FileItem>;
  content?: string;
};

const pathsToTree = (files: FileData[]): Record<string, FileItem> => {
  const tree: Record<string, FileItem> = {};

  files.forEach((file) => {
    const parts = file.filepath.split("/").filter(Boolean);
    let current = tree;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;

      if (!current[part]) {
        current[part] = {
          type: isLast ? "file" : "folder",
          ...(isLast ? { content: file.content } : { children: {} }),
        };
      }

      if (!isLast) {
        current = current[part].children!;
      }
    });
  });

  return tree;
};

interface FileTreeProps {
  files: Record<string, FileItem>;
  level?: number;
  onFileSelect: (path: string, content: string) => void;
  currentPath: string;
}

const FileTree: React.FC<FileTreeProps> = ({
  files,
  level = 0,
  onFileSelect,
  currentPath,
}) => {
  const [expandedFolders, setExpandedFolders] = React.useState<
    Record<string, boolean>
  >({});

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  return (
    <div className="pl-4">
      {Object.entries(files).map(([name, item]) => {
        const fullPath = level === 0 ? name : `${currentPath}/${name}`;

        return (
          <div key={name}>
            <div
              className={`flex items-center gap-2 py-1 hover:bg-gray-800 cursor-pointer rounded ${
                item.type === "file" && item.content ? "hover:bg-gray-800" : ""
              }`}
              onClick={() => {
                if (item.type === "folder") {
                  toggleFolder(name);
                } else if (item.content) {
                  onFileSelect(fullPath, item.content);
                }
              }}
            >
              {item.type === "folder" &&
                (expandedFolders[name] ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                ))}
              {item.type === "folder" ? (
                <Folder size={16} className="text-blue-400" />
              ) : (
                <FileCode size={16} className="text-gray-400" />
              )}
              <span className="text-sm text-gray-300">{name}</span>
            </div>
            {item.type === "folder" && expandedFolders[name] && (
              <FileTree
                files={item.children || {}}
                level={level + 1}
                onFileSelect={onFileSelect}
                currentPath={fullPath}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const FileExplorer: React.FC<{
  files: FileData[];
  onFileSelect: (path: string, content: string) => void;
}> = ({ files, onFileSelect }) => {
  const fileTree = pathsToTree(files);

  return (
    <div className="h-full bg-gray-900 rounded-lg shadow-sm overflow-y-auto">
      <div className="p-3 border-b border-gray-700 bg-gray-800">
        <h2 className="font-semibold text-sm text-gray-300">
          Project Explorer
        </h2>
      </div>
      <div className="p-2">
        <FileTree files={fileTree} onFileSelect={onFileSelect} currentPath="" />
      </div>
    </div>
  );
};

export default FileExplorer;
