import React, { useState, useEffect } from "react";
import { Github, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useNavigate } from "react-router-dom";
import Navbar from "./ui/Navbar";

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile_photo: null as File | null,
    termsAccepted: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/assets");
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files) {
      setFormData({
        ...formData,
        profile_photo: files[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("The password doesn't match.");
      return;
    }

    if (!formData.termsAccepted) {
      alert("You must accept the terms and conditions.");
      return;
    }

    if (!formData.profile_photo) {
      alert("You must upload a profile photo.");
      return;
    }

    setIsLoading(true);

    try {
      const formPayload = new FormData();
      formPayload.append("name", formData.username);
      formPayload.append("email", formData.email);
      formPayload.append("password", formData.password);
      formPayload.append("profile_photo", formData.profile_photo);

      const response = await fetch(
        "https://usabilidadaccesibilidad-25.onrender.com/api/users",
        {
          method: "POST",
          body: formPayload,
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Successful registration.");
        window.location.href = "/login";
      } else {
        alert("Error: User not created.");
      }
    } catch (error) {
      console.error("Error registering:", error);
      alert("Error while trying to connect with the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[url(/assets/fondoua.png)] bg-center bg-cover px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_photo">Profile Photo</Label>
                <Input
                  id="profile_photo"
                  name="profile_photo"
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  required
                  className="h-4 w-4"
                  onChange={(e) =>
                    setFormData({ ...formData, termsAccepted: e.target.checked })
                  }
                  disabled={isLoading}
                />
                <Label htmlFor="termsAccepted">Accept terms and conditions</Label>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Loading..." : "Register"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="h-auto p-0">
              <a href="/login">Sign in</a>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
