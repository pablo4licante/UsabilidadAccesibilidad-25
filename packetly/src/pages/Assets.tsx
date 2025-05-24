"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { SlidersHorizontal, ChevronDown, Star } from "lucide-react"

const placeholder = "assets/file.png"
const soundplaceholder = "assets/sound.png"
const scriptplaceholder = "assets/script.png"

interface Asset {
  id: string
  title: string
  type: string
  file_url: string
  screenshot: string
  isFavorite: boolean
  // Subfiltros
  enviroment?: string
  size?: string
  condition?: string
  polycount?: string
  duration?: string
  bitrate?: string
  resolution?: string
  color_depth?: string
  frame_rate?: string
  language?: string
}

interface FilterOption {
  id: string
  label: string
  options: string[]
  selected: string
}

interface Model3dFilter {
  enviroment: string
  size: string
  condition: string
  polycount: string
}
interface SoundFilter {
  duration: string
  bitrate: string
}
interface ImageFilter {
  resolution: string
  color_depth: string
}
interface VideoFilter {
  resolution: string
  duration: string
  frame_rate: string
}
interface ScriptingFilter {
  language: string
}

// Opciones para los filtros secundarios
const MODEL3D_ENVIROMENT_OPTIONS = ["All", "Indoor", "Outdoor", "Space", "Fantasy"]
const MODEL3D_SIZE_OPTIONS = ["All", "Small", "Medium", "Large"]
const MODEL3D_CONDITION_OPTIONS = ["All", "New", "Used", "Damaged"]
const MODEL3D_POLYCOUNT_OPTIONS = ["All", "< 1k", "1k - 10k", "10k - 100k", "> 100k"]

const SOUND_DURATION_OPTIONS = ["All", "< 10s", "10s - 30s", "30s - 60s", "> 60s"]
const SOUND_BITRATE_OPTIONS = ["All", "< 128", "128 - 192", "192 - 256", "256 - 320", "> 320"]

const IMAGE_RESOLUTION_OPTIONS = ["All", "< 512x512", "512x512 - 1024x1024", "1024x1024 - 2048x2048", "> 2048x2048"]
const IMAGE_COLOR_DEPTH_OPTIONS = ["All", "8-bit", "16-bit", "24-bit", "32-bit"]

const VIDEO_RESOLUTION_OPTIONS = ["All", "< 720p", "720p - 1080p", "1080p - 2K", "> 2K"]
const VIDEO_DURATION_OPTIONS = ["All", "< 30s", "30s - 60s", "1m - 5m", "> 5m"]
const VIDEO_FRAMERATE_OPTIONS = ["All", "< 24", "24 - 30", "30 - 50", "> 50"]

const SCRIPTING_LANGUAGE_OPTIONS = [
  "All",
  "js",
  "jsx",
  "ts",
  "tsx",
  "html",
  "css",
  "json",
  "py",
  "java",
  "c",
  "cpp",
  "cs",
  "php",
  "rb",
  "go",
  "rust",
  "swift",
]

