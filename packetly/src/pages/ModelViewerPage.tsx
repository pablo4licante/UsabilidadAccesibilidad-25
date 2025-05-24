import React, { useState, useEffect } from "react";
import ThreeDViewer from "../components/ThreeDViewer";

const ModelViewerPage: React.FC = () => {
  const [modelName, setModelName] = useState<string>("");
  const [modelURL, setModelURL] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModelName(e.target.value);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modelName.trim() === "") return;

    try {
      const response = await fetch(`https://usabilidadaccesibilidad-25.onrender.com/model/${modelName}`);
      if (response.ok) {
        const data = await response.json();
        setModelURL(data.url);
      } else {
        alert("Model not found");
      }
    } catch (error) {
      console.error("Error fetching model:", error);
      alert("Failed to fetch model.");
    }
  };

  return (
    <div className="flex flex-col items-center p-8 mt-20">
      <form onSubmit={handleSearchSubmit} className="mb-4 flex items-center gap-4">
        <input
          type="text"
          value={modelName}
          onChange={handleSearchChange}
          placeholder="Enter model name"
          className="border rounded p-2 text-black"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Search
        </button>
      </form>

      <div className="w-[800px] h-[600px] rounded overflow-hidden mt-4">
        {modelURL ? (
          <ThreeDViewer key={modelURL} modelURL={modelURL} />
        ) : (
          <p>Search for a model!</p>
        )}
      </div>
    </div>
  );
};

export default ModelViewerPage;
