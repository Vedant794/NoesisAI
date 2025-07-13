import { X, AlertTriangle, Wrench, Construction, Heart } from "lucide-react";

interface ModalCardProps {
  show: boolean;
  onClose: () => void;
}

const ModalCard: React.FC<ModalCardProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative z-50 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              How to Use
            </h2>
            <button
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Once the code is generated, you can click on the{" "}
              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-medium">
                "Generate URL to Test API"
              </span>{" "}
              button. It will give you a temporary URL to test the generated backend APIs.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-amber-400 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-amber-200 font-medium">Important Note</p>
                <p className="text-amber-100/90 text-sm mt-1">
                  This URL is valid for only <strong className="text-amber-200">5 minutes</strong>, 
                  so please test it as soon as possible.
                </p>
              </div>
            </div>

            <p>
              The URL is a base path. You'll need to append specific subpaths (like{" "}
              <code className="bg-gray-800 text-green-300 px-2 py-0.5 rounded text-sm font-mono">
                /api/xyz
              </code>
              ) based on the generated code to make actual API requests. We're working on improving this experience.
            </p>

            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <p className="text-gray-200 font-medium mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Example Usage
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">If you get a URL like:</p>
                <div className="bg-gray-900 border border-gray-700 rounded p-3 font-mono text-blue-300 text-xs break-all">
                  http://120.168.20.20/asbdehabsdadwasd
                </div>
                <p className="text-gray-300">You would append API endpoints based on your generated code:</p>
                <div className="space-y-1">
                  <div className="bg-gray-900 border border-gray-700 rounded p-2 font-mono text-green-300 text-xs break-all">
                    http://120.168.20.20/asbdehabsdadwasd<span className="text-yellow-300">/api/users</span>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded p-2 font-mono text-green-300 text-xs break-all">
                    http://120.168.20.20/asbdehabsdadwasd<span className="text-yellow-300">/api/products</span>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded p-2 font-mono text-green-300 text-xs break-all">
                    http://120.168.20.20/asbdehabsdadwasd<span className="text-yellow-300">/api/orders</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
              <Wrench className="text-blue-400 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-blue-200 font-medium">Coming Soon</p>
                <p className="text-blue-100/90 text-sm mt-1">
                  We'll be integrating <strong className="text-blue-200">Swagger UI</strong> to let you test your APIs more easily via a clean interface. We also plan to show all generated URLs in one place.
                </p>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 flex items-start gap-3">
              <Construction className="text-purple-400 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-purple-200 font-medium">Development Status</p>
                <p className="text-purple-100/90 text-sm mt-1">
                  This platform is still in its prototype stage. We're constantly working to improve it. 
                  The code generated right now might be minimal and may not fit every use case due to model limitations.
                </p>
              </div>
            </div>

            <p>
              However, we believe the results can significantly improve with better LLMs. 
              We hope you find this platform useful!
            </p>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start gap-3">
              <Heart className="text-green-400 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-green-200 font-medium">Get Involved</p>
                <p className="text-green-100/90 text-sm mt-1">
                  Feel free to reach out or contribute if you'd like to help us build this further.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCard;
