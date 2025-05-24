import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
let fondoImage = "/assets/fondoua.png";
let logo = "/assets/icon_packetly.svg";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center text-white text-center px-4"
      style={{ backgroundImage: `url(${fondoImage})` }}
    >
      {/* Logo blanco grande */}
      <img src={logo} alt="Logo" className="w-24 h-24 mb-6 invert brightness-200" />

      <h1 className="text-5xl font-bold mb-4">Packetly</h1>
      <p className="text-xl italic mb-6">
        All your project files <strong>tightly packed</strong> in one place
      </p>
      <a
        href="/register"
        className="bg-black text-white py-2 px-6 rounded hover:bg-gray-800 transition"
      >
        Join in
      </a>
    </div>
  );
};

export default Home;
