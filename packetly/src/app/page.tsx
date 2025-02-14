import ModelViewer from "@/components/three-viewer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Grid,
  List,
  ImageIcon,
  CuboidIcon as Cube,
  FileAudio,
  FileVideo,
  FileCode
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <div className="h-full py-6 pl-8 pr-6 lg:py-8">
            <div className="flex flex-col space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Asset Types</h3>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    2D Images
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Cube className="mr-2 h-4 w-4" />
                    3D Models
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <FileAudio className="mr-2 h-4 w-4" />
                    Audio
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <FileVideo className="mr-2 h-4 w-4" />
                    Video
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <FileCode className="mr-2 h-4 w-4" />
                    Source Code
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold">Projects</h3>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start">
                    Project Alpha
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Project Beta
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    Project Gamma
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex w-full flex-col overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Assets</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Grid className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button variant="ghost" size="icon">
                <List className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </Button>
            </div>
          </div>
          <Tabs defaultValue="all" className="mt-6">
            <TabsList>
              <TabsTrigger value="all">All Assets</TabsTrigger>
              <TabsTrigger value="recent">Recently Added</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[
                  { name: "Character Model", type: "3D Model", icon: <Cube className="h-6 w-6" /> },
                  { name: "Background Music", type: "Audio", icon: <FileAudio className="h-6 w-6" /> },
                  { name: "Texture Atlas", type: "2D Image", icon: <ImageIcon className="h-6 w-6" /> },
                  { name: "Particle System", type: "Source Code", icon: <FileCode className="h-6 w-6" /> },
                  { name: "Cinematic Intro", type: "Video", icon: <FileVideo className="h-6 w-6" /> },
                  { name: "UI Elements", type: "2D Image", icon: <ImageIcon className="h-6 w-6" /> },
                ].map((asset, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-lg border bg-background p-2">
                    <div className="aspect-square overflow-hidden rounded-md">
                      <div className="flex h-full items-center justify-center bg-secondary">{asset.icon}</div>
                    </div>
                    <div className="pt-2">
                      <h3 className="font-semibold">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground">{asset.type}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Button variant="secondary" className="mr-2">
                        Preview
                      </Button>
                      <Button>Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          <div className="w-[800px] h-[800px]">
            <ModelViewer  modelUrl="/models/Kitchen.obj"></ModelViewer>
          </div>
        </main>
      </div>
      
    </div>
  )
}