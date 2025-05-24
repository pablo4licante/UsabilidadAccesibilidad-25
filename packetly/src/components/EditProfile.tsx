"use client";

import { useState, useEffect } from "react";
import { Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

// Función para obtener el _id del usuario desde localStorage
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

export default function UserSettings() {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const uid = getUserIdFromLocalStorage();
    if (token && uid) {
      fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setDisplayName(data.username || "");
          setEmail(data.email || "");
          setPreviewPhoto(data.profile_photo || null);
        })
        .catch(() => setUser(null));
    }
  }, []);

  // Manejar selección de nueva foto
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
      setPreviewPhoto(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    const token = localStorage.getItem("token");
    const uid = getUserIdFromLocalStorage();
    if (!token || !uid) {
      setErrorMsg("No user session found.");
      setLoading(false);
      return;
    }

    // Si hay foto, primero subimos la foto y luego el resto de datos
    let photoUrl = user?.profile_photo || "";
    if (profilePhoto) {
      const formData = new FormData();
      formData.append("profile_photo", profilePhoto);
      try {
        const res = await fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${uid}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        } as any); // as any para evitar error de typescript con headers+formdata
        if (!res.ok) {
          throw new Error("Photo upload failed");
        }
        const data = await res.json();
        photoUrl = data.profile_photo || photoUrl;
      } catch {
        setErrorMsg("Error uploading photo.");
        setLoading(false);
        return;
      }
    }

  // Usar FormData si hay foto
  let body: any;
  let isFormData = false;

  if (profilePhoto) {
    body = new FormData();
    body.append("username", displayName);
    body.append("email", email);
    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg("Current password required to change password.");
        setLoading(false);
        return;
      }
      body.append("password", newPassword);
      body.append("currentPassword", currentPassword);
    }
    body.append("profile_photo", profilePhoto);
    isFormData = true;
  } else {
    body = {
      username: displayName,
      email,
    };
    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg("Current password required to change password.");
        setLoading(false);
        return;
      }
      body.password = newPassword;
      body.currentPassword = currentPassword;
    }
  }

  try {
    const res = await fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${uid}`, {
      method: "PATCH",
      headers: isFormData
        ? { Authorization: `Bearer ${token}` }
        : {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
      body: isFormData ? body : JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      setErrorMsg(err.message || "Update failed.");
    } else {
      const updated = await res.json();
      setUser(updated);
      setSuccessMsg("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setProfilePhoto(null);
      navigate(0);
      localStorage.setItem("user", JSON.stringify(updated));
    }
  } catch {
    setErrorMsg("Network error.");
  }
  setLoading(false);
};

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#131313] rounded-lg p-6 text-white shadow-lg">
      <h2 className="text-center text-2xl font-bold mb-6">Account Settings</h2>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <img
            src={previewPhoto ? previewPhoto : "/placeholder.svg?height=120&width=120"}
            alt="Profile"
            className="h-28 w-28 rounded-full object-cover"
          />
          <label
            htmlFor="profile-photo-upload"
            className="absolute bottom-0 right-0 rounded-full bg-white p-1.5 text-black cursor-pointer"
            title="Change profile photo"
          >
            <Edit2 size={16} />
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        </div>
        <h3 className="text-2xl font-bold">{user?.username ? user.username : "User"}</h3>
        <p className="text-gray-400">{user?.email ? user.email : ""}</p>
      </div>
      <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="displayName" className="block text-gray-300">
            New Display Name
          </label>
          <Input
            id="displayName"
            placeholder="Name"
            className="bg-gray-800 text-white placeholder:text-gray-500"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-gray-300">
            New Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            className="bg-gray-800 text-white placeholder:text-gray-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="currentPassword" className="block text-gray-300">
            Current Password
          </label>
          <Input
            id="currentPassword"
            type="password"
            placeholder="Password"
            className="bg-gray-800 text-white placeholder:text-gray-500"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-gray-300">
            New Password
          </label>
          <Input
            id="newPassword"
            type="password"
            placeholder="Password"
            className="bg-gray-800 text-white placeholder:text-gray-500"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
        </div>
        {successMsg && <p className="text-green-400">{successMsg}</p>}
        {errorMsg && <p className="text-red-400">{errorMsg}</p>}
        <div className="flex justify-between mt-6">
          <Button variant="destructive" type="button">Sign out</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Submit changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
