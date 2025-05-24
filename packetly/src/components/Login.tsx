"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      navigate("/assets")
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("https://usabilidadaccesibilidad-25.onrender.com/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()
      console.log("Respuesta del backend:", data)

      if (response.ok) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("userId", data.user.id)
      // Justo después de guardar el token:
      const userRes = await fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${data.user.id}`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const userData = await userRes.json();
      console.log("Datos completos del usuario tras login:", userData);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/assets")
    } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error during log in", error)
      alert("Error while trying to with the server.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full min-h-screen items-center justify-center bg-[url(/assets/fondoua.png)] bg-center bg-cover p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in</CardTitle>
          <CardDescription>Enter your data to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button variant="link" className="h-auto p-0 text-xs" type="button">
                  Forgot password?
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button variant="link" className="h-auto p-0">
              <a href="/register">Sign up</a>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
