"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import DownloadAssetModal from "@/components/DownloadAsset";
import ThreeDViewer from "@/components/ThreeDViewer";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Star, Download } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

interface Asset {
  
  id: string;
  name: string;
  description: string;
  file_url: string;
  type: string;
  tags: string[];
  versions: any[];
  project_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Optional properties for various asset types
  resolution?: string;
  color_depth?: string;
  duration?: number;
  bitrate?: number;
  polycount?: number;
  enviroment?: string;
  size?: string;
  condition?: string;
  frame_rate?: number;
  language?: string;
}

export default function SingleAsset() {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [codeContent, setCodeContent] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const queryParams = new URLSearchParams(location.search);
    const assetId = queryParams.get("id");

    if (!assetId) {
      console.error("No asset ID provided");
      return;
    }

    const fetchAsset = async () => {
      try {
        const res = await fetch(
          `https://usabilidadaccesibilidad-25.onrender.com/api/assets/${assetId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch asset");
        const data = await res.json();
        setAsset(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAsset();
  }, [location.search, navigate]);

  // Viewer logic

  // Fetch code content when asset is loaded and is scripting
  useEffect(() => {
    if (asset && asset.type === "scripting" && asset.file_url) {
      const secureUrl = getSecureUrl(asset.file_url);
      fetch(secureUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.text();
        })
        .then((text) => {
          setCodeContent(text);
          console.log("Loaded code content:", text.slice(0, 100));
        })
        .catch((err) => {
          setCodeContent("// Error loading code");
          console.error("Error loading code:", err);
        });
    }
  }, [asset]);

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pt-20">
        <p className="text-center text-zinc-400">Loading asset details...</p>
      </div>
    );
  }

  // Get assetId and token for DownloadAssetForm
  const queryParams = new URLSearchParams(location.search);
  const assetId = queryParams.get("id") || "";
  const token = localStorage.getItem("token") || "";

  // Viewer logic
  let mainViewer = null;
  // Ensure HTTPS for model3d and other asset URLs
  const getSecureUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith("http://usabilidadaccesibilidad-25.onrender.com")) {
      return url.replace("http://", "https://");
    }
    if (url.startsWith("/uploads/")) {
      return `https://usabilidadaccesibilidad-25.onrender.com${url}`;
    }
    return url;
  };

  if (asset.type === "model3d") {
    mainViewer = (
      <div className="relative w-full aspect-square">
        <ThreeDViewer modelURL={getSecureUrl(asset.file_url)} />
      </div>
    );
  } else if (asset.type === "image") {
    mainViewer = (
      <img
        src={getSecureUrl(asset.file_url)}
        alt={asset.name}
        className="object-cover w-full h-full rounded-lg"
        style={{ maxHeight: 500, background: "#222" }}
      />
    );
  } else if (asset.type === "sound") {
    mainViewer = (
      <div style={{ width: "100%", maxWidth: 500 }}>
        <AudioPlayer
          src={getSecureUrl(asset.file_url)}
          showJumpControls={false}
          customAdditionalControls={[]}
          layout="horizontal"
          style={{
            borderRadius: 12,
            background: "#222",
            boxShadow: "0 2px 16px #000a",
            margin: "40px auto",
          }}
        />
      </div>
    );
  } else if (asset.type === "video") {
    mainViewer = (
      <video
        controls
        style={{
          width: "100%",
          maxHeight: 500,
          background: "#222",
          borderRadius: 12,
        }}
      >
        <source src={getSecureUrl(asset.file_url)} />
        Your browser does not support the video tag.
      </video>
    );
  } else if (asset.type === "scripting") {
    mainViewer = (
      <div
        style={{
          maxHeight: 500,
          overflow: "auto",
          background: "#181818",
          borderRadius: 12,
          marginTop: 20,
          padding: 24,
        }}
      >
        <pre
          style={{
            color: "#e0e0e0",
            background: "none",
            fontSize: 16,
            fontFamily: "Fira Mono, Menlo, Monaco, Consolas, monospace",
            margin: 0,
            whiteSpace: "pre",
          }}
        >
          <code>
            {codeContent ?? "// Loading..."}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6 relative">
      <DownloadAssetModal
        assetId={assetId}
        open={isDownloading}
        onOpenChange={setIsDownloading}
        token={token}
      />
      <div className={isDownloading ? "pointer-events-none" : ""}>
        <div className="max-w-7xl mx-auto pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main viewer */}
            <div
              className="lg:col-span-2 rounded-lg overflow-hidden border border-zinc-700 bg-[#111] flex items-center justify-center"
              style={{ minHeight: 400 }}
            >
              {mainViewer}
            </div>

            {/* Info lateral */}
            <div className="bg-[#222] rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-left">
                {asset.name}
              </h2>
              <br></br>
              <div className="flex flex-col gap-3 mb-6">
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center"
                  onClick={() => setIsDownloading(true)}
                >
                  <Download className="mr-2 h-4 w-4 text-left" /> Download
                </Button>
              

              </div>

              <div className="text-sm text-zinc-400 mb-6 text-left">
                Created:{" "}
                <span className="font-medium text-white">
                  {new Date(asset.created_at).toLocaleDateString()}
                </span>
                  {/* Metadata by type */}
              <div className="mb-4 text-sm text-zinc-300 text-left">
                {asset.type === "image" && (
                  <>
                    {asset.resolution && <div>Resolution: {asset.resolution}</div>}
                    {asset.color_depth && <div>Color Depth: {asset.color_depth}</div>}
                  </>
                )}
                {asset.type === "sound" && (
                  <>
                    {asset.duration && <div>Duration: {asset.duration}s</div>}
                    {asset.bitrate && <div>Bitrate: {asset.bitrate}kbps</div>}
                  </>
                )}
                {asset.type === "model3d" && (
                  <>
                    {asset.polycount && <div>Polycount: {asset.polycount}</div>}
                    {asset.enviroment && <div>Enviroment: {asset.enviroment}</div>}
                    {asset.size && <div>Size: {asset.size}</div>}
                    {asset.condition && <div>Condition: {asset.condition}</div>}
                  </>
                )}
                {asset.type === "video" && (
                  <>
                    {asset.resolution && <div>Resolution: {asset.resolution}</div>}
                    {asset.duration && <div>Duration: {asset.duration}s</div>}
                    {asset.frame_rate && <div>Frame Rate: {asset.frame_rate}fps</div>}
                  </>
                )}
                {asset.type === "scripting" && (
                  <>
                    {asset.language && <div>Language: {asset.language}</div>}
                  </>
                )}
              </div>
            
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium mb-2 text-left">Tags</h3>
                <div className="flex gap-2 flex-wrap">
                  {asset.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-zinc-700 px-3 py-1 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium mb-2 text-left">
                  Description
                </h3>
                <p className="text-sm text-zinc-300 text-left">
                  {asset.description || "No description available."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}