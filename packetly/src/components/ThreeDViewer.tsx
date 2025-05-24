import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { 
  GLTFLoader, 
  RGBELoader, 
  OrbitControls, 
  EffectComposer, 
  RenderPass, 
  UnrealBloomPass,
  OBJLoader,
  FBXLoader
} from "three-stdlib";
import { Sun, Moon, Building2 } from "lucide-react";

interface ThreeDViewerProps {
  modelURL: string;
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ modelURL }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hdri, setHdri] = useState("sky_hdri.hdr");
  const [error, setError] = useState<string | null>(null);

  const changeHDRI = (newHdri: string) => {
    setHdri(newHdri);
  };

  useEffect(() => {
    if (!mountRef.current || rendererRef.current) return;

    const container = mountRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Ensure correct color encoding for textures
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-2, 2, 3);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    new RGBELoader().load(hdri, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      scene.background = texture;
    });

    const floorGeometry = new THREE.CircleGeometry(5, 32);
    const reflectiveMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, reflectiveMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    scene.add(floor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.5;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.1, 
      0.2, 
      0.95 
    );
    composer.addPass(bloomPass);

    // Loader selection based on file extension
    const ext = modelURL.split('.').pop()?.toLowerCase();
    let loader: any = null;
    let loadFn: (onLoad: (obj: any) => void, onProgress: (xhr: ProgressEvent<EventTarget>) => void, onError: (err: any) => void) => void;

    if (ext === "gltf" || ext === "glb") {
      loader = new GLTFLoader();
      const resourcePath = modelURL.substring(0, modelURL.lastIndexOf("/") + 1);
      loader.setResourcePath(resourcePath);
      loadFn = (onLoad, onProgress, onError) => loader.load(
        modelURL,
        (gltf: any) => {
          // Fix: set environment and background to null for correct PBR rendering
          scene.environment = null;
          scene.background = null;
          // Ensure all textures use sRGBEncoding
          gltf.scene.traverse((child: any) => {
            if (child.isMesh && child.material) {
              if (child.material.map) {
                child.material.map.colorSpace = THREE.SRGBColorSpace; // Correct color space for color textures
              }
              if (child.material.emissiveMap) {
                child.material.emissiveMap.colorSpace = THREE.SRGBColorSpace; // Correct color space for emissive textures
              }
              if (child.material.metalnessMap) {
                child.material.metalnessMap.colorSpace = THREE.LinearSRGBColorSpace; // Correct color space for metalness maps
              }
              if (child.material.roughnessMap) {
                child.material.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace; // Correct color space for roughness maps
              }
              // Removed incorrect encoding for normal maps
              child.material.needsUpdate = !!(
                child.material.map ||
                child.material.emissiveMap ||
                child.material.metalnessMap ||
                child.material.roughnessMap
              ); // Update only if changes were made
            }
          });
          onLoad({
            scene: gltf.scene,
            animations: gltf.animations
          });
        },
        onProgress,
        onError
      );
    } else if (ext === "obj") {
      loader = new OBJLoader();
      loadFn = (onLoad, onProgress, onError) => loader.load(
        modelURL,
        (obj: THREE.Object3D) => onLoad(obj),
        onProgress,
        onError
      );
    } else if (ext === "fbx") {
      // Add a LoadingManager to handle texture loading for FBX
      const manager = new THREE.LoadingManager();
      const textureLoader = new THREE.TextureLoader(manager);

      loader = new FBXLoader(manager);
      loadFn = (onLoad, onProgress, onError) => loader.load(
        modelURL,
        (obj: THREE.Object3D) => {
          // Traverse and assign textures if material has a map property and a name
          obj.traverse((child: any) => {
            if (child.isMesh && child.material && child.material.name && !child.material.map) {
              // Try to load a texture with the same name as the material
              const texturePath = modelURL.substring(0, modelURL.lastIndexOf("/") + 1) + child.material.name + ".png";
              textureLoader.load(
                texturePath,
                (texture) => {
                  child.material.map = texture;
                  child.material.needsUpdate = true;
                },
                undefined,
                () => {
                  // Ignore errors if texture not found
                }
              );
            }
            if (child.children) {
              child.children.forEach((c: any) => {
                c.parent = child;
              });
            }
          });
          onLoad(obj);
        },
        onProgress,
        onError
      );
    } else if (ext === "blend") {
      setError("No se puede cargar archivos .blend directamente. Por favor, conviértalo a glTF, OBJ o FBX.");
      return;
    } else {
      setError("Formato de modelo no soportado.");
      return;
    }

    // Load model
    loadFn(
      (result) => {
        let object: THREE.Object3D;
        let animations: THREE.AnimationClip[] = [];

        if (result.scene) {
          // GLTF
          object = result.scene;
          animations = result.animations || [];
        } else {
          // OBJ/FBX
          object = result;
          if (result.animations) animations = result.animations;
        }

        object.scale.set(1, 1, 1);
        scene.add(object);
        modelRef.current = object;

        if (animations.length) {
          const mixer = new THREE.AnimationMixer(object);
          animations.forEach((clip) => mixer.clipAction(clip).play());
          mixerRef.current = mixer;
        }

        object.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material && "emissive" in child.material) {
              child.material.emissive = new THREE.Color(0xffffff);
              child.material.emissiveIntensity = 1;
            }
          }
        });

        // Normalize scale and center
        const box = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 1 / maxDim;
        object.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Recompute bounding box after scaling
        box.setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Reset position before centering
        object.position.set(0, 0, 0);

        // Center the object at the origin
        object.position.x = -center.x;
        object.position.y = -center.y;
        object.position.z = -center.z;

        // Place the object on the floor (y = 0)
        box.setFromObject(object);
        const minY = box.min.y;
        object.position.y -= minY;

        // Set camera and controls
        camera.position.set(0, 1, 2.5);
        camera.lookAt(0, 0.5, 0);
        floor.position.y = 0;
        controls.target.set(0, 0.5, 0);
        camera.lookAt(0, 0.5, 0); // Removed redundant second call
        controls.target.set(0, 0.5, 0); // Removed redundant second call
      },
      (xhr: ProgressEvent<EventTarget>) => setLoadingProgress((xhr.loaded / (xhr.total || 1)) * 100),
      (error: any) => setError("Error al cargar el modelo: " + error)
    );

    let animationId: number;

    const animate = () => {
      if (mixerRef.current) {
        mixerRef.current.update(1 / 60);
      }
      controls.update();
      composer.render();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      // Properly dispose of renderer and remove canvas
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
      // Dispose of loaded model
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m: any) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        modelRef.current = null;
      }
      // Dispose of mixer
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(mixerRef.current.getRoot());
        mixerRef.current = null;
      }
    };
  }, [modelURL]);

  useEffect(() => {
    if (!sceneRef.current) return;

    new RGBELoader().load(hdri, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      sceneRef.current!.environment = texture;
      sceneRef.current!.background = texture;
    });
  }, [hdri]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(200, 0, 0, 0.8)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
      {loadingProgress < 100 && !error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "10px",
            borderRadius: "5px",
            color: "white",
          }}
        >
          Cargando... {Math.round(loadingProgress)}%
        </div>
      )}

      <div style={{ 
        position: "absolute", 
        top: 6, 
        left: 6, 
        zIndex: 6, 
        display: "flex", 
        flexDirection: "column" 
      }}>
        {[
          { Icon: Sun, hdri: "sky_hdri.hdr" },
          { Icon: Moon, hdri: "night_hdri.hdr" },
          { Icon: Building2, hdri: "studio_hdri.hdr" }
        ].map(({ Icon, hdri }, index) => (
          <button
            key={index}
            onClick={() => changeHDRI(hdri)}
            style={{
              margin: "6px",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "#222",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
              cursor: "pointer",
              transition: "background 0.2s ease-in-out, transform 0.1s",
              padding: "0",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#333")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#222")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Icon 
              width="40%"   
              height="40%"  
              stroke="white" 
              strokeWidth={1.5} 
            />
          </button>
        ))}
      </div>

      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default ThreeDViewer;
