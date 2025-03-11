import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [prompt, setPrompt] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate("/generate", { state: { prompt } });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#0c2025_23%,#020271_65%,#078fab_100%)] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-100 mb-4">Noesis AI</h1>
            <p className="text-xl text-gray-300">
              Build your Website with the help of AI
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#0c2025] rounded-lg shadow-lg p-6">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the model you want to build..."
                className="w-full h-32 p-4 bg-gray-900 text-gray-100 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
              />
              <button
                type="submit"
                className="w-full mt-4 bg-blue-600 text-gray-100 py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Generate Website Code
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Home;