const AssetCard = ({
  asset,
  onClick,
  onToggleFavorite,
}: {
  asset: Asset
  onClick: () => void
  onToggleFavorite: (assetId: string, currentState: boolean) => void
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

  const getThumbnail = () => {
    if (asset.type === "model3d") {
      return asset.screenshot || placeholder
    }
    if (asset.type === "image") {
      return asset.file_url || placeholder
    }
    if (asset.type === "sound") {
      return soundplaceholder
    }
    if (asset.type === "scripting") {
      return scriptplaceholder
    }
    return placeholder
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Favorite button clicked for asset:", asset.id)
    setIsTogglingFavorite(true)
    try {
      await onToggleFavorite(asset.id, asset.isFavorite)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  return (
    <div
      className="bg-zinc-800 rounded-lg overflow-hidden group relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Botón de favorito en la esquina superior derecha */}
      <button
        onClick={handleFavoriteClick}
        disabled={isTogglingFavorite}
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all duration-200 ${
          isHovered || asset.isFavorite
            ? "bg-black/50 backdrop-blur-sm opacity-100"
            : "opacity-0 group-hover:opacity-100"
        } hover:bg-black/70 disabled:opacity-50`}
      >
        <Star
          className={`h-4 w-4 transition-colors duration-200 ${
            asset.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white hover:text-yellow-400"
          }`}
        />
      </button>

      <div className="relative aspect-square bg-zinc-700">
        {asset.type === "video" ? (
          <video src={asset.file_url} controls muted loop className="w-full h-full object-cover" />
        ) : (
          <img src={getThumbnail() || "/placeholder.svg"} alt={asset.title} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-white">{asset.title}</h3>
        <p className="text-sm text-zinc-400">Type: {asset.type}</p>
      </div>
    </div>
  )
}

const AssetGrid = ({
  assets,
  isLoading,
  onCardClick,
  onToggleFavorite,
}: {
  assets: Asset[]
  isLoading: boolean
  onCardClick: (id: string) => void
  onToggleFavorite: (assetId: string, currentState: boolean) => void
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-zinc-800 rounded-lg overflow-hidden animate-pulse">
            <div className="aspect-square bg-zinc-700"></div>
            <div className="p-3">
              <div className="h-5 bg-zinc-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No assets found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={() => onCardClick(asset.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}

const FilterDropdown = ({
  filter,
  onChange,
}: { filter: FilterOption; onChange: (id: string, value: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {filter.label}: {filter.selected} <ChevronDown className="h-4 w-4 ml-1" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-800 rounded-md shadow-lg z-10 min-w-[150px]">
          {filter.options.map((option) => (
            <button
              key={option}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 ${
                filter.selected === option ? "bg-zinc-700" : ""
              }`}
              onClick={() => {
                onChange(filter.id, option)
                setIsOpen(false)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const Assets = () => {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [userFavorites, setUserFavorites] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOption[]>([
    {
      id: "type",
      label: "Type",
      options: ["All Types", "image", "video", "sound", "model3d", "scripting"],
      selected: "All Types",
    },
  ])

  // Filtros secundarios
  const [model3dFilter, setModel3dFilter] = useState<Model3dFilter>({
    enviroment: "All",
    size: "All",
    condition: "All",
    polycount: "All",
  })
  const [soundFilter, setSoundFilter] = useState<SoundFilter>({
    duration: "All",
    bitrate: "All",
  })
  const [imageFilter, setImageFilter] = useState<ImageFilter>({
    resolution: "All",
    color_depth: "All",
  })
  const [videoFilter, setVideoFilter] = useState<VideoFilter>({
    resolution: "All",
    duration: "All",
    frame_rate: "All",
  })
  const [scriptingFilter, setScriptingFilter] = useState<ScriptingFilter>({
    language: "All",
  })

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
    }
  }, [navigate])

  const searchParams = new URLSearchParams(location.search)
  const searchQuery = searchParams.get("search") || ""

  // Función para obtener los favoritos del usuario desde la API
  const fetchUserFavorites = async () => {
    try {
      const token = localStorage.getItem("token")
      const userId = localStorage.getItem("userId")

      console.log("Checking localStorage - token:", !!token, "userId:", userId)

      if (!token || !userId) {
        console.log("No token or userId found, using localStorage")
        const storedFavorites = localStorage.getItem("userFavorites")
        if (storedFavorites) {
          const favorites = JSON.parse(storedFavorites)
          console.log("Loaded favorites from localStorage:", favorites)
          setUserFavorites(favorites)
        } else {
          setUserFavorites([])
        }
        return
      }

      console.log("Fetching favorites from API for user:", userId)
      const response = await fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${userId}/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Favorites API response status:", response.status)

      if (response.ok) {
        const favorites = await response.json()
        const favoriteIds = favorites.map((fav: any) => fav.id)
        console.log("Loaded favorites from API:", favoriteIds)
        setUserFavorites(favoriteIds)
        localStorage.setItem("userFavorites", JSON.stringify(favoriteIds))
      } else {
        const errorText = await response.text()
        console.log("API Error response:", errorText)
        throw new Error(`API Error: ${response.status}`)
      }
    } catch (error) {
      console.warn("API not available, using localStorage:", error)
      const storedFavorites = localStorage.getItem("userFavorites")
      if (storedFavorites) {
        const favorites = JSON.parse(storedFavorites)
        setUserFavorites(favorites)
      } else {
        setUserFavorites([])
      }
    }
  }

  // Función para toggle favorito con API y localStorage como fallback
  const handleToggleFavorite = async (assetId: string, currentState: boolean) => {
    console.log("Toggle favorite clicked:", assetId, "Current state:", currentState)

    const token = localStorage.getItem("token")
    const userId = localStorage.getItem("userId")

    console.log("Token exists:", !!token, "UserId:", userId)

    if (!token) {
      console.log("No token found")
      return
    }

    if (!userId) {
      console.log("No userId found, using localStorage only")
      updateFavoriteState(assetId, currentState)
      return
    }

    try {
      let response

      if (currentState) {
        // Quitar de favoritos - DELETE /api/users/:id/favorites/:assetId
        console.log(`Making DELETE request to remove asset ${assetId} from favorites for user ${userId}`)
        response = await fetch(
          `https://usabilidadaccesibilidad-25.onrender.com/api/users/${userId}/favorites/${assetId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
      } else {
        // Añadir a favoritos - POST /api/users/:id/favorites
        console.log(`Making POST request to add asset ${assetId} to favorites for user ${userId}`)
        response = await fetch(`https://usabilidadaccesibilidad-25.onrender.com/api/users/${userId}/favorites`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ assetId }),
        })
      }

      console.log("API Response status:", response.status)

      if (response.ok) {
        console.log("API call successful, updating state")
        updateFavoriteState(assetId, currentState)
      } else {
        const errorData = await response.text()
        console.error("API Error:", response.status, errorData)
        throw new Error(`API Error: ${response.status}`)
      }
    } catch (error) {
      console.warn("API call failed, using localStorage only:", error)
      updateFavoriteState(assetId, currentState)
    }
  }

  // Función auxiliar para actualizar el estado de favoritos
  const updateFavoriteState = (assetId: string, currentState: boolean) => {
    if (!userFavorites) return

    let newFavorites: string[]

    if (currentState) {
      // Quitar de favoritos
      newFavorites = userFavorites.filter((id) => id !== assetId)
      console.log(`Removed ${assetId} from favorites`)
    } else {
      // Añadir a favoritos
      newFavorites = [...userFavorites, assetId]
      console.log(`Added ${assetId} to favorites`)
    }

    // Actualizar estado local
    setUserFavorites(newFavorites)

    // Guardar en localStorage
    localStorage.setItem("userFavorites", JSON.stringify(newFavorites))

    // Actualizar el asset en la lista
    setAssets((prev) => prev.map((asset) => (asset.id === assetId ? { ...asset, isFavorite: !currentState } : asset)))

    console.log("New favorites state:", newFavorites)
  }

  // Cargar favoritos PRIMERO al montar el componente
  useEffect(() => {
    fetchUserFavorites()
  }, [])

  // Cargar assets DESPUÉS de que se hayan cargado los favoritos
  useEffect(() => {
    const fetchAssets = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const assetsResponse = await fetch("https://usabilidadaccesibilidad-25.onrender.com/api/assets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!assetsResponse.ok) throw new Error("Error al obtener assets")
        const assetsData = await assetsResponse.json()

        // Mapear todos los campos posibles para los subfiltros
        const formatted: Asset[] = assetsData.map((a: any) => ({
          id: a.id,
          title: a.name,
          type: a.type,
          file_url: a.file_url,
          screenshot: a.screenshot || null,
          isFavorite: userFavorites ? userFavorites.includes(a.id) : false,
          // Subfiltros (solo si existen en el asset)
          enviroment: a.enviroment,
          size: a.size,
          condition: a.condition,
          polycount: a.polycount,
          duration: a.duration,
          bitrate: a.bitrate,
          resolution: a.resolution,
          color_depth: a.color_depth,
          frame_rate: a.frame_rate,
          language: a.language,
        }))

        setAssets(formatted)
        setFilteredAssets(formatted)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    // Solo cargar assets cuando userFavorites esté disponible
    if (userFavorites !== null) {
      fetchAssets()
    }
  }, [userFavorites])

  // Actualizar isFavorite cuando cambien los favoritos del usuario
  useEffect(() => {
    if (userFavorites === null) return

    setAssets((prev) =>
      prev.map((asset) => ({
        ...asset,
        isFavorite: userFavorites.includes(asset.id),
      })),
    )
  }, [userFavorites])

  const searchAssets = (query: string) => {
    if (!query) {
      setFilteredAssets(assets)
      return
    }

    const lowercasedQuery = query.toLowerCase()
    const filtered = assets.filter((asset) => asset.title.toLowerCase().includes(lowercasedQuery))
    setFilteredAssets(filtered)
  }

  useEffect(() => {
    if (assets.length === 0) return

    let result = [...assets]

    if (searchQuery) {
      result = result.filter((asset) => asset.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    const typeFilter = filters.find((f) => f.id === "type")
    const selectedType = typeFilter?.selected || "All Types"

    if (selectedType !== "All Types") {
      result = result.filter((asset) => asset.type === selectedType)

      // Filtros secundarios por tipo
      if (selectedType === "model3d") {
        if (model3dFilter.enviroment !== "All")
          result = result.filter((a: any) => a.enviroment === model3dFilter.enviroment)
        if (model3dFilter.size !== "All") result = result.filter((a: any) => a.size === model3dFilter.size)
        if (model3dFilter.condition !== "All")
          result = result.filter((a: any) => a.condition === model3dFilter.condition)
        if (model3dFilter.polycount !== "All") {
          result = result.filter((a: any) => {
            const poly = Number.parseInt(a.polycount || "0")
            if (model3dFilter.polycount === "< 1k") return poly < 1000
            if (model3dFilter.polycount === "1k - 10k") return poly >= 1000 && poly < 10000
            if (model3dFilter.polycount === "10k - 100k") return poly >= 10000 && poly < 100000
            if (model3dFilter.polycount === "> 100k") return poly >= 100000
            return true
          })
        }
      }
      if (selectedType === "sound") {
        if (soundFilter.duration !== "All") {
          result = result.filter((a: any) => {
            const dur = Number.parseInt(a.duration || "0")
            if (soundFilter.duration === "< 10s") return dur < 10
            if (soundFilter.duration === "10s - 30s") return dur >= 10 && dur < 30
            if (soundFilter.duration === "30s - 60s") return dur >= 30 && dur < 60
            if (soundFilter.duration === "> 60s") return dur >= 60
            return true
          })
        }
        if (soundFilter.bitrate !== "All") {
          result = result.filter((a: any) => {
            const br = Number.parseInt(a.bitrate || "0")
            if (soundFilter.bitrate === "< 128") return br < 128
            if (soundFilter.bitrate === "128 - 192") return br >= 128 && br < 192
            if (soundFilter.bitrate === "192 - 256") return br >= 192 && br < 256
            if (soundFilter.bitrate === "256 - 320") return br >= 256 && br < 320
            if (soundFilter.bitrate === "> 320") return br >= 320
            return true
          })
        }
      }
      if (selectedType === "image") {
        if (imageFilter.resolution !== "All") {
          result = result.filter((a: any) => {
            // Espera formato "WxH"
            const [w, h] = (a.resolution || "").split("x").map(Number)
            const maxDim = Math.max(w || 0, h || 0)
            if (imageFilter.resolution === "< 512x512") return maxDim < 512
            if (imageFilter.resolution === "512x512 - 1024x1024") return maxDim >= 512 && maxDim < 1024
            if (imageFilter.resolution === "1024x1024 - 2048x2048") return maxDim >= 1024 && maxDim < 2048
            if (imageFilter.resolution === "> 2048x2048") return maxDim >= 2048
            return true
          })
        }
        if (imageFilter.color_depth !== "All") {
          result = result.filter((a: any) => a.color_depth === imageFilter.color_depth)
        }
      }
      if (selectedType === "video") {
        if (videoFilter.resolution !== "All") {
          result = result.filter((a: any) => {
            // Espera formato "WxH"
            const [w, h] = (a.resolution || "").split("x").map(Number)
            const maxDim = Math.max(w || 0, h || 0)
            if (videoFilter.resolution === "< 720p") return maxDim < 720
            if (videoFilter.resolution === "720p - 1080p") return maxDim >= 720 && maxDim < 1080
            if (videoFilter.resolution === "1080p - 2K") return maxDim >= 1080 && maxDim < 2048
            if (videoFilter.resolution === "> 2K") return maxDim >= 2048
            return true
          })
        }
        if (videoFilter.duration !== "All") {
          result = result.filter((a: any) => {
            const dur = Number.parseInt(a.duration || "0")
            if (videoFilter.duration === "< 30s") return dur < 30
            if (videoFilter.duration === "30s - 60s") return dur >= 30 && dur < 60
            if (videoFilter.duration === "1m - 5m") return dur >= 60 && dur < 300
            if (videoFilter.duration === "> 5m") return dur >= 300
            return true
          })
        }
        if (videoFilter.frame_rate !== "All") {
          result = result.filter((a: any) => {
            const fr = Number.parseFloat(a.frame_rate || "0")
            if (videoFilter.frame_rate === "< 24") return fr < 24
            if (videoFilter.frame_rate === "24 - 30") return fr >= 24 && fr < 30
            if (videoFilter.frame_rate === "30 - 50") return fr >= 30 && fr < 50
            if (videoFilter.frame_rate === "> 50") return fr >= 50
            return true
          })
        }
      }
      if (selectedType === "scripting") {
        if (scriptingFilter.language !== "All") {
          result = result.filter((a: any) => a.language === scriptingFilter.language)
        }
      }
    } else {
      // Solo mostrar assets que sean de los tipos válidos
      result = result.filter((asset) => ["image", "video", "sound", "model3d", "scripting"].includes(asset.type))
    }

    setFilteredAssets(result)
  }, [
    assets,
    filters,
    searchQuery,
    model3dFilter.enviroment,
    model3dFilter.size,
    model3dFilter.condition,
    model3dFilter.polycount,
    soundFilter.duration,
    soundFilter.bitrate,
    imageFilter.resolution,
    imageFilter.color_depth,
    videoFilter.resolution,
    videoFilter.duration,
    videoFilter.frame_rate,
    scriptingFilter.language,
  ])

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(filters.map((f) => (f.id === filterId ? { ...f, selected: value } : f)))
    // Reset secondary filters when type changes
    if (filterId === "type") {
      setModel3dFilter({ enviroment: "All", size: "All", condition: "All", polycount: "All" })
      setSoundFilter({ duration: "All", bitrate: "All" })
      setImageFilter({ resolution: "All", color_depth: "All" })
      setVideoFilter({ resolution: "All", duration: "All", frame_rate: "All" })
      setScriptingFilter({ language: "All" })
    }
  }

  // Renderiza los filtros secundarios según el tipo seleccionado
  const renderSecondaryFilters = () => {
    const typeFilter = filters.find((f) => f.id === "type")
    const selectedType = typeFilter?.selected || "All Types"
    if (selectedType === "model3d") {
      return (
        <>
          <FilterDropdown
            filter={{
              id: "enviroment",
              label: "Enviroment",
              options: MODEL3D_ENVIROMENT_OPTIONS,
              selected: model3dFilter.enviroment,
            }}
            onChange={(_, v) => setModel3dFilter((f) => ({ ...f, enviroment: v }))}
          />
          <FilterDropdown
            filter={{
              id: "size",
              label: "Size",
              options: MODEL3D_SIZE_OPTIONS,
              selected: model3dFilter.size,
            }}
            onChange={(_, v) => setModel3dFilter((f) => ({ ...f, size: v }))}
          />
          <FilterDropdown
            filter={{
              id: "condition",
              label: "Condition",
              options: MODEL3D_CONDITION_OPTIONS,
              selected: model3dFilter.condition,
            }}
            onChange={(_, v) => setModel3dFilter((f) => ({ ...f, condition: v }))}
          />
          <FilterDropdown
            filter={{
              id: "polycount",
              label: "Polycount",
              options: MODEL3D_POLYCOUNT_OPTIONS,
              selected: model3dFilter.polycount,
            }}
            onChange={(_, v) => setModel3dFilter((f) => ({ ...f, polycount: v }))}
          />
        </>
      )
    }
    if (selectedType === "sound") {
      return (
        <>
          <FilterDropdown
            filter={{
              id: "duration",
              label: "Duration",
              options: SOUND_DURATION_OPTIONS,
              selected: soundFilter.duration,
            }}
            onChange={(_, v) => setSoundFilter((f) => ({ ...f, duration: v }))}
          />
          <FilterDropdown
            filter={{
              id: "bitrate",
              label: "Bitrate",
              options: SOUND_BITRATE_OPTIONS,
              selected: soundFilter.bitrate,
            }}
            onChange={(_, v) => setSoundFilter((f) => ({ ...f, bitrate: v }))}
          />
        </>
      )
    }
    if (selectedType === "image") {
      return (
        <>
          <FilterDropdown
            filter={{
              id: "resolution",
              label: "Resolution",
              options: IMAGE_RESOLUTION_OPTIONS,
              selected: imageFilter.resolution,
            }}
            onChange={(_, v) => setImageFilter((f) => ({ ...f, resolution: v }))}
          />
          <FilterDropdown
            filter={{
              id: "color_depth",
              label: "Color Depth",
              options: IMAGE_COLOR_DEPTH_OPTIONS,
              selected: imageFilter.color_depth,
            }}
            onChange={(_, v) => setImageFilter((f) => ({ ...f, color_depth: v }))}
          />
        </>
      )
    }
    if (selectedType === "video") {
      return (
        <>
          <FilterDropdown
            filter={{
              id: "resolution",
              label: "Resolution",
              options: VIDEO_RESOLUTION_OPTIONS,
              selected: videoFilter.resolution,
            }}
            onChange={(_, v) => setVideoFilter((f) => ({ ...f, resolution: v }))}
          />
          <FilterDropdown
            filter={{
              id: "duration",
              label: "Duration",
              options: VIDEO_DURATION_OPTIONS,
              selected: videoFilter.duration,
            }}
            onChange={(_, v) => setVideoFilter((f) => ({ ...f, duration: v }))}
          />
          <FilterDropdown
            filter={{
              id: "frame_rate",
              label: "Frame Rate",
              options: VIDEO_FRAMERATE_OPTIONS,
              selected: videoFilter.frame_rate,
            }}
            onChange={(_, v) => setVideoFilter((f) => ({ ...f, frame_rate: v }))}
          />
        </>
      )
    }
    if (selectedType === "scripting") {
      return (
        <FilterDropdown
          filter={{
            id: "language",
            label: "Language",
            options: SCRIPTING_LANGUAGE_OPTIONS,
            selected: scriptingFilter.language,
          }}
          onChange={(_, v) => setScriptingFilter((f) => ({ ...f, language: v }))}
        />
      )
    }
    return null
  }

  return (
    <div className="bg-zinc-900 text-white min-h-screen p-6 pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Assets
            {searchQuery && (
              <span className="text-sm font-normal ml-2 text-zinc-400">Results for: "{searchQuery}"</span>
            )}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-md hover:bg-zinc-800" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-zinc-800/50 rounded-lg p-3 mb-6 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <FilterDropdown key={filter.id} filter={filter} onChange={handleFilterChange} />
            ))}
            {renderSecondaryFilters()}
          </div>
        )}

        <AssetGrid
          assets={filteredAssets}
          isLoading={isLoading}
          onCardClick={(id) => navigate(`/single-asset?id=${id}`)}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </div>
  )
}

export default Assets
