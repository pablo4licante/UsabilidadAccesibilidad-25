"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import {
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileIcon as File3dIcon,
  FileCodeIcon,
  X,
  Upload,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

type FileType = "image" | "video" | "sound" | "model3d" | "scripting"

interface FileWithPreview extends File {
  preview?: string
  type: string
  fileType?: FileType
}

interface AssetUploadProps {
  token: string
  user: { _id: string }
  projectId?: string
}

export default function AssetUpload({ token, user: userProp, projectId: initialProjectId }: AssetUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [currentFile, setCurrentFile] = useState<FileWithPreview | null>(null)
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [user, setUser] = useState<{ _id: string } | null>(() => {
    if (userProp && userProp._id) {
      if (typeof userProp._id === "object" && (userProp._id as any).$oid) {
        return { _id: (userProp._id as any).$oid }
      }
      return { _id: userProp._id }
    }
    return null
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileFields, setFileFields] = useState<Record<string, AssetFields>>({})
  const navigate = useNavigate()

  type AssetFields = {
    imageFields?: { resolution: string; color_depth: string }
    videoFields?: { resolution: string; duration: string; frame_rate: string }
    soundFields?: { duration: string; bitrate: string }
    model3dFields?: { enviroment: string; size: string; condition: string; polycount: string; screenshot: File | null }
    scriptingFields?: { language: string }
    metadata: Record<string, string>
    projectId?: string // Añadido para proyecto asociado individual
  }

  const [model3dFields, setModel3dFields] = useState({
    enviroment: "",
    size: "",
    condition: "",
    polycount: "",
    screenshot: null as File | null,
  })
  const [soundFields, setSoundFields] = useState({
    duration: "",
    bitrate: "",
  })
  const [imageFields, setImageFields] = useState({
    resolution: "",
    color_depth: "",
  })
  const [videoFields, setVideoFields] = useState({
    resolution: "",
    duration: "",
    frame_rate: "",
  })
  const [scriptingFields, setScriptingFields] = useState({
    language: "",
  })
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])

  // Redirige si no hay token o usuario
  useEffect(() => {
    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    console.log("UploadAsset: token", token)
    console.log("UploadAsset: user", storedUser)
    if (!token) {
      window.location.href = "/login"
      return
    }
    if (!user) {
      // Intenta recuperar el usuario de localStorage
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          if (parsed && parsed._id) {
            // Si _id es un objeto tipo { $oid: ... }
            if (typeof parsed._id === "object" && parsed._id.$oid) {
              setUser({ _id: parsed._id.$oid })
            } else {
              setUser({ _id: parsed._id })
            }
          } else if (parsed && parsed.id) {
            setUser({ _id: parsed.id })
          }
        } catch {
          window.location.href = "/login"
        }
      } else {
        window.location.href = "/login"
      }
    }
  }, [user])

  // Fetch projects from backend
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
      return
    }
    if (!user) {
      // Intenta recuperar el usuario de localStorage
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser)
          if (parsed && parsed._id) {
          // Si _id es un objeto tipo { $oid: ... }
          if (typeof parsed._id === "object" && parsed._id.$oid) {
            setUser({ _id: parsed._id.$oid })
          } else {
            setUser({ _id: parsed._id })
          }
        } else if (parsed && parsed.id) {
          setUser({ _id: parsed.id })
        }
        } catch {
          window.location.href = "/login"
        }
      } else {
        window.location.href = "/login"
      }
    }
    // Fetch projects
    fetch("https://usabilidadaccesibilidad-25.onrender.com/api/projects", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(
            data.map((p: any) => ({
              id: p._id || p.id,
              name: p.name || p.title || p._id
            }))
          )
        }
      })
      .catch(() => {
        setProjects([])
      })
  }, [user])

  // Solo tipos válidos
  const determineFileType = (file: File): FileType | undefined => {
    const mimeType = file.type.toLowerCase()
    const extension = file.name.split(".").pop()?.toLowerCase()
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("audio/")) return "sound"
    if (["glb", "gltf", "obj", "fbx", "stl", "3ds", "blend"].includes(extension || "")) return "model3d"
    if (
      [
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
      ].includes(extension || "")
    )
      return "scripting"
    return undefined
  }

  // Helper para saber si el archivo es aceptado
  const isAcceptedFile = (file: File) => !!determineFileType(file)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setErrorMsg(null)
    const droppedFiles = Array.from(e.dataTransfer.files)
    const rejected = droppedFiles.filter((f) => !isAcceptedFile(f))
    if (rejected.length > 0) {
      setErrorMsg("Only images, videos, sounds, 3D models and scripts are accepted.")
      return
    }
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }

  const handleAddMoreFiles = () => {
    // Solo abre el input, no valida ni limpia nada
    fileInputRef.current?.value && (fileInputRef.current.value = ""); // limpia para poder subir los mismos archivos si se quiere
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files)
      const rejected = filesArr.filter((f) => !isAcceptedFile(f))
      if (rejected.length > 0) {
        setErrorMsg("Only images, videos, sounds, 3D models and scripts are accepted.")
        return
      }
      processFiles(filesArr)
    }
  }

  // Procesa cada archivo y detecta sus metadatos automáticos individualmente
  const processFiles = (newFiles: File[]) => {
    newFiles.forEach((file) => {
      const fileWithType = file as FileWithPreview
      fileWithType.fileType = determineFileType(file)
      if (!fileWithType.fileType) return

      // Crea campos por defecto para cada archivo
      const fields: AssetFields = { metadata: { title: file.name, description: "" } }

      if (fileWithType.fileType === "image") {
        fileWithType.preview = URL.createObjectURL(file)
        const img = new window.Image()
        img.src = fileWithType.preview
        img.onload = () => {
          setFileFields(prev => ({
            ...prev,
            [fileWithType.name]: {
              ...prev[fileWithType.name],
              imageFields: { resolution: img.width + "x" + img.height, color_depth: "" }
            }
          }))
        }
        fields.imageFields = { resolution: "", color_depth: "" }
      }

      if (fileWithType.fileType === "video") {
        const video = document.createElement("video")
        video.src = URL.createObjectURL(file)
        video.currentTime = 0.1
        video.muted = true
        video.playsInline = true

        // Detectar frame rate automáticamente
        video.onloadedmetadata = () => {
          let frameRate = ""
          // Algunos navegadores soportan video.webkitDecodedFrameCount y video.webkitDecodedFrameRate
          // Pero la forma más estándar es intentar usar getVideoPlaybackQuality si está disponible
          if (typeof (video as any).getVideoPlaybackQuality === "function") {
            const quality = (video as any).getVideoPlaybackQuality()
            if (quality && quality.totalVideoFrames && video.duration) {
              frameRate = (quality.totalVideoFrames / video.duration).toFixed(2)
            }
          }
          // Si no, intenta usar video.webkitDecodedFrameCount
          else if ((video as any).webkitDecodedFrameCount && video.duration) {
            frameRate = ((video as any).webkitDecodedFrameCount / video.duration).toFixed(2)
          }
          // Si no, deja vacío

          setFileFields(prev => ({
            ...prev,
            [fileWithType.name]: {
              ...prev[fileWithType.name],
              videoFields: {
                resolution: video.videoWidth + "x" + video.videoHeight,
                duration: video.duration ? Math.round(video.duration).toString() : "",
                frame_rate: frameRate
              }
            }
          }))
        }

        video.onloadeddata = () => {
          setFileFields(prev => ({
            ...prev,
            [fileWithType.name]: {
              ...prev[fileWithType.name],
              // Solo actualiza preview, no pisa frame_rate
              videoFields: {
                ...(prev[fileWithType.name]?.videoFields || {}),
                resolution: video.videoWidth + "x" + video.videoHeight,
                duration: video.duration ? Math.round(video.duration).toString() : "",
                frame_rate: prev[fileWithType.name]?.videoFields?.frame_rate || ""
              }
            }
          }))
          URL.revokeObjectURL(video.src)
        }
        fields.videoFields = { resolution: "", duration: "", frame_rate: "" }
      }

      if (fileWithType.fileType === "sound") {
        try {
          const audio = document.createElement("audio")
          audio.src = URL.createObjectURL(file)
          audio.onloadedmetadata = () => {
            setFileFields(prev => ({
              ...prev,
              [fileWithType.name]: {
                ...prev[fileWithType.name],
                soundFields: {
                  duration: audio.duration ? Math.round(audio.duration).toString() : "",
                  bitrate: file.size && audio.duration ? Math.round((file.size * 8) / audio.duration / 1000).toString() : ""
                }
              }
            }))
          }
        } catch {}
        fields.soundFields = { duration: "", bitrate: "" }
      }

      if (fileWithType.fileType === "model3d") {
        fields.model3dFields = { enviroment: "", size: "", condition: "", polycount: "", screenshot: null }
      }

      if (fileWithType.fileType === "scripting") {
        const ext = file.name.split(".").pop()?.toLowerCase() || ""
        fields.scriptingFields = { language: ext }
      }

      setFiles(prev => [...prev, fileWithType])
      setFileFields(prev => ({ ...prev, [fileWithType.name]: fields }))
    })

    // Si no hay currentFile, selecciona el primero nuevo
    if (!currentFile && newFiles.length > 0) {
      setCurrentFile(newFiles[0] as FileWithPreview)
    }
  }

  const selectFile = (file: FileWithPreview) => {
    setCurrentFile(file)
  }

  const removeFile = (fileToRemove: FileWithPreview, e: React.MouseEvent) => {
    e.stopPropagation()
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
    const updatedFiles = files.filter((file) => file !== fileToRemove)
    setFiles(updatedFiles)
    setFileFields(prev => {
      const copy = { ...prev }
      delete copy[fileToRemove.name]
      return copy
    })
    if (currentFile === fileToRemove) {
      if (updatedFiles.length > 0) {
        setCurrentFile(updatedFiles[0])
      } else {
        setCurrentFile(null)
      }
    }
  }

  const handleFieldChange = (fileName: string, section: keyof AssetFields, key: string, value: any) => {
    setFileFields(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [section]: {
          ...((prev[fileName] && typeof prev[fileName][section] === "object" && prev[fileName][section] !== null ? prev[fileName][section] : {})),
          [key]: value
        }
      }
    }))
  }

  // Nuevo handler para cambiar el proyecto asociado de un asset
  const handleProjectChange = (fileName: string, value: string) => {
    setFileFields(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        projectId: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFile) return
    if (!user?._id) {
      alert("You must be authenticated.")
      return
    }
    const fields = fileFields[currentFile.name] || {}
    // Si no hay proyecto seleccionado (ni initialProjectId ni fields.projectId), muestra alerta y no sube
    if (!initialProjectId && (!fields.projectId || fields.projectId === "none")) {
      alert("You must select an associated project for the asset.")
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", currentFile)
    formData.append("owner_id", user._id)
    if (fields.projectId && fields.projectId !== "none") formData.append("project_id", fields.projectId)
    formData.append("type", currentFile.fileType!)
    formData.append("name", fields.metadata.title || currentFile.name)
    formData.append("description", fields.metadata.description || "")
    if (fields.metadata.tags) formData.append("tags", fields.metadata.tags)

    // Campos personalizados
    if (currentFile.fileType === "model3d") {
      const ext = currentFile.name.split(".").pop() || "";
      formData.append("format", ext);
      formData.append("enviroment", fields.model3dFields?.enviroment || "")
      formData.append("size", fields.model3dFields?.size || "")
      formData.append("condition", fields.model3dFields?.condition || "")
      formData.append("polycount", fields.model3dFields?.polycount || "")
      if (fields.model3dFields?.screenshot) formData.append("screenshot", fields.model3dFields.screenshot)
    }
    if (currentFile.fileType === "sound") {
      const ext = currentFile.name.split(".").pop() || "";
      formData.append("format", ext)
      formData.append("duration", fields.soundFields?.duration || "")
      formData.append("bitrate", fields.soundFields?.bitrate || "")
      formData.append("sound_type", ext)
    }
    if (currentFile.fileType === "image") {
      const ext = currentFile.name.split(".").pop() || "";
      formData.append("format", ext)
      formData.append("resolution", fields.imageFields?.resolution || "")
      formData.append("color_depth", fields.imageFields?.color_depth || "")
    }
    if (currentFile.fileType === "video") {
      const ext = currentFile.name.split(".").pop() || "";
      formData.append("format", ext)
      formData.append("resolution", fields.videoFields?.resolution || "")
      formData.append("duration", fields.videoFields?.duration || "")
      formData.append("frame_rate", fields.videoFields?.frame_rate || "")
    }
    if (currentFile.fileType === "scripting") {
      formData.append("language", fields.scriptingFields?.language || "")
    }

    try {
      const res = await fetch("https://usabilidadaccesibilidad-25.onrender.com/api/assets", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const err = await res.json()
        console.log("Backend error:", err)
        alert("Error while uploading: " + (err.message || res.statusText))
        setIsUploading(false)
        return
      }

      const uploadedAsset = await res.json()

      setIsUploading(false)
      setIsUploaded(true)

      setTimeout(() => {
        setIsUploaded(false)
      }, 1000)

      // Redirect to /assets after successful upload
      navigate("/assets")
      return

      // Elimina solo el asset subido de la lista y de los campos
      setFiles(prev => {
        const updated = prev.filter(f => f !== currentFile)
        // Si quedan archivos, selecciona el primero, si no, deja null
        setCurrentFile(updated.length > 0 ? updated[0] : null)
        return updated
      })
      setFileFields(prev => {
        const copy = { ...prev }
        if (currentFile) {
          delete copy[currentFile.name]
        }
        return copy
      })

      // Si ya no quedan archivos, resetea todo (vuelve al estado inicial)
      setTimeout(() => {
        if (files.length === 1) { // solo quedaba uno, ahora ya ninguno
          setFiles([])
          setCurrentFile(null)
          setMetadata({})
          setFileFields({})
        }
      }, 200) // pequeño delay para evitar parpadeo visual

    } catch (err) {
      alert("Network error while uploading.")
      setIsUploading(false)
    }
  }

  const getFileIcon = (fileType?: FileType) => {
    switch (fileType) {
      case "image":
        return <FileImageIcon className="h-5 w-5" />
      case "video":
        return <FileVideoIcon className="h-5 w-5" />
      case "sound":
        return <FileAudioIcon className="h-5 w-5" />
      case "model3d":
        return <File3dIcon className="h-5 w-5" />
      case "scripting":
        return <FileCodeIcon className="h-5 w-5" />
      default:
        return null
    }
  }

  const renderFilePreview = () => {
    if (!currentFile) return null

    switch (currentFile.fileType) {
      case "image":
        return (
          <div className="relative h-48 w-full overflow-hidden rounded-md bg-gray-800">
            {currentFile.preview && (
              <img
                src={currentFile.preview}
                alt={currentFile.name}
                className="h-full w-full object-contain"
              />
            )}
          </div>
        )
      case "video":
        return (
          <div className="relative h-48 w-full overflow-hidden rounded-md bg-black flex items-center justify-center">
            {currentFile.preview ? (
              <img
                src={currentFile.preview}
                alt={currentFile.name}
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
        )
      case "model3d":
        return (
          <div className="relative h-48 w-full overflow-hidden rounded-md bg-black flex items-center justify-center">
            {model3dFields.screenshot ? (
              <img
                src={URL.createObjectURL(model3dFields.screenshot)}
                alt="Screenshot"
                className="h-full w-full object-contain"
              />
            ) : null}
          </div>
        )
      case "sound":
      case "scripting":
        return (
          <div className="relative h-48 w-full overflow-hidden rounded-md bg-black flex items-center justify-center"></div>
        )
      default:
        return null
    }
  }

  const VIDEO_FRAMERATE_OPTIONS = [
    "23.98", "24", "25", "29.97", "30", "50", "59.94", "60"
  ];

  const renderMetadataForm = () => {
    if (!currentFile) return null
    const fields = fileFields[currentFile.name] || {}

    return (
      <div className="space-y-4">
        {/* Proyecto asociado dentro de los metadatos */}
        {!initialProjectId && (
          <div>
            <Label htmlFor="project_id" className="text-gray-300">
              Associated project
            </Label>
            <Select
              value={fields.projectId || "none"}
              onValueChange={v => handleProjectChange(currentFile.name, v)}
            >
              <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white w-64">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="none">No project</SelectItem>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>
                    {proj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Campos comunes */}
        <div>
          <Label htmlFor="title" className="text-gray-300">
            Name
          </Label>
          <Input
            id="title"
            value={fields.metadata.title || ""}
            onChange={(e) => handleFieldChange(currentFile.name, "metadata", "title", e.target.value)}
            className="bg-[#2a2a2a] border-gray-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="description" className="text-gray-300">
            Description
          </Label>
          <Textarea
            id="description"
            value={fields.metadata.description || ""}
            onChange={(e) => handleFieldChange(currentFile.name, "metadata", "description", e.target.value)}
            rows={3}
            className="bg-[#2a2a2a] border-gray-600 text-white"
          />
        </div>
        <div>
          <Label htmlFor="tags" className="text-gray-300">
            Tags
          </Label>
          <Input
            id="tags"
            value={fields.metadata.tags || ""}
            onChange={(e) => handleFieldChange(currentFile.name, "metadata", "tags", e.target.value)}
            placeholder="Separated by commas"
            className="bg-[#2a2a2a] border-gray-600 text-white"
          />
        </div>

        {/* Campos personalizados */}
        {currentFile.fileType === "model3d" && (
          <>
            <div>
              <Label htmlFor="enviroment" className="text-gray-300">Enviroment</Label>
              <Select value={fields.model3dFields?.enviroment} onValueChange={v => handleFieldChange(currentFile.name, "model3dFields", "enviroment", v)}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                  <SelectValue placeholder="Select enviroment" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="Indoor">Indoor</SelectItem>
                  <SelectItem value="Outdoor">Outdoor</SelectItem>
                  <SelectItem value="Space">Space</SelectItem>
                  <SelectItem value="Fantasy">Fantasy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="size" className="text-gray-300">Size</Label>
              <Select value={fields.model3dFields?.size} onValueChange={v => handleFieldChange(currentFile.name, "model3dFields", "size", v)}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="Small">Small</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="condition" className="text-gray-300">Condition</Label>
              <Select value={fields.model3dFields?.condition} onValueChange={v => handleFieldChange(currentFile.name, "model3dFields", "condition", v)}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="polycount" className="text-gray-300">Polycount</Label>
              <Input
                id="polycount"
                type="number"
                value={fields.model3dFields?.polycount}
                onChange={e => handleFieldChange(currentFile.name, "model3dFields", "polycount", e.target.value)}
                placeholder="Enter polycount"
                className="bg-[#2a2a2a] border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="screenshot" className="text-gray-300">Screenshot</Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFieldChange(currentFile.name, "model3dFields", "screenshot", e.target.files[0])
                  }
                }}
                className="bg-[#2a2a2a] border-gray-600 text-white"
              />
            </div>
          </>
        )}

        {currentFile.fileType === "sound" && (
          <>
            <div>
              <Label htmlFor="duration" className="text-gray-300">Duration (seconds)</Label>
              <Input
                id="duration"
                value={fields.soundFields?.duration}
                readOnly
                className="bg-[#2a2a2a] border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="bitrate" className="text-gray-300">Bitrate (kbps)</Label>
              <Input
                id="bitrate"
                value={fields.soundFields?.bitrate}
                readOnly
                className="bg-[#2a2a2a] border-gray-600 text-white"
              />
            </div>
          </>
        )}

        {currentFile.fileType === "image" && (
          <>
            <div>
              <Label htmlFor="resolution" className="text-gray-300">Resolution</Label>
              <Input
                id="resolution"
                value={fields.imageFields?.resolution}
                readOnly
                className="bg-[#2a2a2a] border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="color_depth" className="text-gray-300">Color Depth</Label>
              <Select value={fields.imageFields?.color_depth} onValueChange={v => handleFieldChange(currentFile.name, "imageFields", "color_depth", v)}>
                <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                  <SelectValue placeholder="Select color depth" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="8-bit">8-bit</SelectItem>
                  <SelectItem value="16-bit">16-bit</SelectItem>
                  <SelectItem value="24-bit">24-bit</SelectItem>
                  <SelectItem value="32-bit">32-bit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {currentFile.fileType === "video" && (
          <>
            <div>
              <Label htmlFor="resolution" className="text-gray-300">Resolution</Label>
              <Input
                id="resolution"
                value={fields.videoFields?.resolution}
                readOnly
                className="bg-[#2a2a2a] border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="duration" className="text-gray-300">Duration (seconds)</Label>
              <Input
                id="duration"
                value={fields.videoFields?.duration}
                readOnly
                className="bg-[#2a2a2a] border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="frame_rate" className="text-gray-300">Frame Rate</Label>
              <Select
                value={fields.videoFields?.frame_rate}
                onValueChange={v => handleFieldChange(currentFile.name, "videoFields", "frame_rate", v)}
              >
                <SelectTrigger className="bg-[#2a2a2a] border-gray-600 text-white">
                  <SelectValue placeholder="Select frame rate" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {VIDEO_FRAMERATE_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt} fps</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {currentFile.fileType === "scripting" && (
          <>
            <div>
              <Label htmlFor="language" className="text-gray-300">Language</Label>
              <Input
                id="language"
                value={fields.scriptingFields?.language}
                readOnly
                className="bg-[#2a2a2a] border-gray-600 text-white"
              />
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#191919]">
      <div className="container mx-auto p-4 max-w-6xl">
        {errorMsg && (
          <div className="mb-4 text-red-400 font-semibold">{errorMsg}</div>
        )}

        {files.length === 0 ? (
          <Card className="bg-[#131313] text-white border-[#292929]">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-semibold">Upload Asset</CardTitle>
              <p className="text-gray-400 mt-1">Upload your files to start adding information</p>
            </CardHeader>
            <CardContent className="pb-4">
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center",
                  isDragging ? "border-black bg-black/10" : "border-black hover:border-gray-500",
                )}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="mb-4 rounded-full bg-[#892DD0]/10 p-3">
                  <Upload className="h-10 w-10 text-[#892DD0]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Drag and drop your files here</h3>
                <p className="mb-4 text-sm text-gray-400">Or click to select files</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-300 text-black hover:bg-[#892DD0] hover:text-white border-gray-600"
                >
                  Select files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept={`
                    image/*,
                    video/*,
                    audio/*,
                    .glb,.gltf,.obj,.fbx,.stl,.3ds,.blend,
                    .js,.jsx,.ts,.tsx,.html,.css,.json,.py,.java,.c,.cpp,.cs,.php,.rb,.go,.rust,.swift
                  `.replace(/\s+/g, '')}
                  onChange={handleFileInputChange}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Only images, videos, sounds, 3D models and scripts are accepted.
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <Card className="bg-[#131313] text-white border-[#292929]">
                  <CardContent className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">Files</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button" // <-- importante: que NO sea submit
                        onClick={handleAddMoreFiles}
                        className="text-gray-300 hover:text-white hover:bg-gray-700"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center justify-between rounded-md p-2",
                            currentFile === file ? "bg-[#892DD0]/20" : "hover:bg-gray-700",
                          )}
                          onClick={() => selectFile(file)}
                        >
                          <div className="flex items-center">
                            {getFileIcon(file.fileType)}
                            <span className="ml-2 max-w-[150px] truncate text-sm text-gray-300">{file.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
                            onClick={(e) => removeFile(file, e)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                {currentFile ? (
                  <Card className="bg-[#131313] text-white border-[#292929]">
                    <CardHeader className="pb-2">
                      <Tabs defaultValue="preview" className="w-full">
                        <TabsList className="bg-[#292929] text-gray-400">
                          <TabsTrigger
                            value="preview"
                            className="data-[state=active]:bg-[#292929] data-[state=active]:text-white"
                          >
                            Preview
                          </TabsTrigger>
                          <TabsTrigger
                            value="metadata"
                            className="data-[state=active]:bg-[#292929] data-[state=active]:text-white"
                          >
                            Metadata
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="preview" className="mt-4">
                          {renderFilePreview()}
                          <div className="mt-4">
                            <p className="text-sm font-medium text-white">{currentFile.name}</p>
                            <p className="text-xs text-gray-400">
                              {(currentFile.size / 1024).toFixed(2)} KB • {currentFile.type || "Unknown type"}
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="metadata" className="mt-4">
                          {renderMetadataForm()}
                        </TabsContent>
                      </Tabs>
                    </CardHeader>
                    <CardFooter className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="bg-gray-300 text-black hover:bg-red-600 hover:text-white border-gray-600"
                        onClick={() => {
                          files.forEach(f => {
                            if (f.preview) URL.revokeObjectURL(f.preview)
                          })
                          setFiles([])
                          setCurrentFile(null)
                          setMetadata({})
                          setModel3dFields({ enviroment: "", size: "", condition: "", polycount: "", screenshot: null })
                          setSoundFields({ duration: "", bitrate: "" })
                          setImageFields({ resolution: "", color_depth: "" })
                          setVideoFields({ resolution: "", duration: "", frame_rate: "" })
                          setScriptingFields({ language: "" })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#892DD0] hover:bg-[#6b23a8] text-white"
                        disabled={isUploading || isUploaded}
                      >
                        {isUploading ? (
                          <>
                            <Upload className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : isUploaded ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Uploaded!
                          </>
                        ) : (
                          "Upload Asset"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="bg-[#131313] text-white border-[#292929]">
                    <CardContent className="flex h-64 items-center justify-center p-4">
                      <p className="text-gray-400">Select a file to view its details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
