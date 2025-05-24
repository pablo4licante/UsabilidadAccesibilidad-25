import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserSettings from "../components/EditProfile";
import { Star } from 'lucide-react';

const TYPE_OPTIONS = ["All Types", "image", "video", "sound", "model3d", "scripting"];

function getUserIdFromLocalStorage(): string | null {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;
  try {
    const parsed = JSON.parse(storedUser);
    if (parsed && parsed._id) {
      if (typeof parsed._id === "object" && parsed._id.$oid) {
        return parsed._id.$oid;
      }
      return parsed._id;
    } else if (parsed && parsed.id) {
      return parsed.id;
    }
    return null;
  } catch {
    return null;
  }
}

const AssetCard = ({ asset, onClick, onToggleFavorite }: { asset: any; onClick: () => void; onToggleFavorite?: (assetId: string, currentState: boolean) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  const placeholder = "assets/file.png";
  const soundplaceholder = "assets/sound.png";
  const scriptplaceholder = "assets/script.png";

  const getThumbnail = () => {
    if (asset.type === "model3d") {
      return asset.screenshot || placeholder;
    }
    if (asset.type === "image") {
      return asset.file_url || placeholder;
    }
    if (asset.type === "sound") {
      return soundplaceholder;
    }
    if (asset.type === "scripting") {
      return scriptplaceholder;
    }
    if (asset.type === "video") {
      return asset.file_url || placeholder;
    }
    return placeholder;
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      await onToggleFavorite(asset.id, asset.isFavorite);
    }
  };

  return (
    <div
      className="bg-zinc-800 rounded-lg overflow-hidden group relative cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {onToggleFavorite && (
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-200 ${
            isHovered || asset.isFavorite
              ? "bg-black/50 backdrop-blur-sm opacity-100"
              : "opacity-0 group-hover:opacity-100"
          } hover:bg-black/70`}
        >
          <Star
            className={`h-4 w-4 transition-colors duration-200 ${
              asset.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white hover:text-yellow-400"
            }`}
          />
        </button>
      )}
      <div className="relative aspect-square bg-zinc-700">
        {asset.type === "video" ? (
          <video
            src={asset.file_url}
            controls
            muted
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={getThumbnail() || "/placeholder.svg"}
            alt={asset.name || asset.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-white">{asset.name || asset.title}</h3>
        <p className="text-sm text-zinc-400">Type: {asset.type}</p>
      </div>
    </div>
  );
};

const PerfilUsuario = () => {
  const [selectedType, setSelectedType] = useState("All Types");
  const [isEditing, setIsEditing] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [favoriteAssets, setFavoriteAssets] = useState<any[]>([]);
  const [filteredFavoriteAssets, setFilteredFavoriteAssets] = useState<any[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[] | null>(null);
  const [selectedFavoriteType, setSelectedFavoriteType] = useState("All Types");
  const [activeTab, setActiveTab] = useState("myAssets"); // "myAssets" or "favorites"

  const fetchUserFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = getUserIdFromLocalStorage();

      if (!token || !userId) {
        const storedFavorites = localStorage.getItem("userFavorites");
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites);
          setUserFavorites(favorites);
        } else {
          setUserFavorites([]);
        }
        return;
      }

      const response = await fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${userId}/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const favorites = await response.json();
        const favoriteIds = favorites.map((fav: any) => fav.id);
        setUserFavorites(favoriteIds);
        localStorage.setItem("userFavorites", JSON.stringify(favoriteIds));
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      const storedFavorites = localStorage.getItem("userFavorites");
      if (storedFavorites) {
        const favorites = JSON.parse(storedFavorites);
        setUserFavorites(favorites);
      } else {
        setUserFavorites([]);
      }
    }
  };

  const fetchFavoriteAssets = async () => {
    if (!userFavorites || userFavorites.length === 0) {
      setFavoriteAssets([]);
      setFilteredFavoriteAssets([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://usabilidadaccesibilidad-25.onrender.com/api/assets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const allAssets = await response.json();
        const favoriteAssetsData = allAssets
          .filter((asset: any) => {
            const assetId = asset.id || (asset._id && asset._id.$oid ? asset._id.$oid : asset._id);
            return userFavorites.includes(assetId);
          })
          .map((asset: any) => ({
            ...asset,
            id: asset.id || (asset._id && asset._id.$oid ? asset._id.$oid : asset._id),
            name: asset.name || asset.title,
            isFavorite: true,
          }));

        setFavoriteAssets(favoriteAssetsData);
        setFilteredFavoriteAssets(favoriteAssetsData);
      }
    } catch (error) {
      console.error("Error fetching favorite assets:", error);
      setFavoriteAssets([]);
      setFilteredFavoriteAssets([]);
    }
  };

  const handleToggleFavorite = async (assetId: string, currentState: boolean) => {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromLocalStorage();

    if (!token || !userId) {
      updateFavoriteState(assetId, currentState);
      return;
    }

    try {
      let response;
      if (currentState) {
        response = await fetch(
          `https://usabilidadaccesibilidad-25.onrender.com/api/users/${userId}/favorites/${assetId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        response = await fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${userId}/favorites`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assetId }),
        });
      }

      if (response.ok) {
        updateFavoriteState(assetId, currentState);
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      updateFavoriteState(assetId, currentState);
    }
  };

  const updateFavoriteState = (assetId: string, currentState: boolean) => {
    if (!userFavorites) return;

    let newFavorites: string[];
    if (currentState) {
      newFavorites = userFavorites.filter((id) => id !== assetId);
    } else {
      newFavorites = [...userFavorites, assetId];
    }

    setUserFavorites(newFavorites);
    localStorage.setItem("userFavorites", JSON.stringify(newFavorites));

    // Update assets in both lists
    setAssets((prev) => prev.map((asset) => (asset.id === assetId ? { ...asset, isFavorite: !currentState } : asset)));
    setFavoriteAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    setFilteredFavoriteAssets((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const uid = getUserIdFromLocalStorage();

    fetch("https://usabilidadaccesibilidad-25.onrender.com/api/assets", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && uid) {
          const userAssets = data
            .filter((a: any) => {
              let ownerId = a.owner_id;
              if (ownerId && typeof ownerId === "object") {
                if (ownerId.$oid) {
                  ownerId = ownerId.$oid;
                } else if (ownerId._id) {
                  ownerId = ownerId._id;
                }
              }
              if (ownerId && typeof ownerId === "object" && ownerId.$oid) {
                ownerId = ownerId.$oid;
              }
              return ownerId && ownerId.toString() === uid.toString();
            })
            .map((a: any) => ({
              ...a,
              id: a.id || (a._id && a._id.$oid ? a._id.$oid : a._id),
            }));
          setAssets(userAssets);
        } else {
          setAssets([]);
        }
      })
      .catch(() => setAssets([]))
      .finally(() => setIsLoading(false));

    if (uid) {
      fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch(() => setUser(null));
    }
  }, []);

  useEffect(() => {
    fetchUserFavorites();
  }, []);

  useEffect(() => {
    if (userFavorites !== null) {
      fetchFavoriteAssets();
    }
  }, [userFavorites]);

  useEffect(() => {
    if (selectedFavoriteType === "All Types") {
      setFilteredFavoriteAssets(favoriteAssets);
    } else {
      setFilteredFavoriteAssets(favoriteAssets.filter((asset) => asset.type === selectedFavoriteType));
    }
  }, [favoriteAssets, selectedFavoriteType]);

  const filteredAssets =
    selectedType === "All Types"
      ? assets
      : assets.filter((asset) => asset.type === selectedType);

  return (
    <main className={`p-6 mt-16 bg-[#191919] text-white min-h-screen relative`}>
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 pointer-events-none"></div>
          <div className="relative bg-[#131313] rounded-lg shadow-lg p-6 w-full max-w-2xl z-10">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
              onClick={() => setIsEditing(false)}
            >
              ✕
            </button>
            <UserSettings />
          </div>
        </div>
      )}
      <div
        className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${
          isEditing ? "pointer-events-none" : ""
        }`}
      >
        <div className="lg:col-span-3">
          {/* Tab Navigation */}
          <div className="flex mb-6 border-b border-zinc-700">
            <button
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "myAssets"
                  ? "text-white border-b-2 border-[#892DD0]"
                  : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("myAssets")}
            >
              My Assets
            </button>
            <button
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "favorites"
                  ? "text-white border-b-2 border-[#892DD0]"
                  : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("favorites")}
            >
              Favorite Assets
            </button>
          </div>

          {activeTab === "myAssets" ? (
            <>
              <h1 className="text-4xl font-bold mb-6 text-left">My Assets</h1>
              <div className="mb-6">
                <select
                  className="bg-[#131313] text-white py-2 px-4 rounded w-48"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(6)].map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-800 rounded-lg overflow-hidden animate-pulse"
                    >
                      <div className="aspect-square bg-zinc-700"></div>
                      <div className="p-3">
                        <div className="h-5 bg-zinc-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onClick={() => navigate(`/single-asset?id=${asset.id}`)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-400 col-span-full text-left">
                      There is no such asset
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-6 text-left">Favorite Assets</h1>
              <div className="mb-6">
                <select
                  className="bg-[#131313] text-white py-2 px-4 rounded w-48"
                  value={selectedFavoriteType}
                  onChange={(e) => setSelectedFavoriteType(e.target.value)}
                >
                  {TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {userFavorites === null ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-800 rounded-lg overflow-hidden animate-pulse"
                    >
                      <div className="aspect-square bg-zinc-700"></div>
                      <div className="p-3">
                        <div className="h-5 bg-zinc-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredFavoriteAssets.length > 0 ? (
                    filteredFavoriteAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        onClick={() => navigate(`/single-asset?id=${asset.id}`)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-400 col-span-full text-left">
                      {userFavorites.length === 0 ? "No favorite assets yet" : "No favorite assets match the selected filter"}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="bg-[#131313] rounded-lg p-6 shadow-lg self-start">
          <img
            src={user?.profile_photo || "/placeholder.svg"}
            alt="User Profile"
            className="w-60 h-60 rounded-full mx-auto object-cover mb-4"
          />
          <h2 className="text-center font-bold" style={{ fontSize: "2rem" }}>
            {user?.username ? user.username : "User"}
          </h2>
          <button
            className="bg-[#892DD0] text-white py-2 px-4 rounded mt-4 w-full hover:bg-[#6b23a8]"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        </div>
      </div>
    </main>
  );
};

export default PerfilUsuario;