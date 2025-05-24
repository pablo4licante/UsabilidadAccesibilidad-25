import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginForm from "./components/Login";
import RegisterForm from "./components/Register";
import ModelViewerPage from "./pages/ModelViewerPage";
import Navbar from "./components/ui/Navbar";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import PerfilUsuario from "./pages/PerfilUsuario";
import UserSettings from "./components/EditProfile";
import ProjectsAssets from "./pages/ProjectsAssets";
import SingleAsset from "./pages/SingleAsset";
import AssetUpload from "./components/UploadAsset";
import DownloadAsset from "./components/DownloadAsset";
import Assets from "./pages/Assets";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/models" element={<ModelViewerPage />} />
        <Route path="/single-asset" element={<SingleAsset />} />
        <Route
          path="/upload-asset"
          element={<AssetUpload token={""} user={{ _id: "" }} />}
        />
        <Route
          path="/download-asset"
          element={
            <DownloadAsset
              assetId={""}
              open={false}
              onOpenChange={() => {}}
              token={""}
            />
          }
        />
        <Route path="/team" element={<Team />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/perfil-usuario" element={<PerfilUsuario />} />
        <Route path="/edit-perfil-usuario" element={<UserSettings />} />
        <Route path="/projectsAssets" element={<ProjectsAssets />} />
        <Route path="/assets" element={<Assets />} />
      </Routes>
    </>
  );
}

export default App;