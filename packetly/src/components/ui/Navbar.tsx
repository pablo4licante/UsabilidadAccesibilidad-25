"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Package, Upload, Menu, SearchIcon, X } from "lucide-react"

// Componente de búsqueda independiente con estado local
interface SearchComponentProps {
  onSearch: (searchQuery: string) => void;
}

const SearchComponent = ({ onSearch }: SearchComponentProps) => {
  // Estado local independiente del componente padre
  const [localSearchQuery, setLocalSearchQuery] = useState("")

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!localSearchQuery.trim()) return
    onSearch(localSearchQuery)
  }

  return (
    <form onSubmit={handleLocalSubmit} className="flex items-center gap-2 w-full lg:w-auto">
      <div className="relative w-full lg:w-auto">
        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
        <input
          type="text"
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          placeholder="Search asset..."
          className="bg-black border border-white text-white pl-8 h-9 w-full lg:w-auto px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-white"
        />
      </div>
      <Button type="submit" className="bg-white text-black px-3 py-1 rounded hover:bg-gray-300 whitespace-nowrap h-9">
        Search
      </Button>
    </form>
  )
}

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user") || "null"));
  }, [location]);
    
  useEffect(() => {
    // Escucha cambios en localStorage (por ejemplo, desde EditProfile)
    const handleStorage = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    };
    window.addEventListener("storage", handleStorage);

    // Si vuelves de editar perfil en la misma pestaña, fuerza refresco del user
    const interval = setInterval(() => {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);


  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button[aria-label="Toggle menu"]')
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [mobileMenuRef])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    navigate("/")
  }

  const handleSearch = (searchQuery: string) => {
    // Navigate to assets page with search parameter
    navigate(`/assets?search=${encodeURIComponent(searchQuery.trim())}`)

    // Close mobile search if open
    if (isMobile) {
      setIsSearchOpen(false)
    }
  }

  const NavLinks = () => (
    <div className="flex lg:flex-row flex-col lg:items-center gap-6 text-sm font-medium">
      <span
        onClick={() => {
          navigate("/assets")
          setIsMobileMenuOpen(false)
        }}
        className="cursor-pointer hover:underline py-2 lg:py-0"
      >
        Assets
      </span>
      <span
        onClick={() => {
          navigate("/projects")
          setIsMobileMenuOpen(false)
        }}
        className="cursor-pointer hover:underline py-2 lg:py-0"
      >
        Projects
      </span>
      <span
        onClick={() => {
          navigate("/team")
          setIsMobileMenuOpen(false)
        }}
        className="cursor-pointer hover:underline py-2 lg:py-0"
      >
        Team
      </span>
    </div>
  )

  const UserActions = () => (
    <>
      <Button variant="outline"
        onClick={() => navigate("/upload-asset")}
        className="border border-white text-white hover:bg-white hover:text-black px-3 py-1 flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        <span className="lg:inline hidden">Upload</span>
      </Button>

      <span
        onClick={() => navigate("/perfil-usuario")}
        className="text-white hover:text-purple-500 cursor-pointer flex items-center gap-2"
      >
        Hi, {user.username}
        <img
          src={user.profile_photo}
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover border border-white ml-2"
        />
      </span>

      <Button variant="outline"
        onClick={handleLogout}
        className="border border-white text-white hover:bg-white hover:text-black px-3 py-1"
      >
        <span className="lg:inline hidden">Log out</span>
        <span className="lg:hidden inline">Exit</span>
      </Button>
    </>
  )

  return (
    <>
      <nav className="w-full bg-black text-white p-4 flex justify-between items-center fixed top-0 z-50 shadow-md">
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Mobile menu trigger */}
          {user && isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white p-0 lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

          {/* Logo Packetly */}
          <div
            className={`text-xl font-semibold flex items-center cursor-pointer ${user ? "hover:underline" : ""}`}
            onClick={() => user && navigate("/assets")}
          >
            <Package className="mr-1" />
            <span className="lg:inline inline">Packetly</span>
          </div>

          {/* Navigation links only for logged-in users - desktop view */}
          {user && !isMobile && <NavLinks />}
        </div>

        {/* Search - desktop view */}
        {user && !isMobile && <SearchComponent onSearch={handleSearch} />}

        {/* Mobile search toggle */}
        {user && isMobile && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-white p-0 ml-auto"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
              <span className="sr-only">Toggle search</span>
            </Button>
          </div>
        )}

        {/* User actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {user ? <UserActions /> : <span className="text-white">You're not logged in</span>}
        </div>
      </nav>

      {/* Mobile search form - expanded */}
      {user && isMobile && isSearchOpen && (
        <div className="fixed top-16 left-0 right-0 bg-black p-4 border-t border-white z-40">
          <SearchComponent onSearch={handleSearch} />
        </div>
      )}

      {/* Mobile menu - expanded */}
      {user && isMobile && isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed top-16 left-0 bottom-0 w-64 bg-black text-white border-r border-white z-40 p-6 shadow-lg"
        >
          <div className="flex flex-col gap-6">
            <NavLinks />
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar