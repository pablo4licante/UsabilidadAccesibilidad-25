"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const API_URL = "https://usabilidadaccesibilidad-25.onrender.com";
const DEFAULT_IMAGE = "/assets/imgProj1.jpg";

const Projects = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectImage, setProjectImage] = useState<File | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error while retrieving projects: ${res.statusText}`);
      const data = await res.json();

      const formatted = data.map((p: any) => {
        const image = p.cover_image
          ? (p.cover_image.startsWith("http") ? p.cover_image : `${API_URL}${p.cover_image}`)
          : DEFAULT_IMAGE; // Ensure proper URL construction

        return {
          id: p._id || p.id,
          name: p.name,
          description: p.description || "",
          image,
          status: p.active === true ? "active" : "finished",
          rawData: p,
        };
      });

      setProjects(formatted);
    } catch (err) {
      console.error("Error wile loading projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return alert("Please, write a name.");
    if (!projectImage) return alert("Please, select an image.");

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const rawUser = localStorage.getItem("user");
      if (!token || !rawUser) throw new Error("User not logged");

      const user = JSON.parse(rawUser);
      const userId = user._id?.$oid || user._id || user.id;
      if (!userId) throw new Error("User Id not valid");

      const formData = new FormData();
      formData.append("name", newProjectName);
      formData.append("description", ""); // Optional description field
      formData.append("owner_id", userId); // Required owner_id field
      formData.append("cover_image", projectImage); // Ensure the image is uploaded as cover_image

      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Authorization header with token
        },
        body: formData, // FormData for multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Created project:", responseData); // Debugging log to verify response
      alert("Project created succesfully.");
      window.location.reload();
    } catch (err: any) {
      console.error("Error while creating the project:", err);
      alert(`Error while creating the project:\n${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/projectsAssets?id=${projectId}`);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const filteredProjects =
    selectedTab === "all" ? projects : projects.filter((p) => p.status === selectedTab);

  return (
    <main className="p-6 mt-16 bg-[#191919] text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-left">Projects</h1>

      <div className="flex space-x-2 mb-4">
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#892DD0] text-white hover:bg-[#a34de2]">
          + Create New Project
        </Button>
      </div>

      {showDebug && (
        <div className="mb-4 p-3 bg-gray-800 border border-gray-600 rounded text-white">
          <h3 className="font-bold mb-2">Datos de la API:</h3>
          <pre className="text-xs overflow-auto max-h-40 bg-black p-2 rounded">
            {JSON.stringify(projects.map((p) => p.rawData), null, 2)}
          </pre>
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-[#232323] p-4 rounded-lg">
          <div className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full p-2 rounded bg-[#333333] border border-[#444444] text-white"
            />
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer bg-[#333333] border border-[#444444] rounded p-2 hover:bg-[#444444] transition-colors">
                <span>Select image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProjectImage(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-400">
                {projectImage ? projectImage.name : "No image selected"}
              </span>
            </div>

            {projectImage && (
              <div className="mt-2 w-32 h-32">
                <img
                  src={URL.createObjectURL(projectImage)}
                  alt="Preview"
                  className="object-cover w-full h-full rounded"
                />
              </div>
            )}

            <div className="flex space-x-2 mt-2">
              <Button
                onClick={handleCreateProject}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Save project"}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setNewProjectName("");
                  setProjectImage(null);
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-[#333333]"
                disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <TabsList className="mb-6 bg-[#131313] text-white">
          <TabsTrigger value="all" className="data-[state=active]:bg-[#892DD0] text-white">All Projects</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-[#892DD0] text-white">Active</TabsTrigger>
          <TabsTrigger value="finished" className="data-[state=active]:bg-[#892DD0] text-white">Finished</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#892DD0]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <img
                    src={project.image || "/placeholder.svg"}
                    alt={project.name}
                    className="w-full h-68 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
                    <h2 className="text-lg font-bold">{project.name}</h2>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        project.status === "active" ? "bg-green-600" : "bg-red-600"
                      } bg-opacity-70 inline-block mt-1`}
                    >
                      {project.status === "active" ? "Active" : "Finished"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Projects;
