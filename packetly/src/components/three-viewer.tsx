/* eslint-disable prefer-const */
'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Canvas } from '@react-three/fiber';
import { GLTFLoader, FBXLoader, OBJLoader, MTLLoader } from 'three-stdlib';
import { Box3, Vector3, AnimationMixer, Clock, Object3D } from 'three';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { OrbitControls } from '@react-three/drei';

const FOV = 75;
const CAMERA_ANGLE = new Vector3(1, 1, 1).normalize();

function Model({ url, onModelLoaded }: { url: string; onModelLoaded: (cameraPos: Vector3) => void }) {
  const [mixer, setMixer] = useState<AnimationMixer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<Object3D | null>(null);

  const loader = useMemo(() => {
    if (url.endsWith('.gltf') || url.endsWith('.glb')) {
      return new GLTFLoader().loadAsync(url).catch((err) => {
        console.error('Error loading GLTF:', err);
        setError('Failed to load GLTF model.');
        return null;
      });
    } else if (url.endsWith('.fbx')) {
      return new FBXLoader().loadAsync(url).catch((err) => {
        console.error('Error loading FBX:', err);
        setError('Failed to load FBX model.');
        return null;
      });
    } else if (url.endsWith('.obj')) {
      const mtlUrl = url.replace(/\.obj$/, ".mtl");
      return new MTLLoader().loadAsync(mtlUrl).then((materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        return objLoader.loadAsync(url);
      }).catch(() => new OBJLoader().loadAsync(url));
    }
    return Promise.reject("Unsupported format");
  }, [url]);

  useEffect(() => {
    loader.then((loadedModel) => {
      if (!loadedModel) return;

      let model = 'scene' in loadedModel ? loadedModel.scene : loadedModel;

      if (!model) {
        setError('Model does not contain a scene or object.');
        return;
      }

      const box = new Box3().setFromObject(model);
      const size = new Vector3();
      box.getSize(size);
      const center = new Vector3();
      box.getCenter(center);

      model.position.sub(center);
      const maxSize = Math.max(size.x, size.y, size.z);
      const distance = (maxSize / 2) / Math.tan((FOV * Math.PI) / 360);
      const cameraPos = CAMERA_ANGLE.clone().multiplyScalar(distance);
      onModelLoaded(cameraPos);

      if (loadedModel.animations && loadedModel.animations.length > 0) {
        const animationMixer = new AnimationMixer(model);
        loadedModel.animations.forEach((clip: any) => {
          const action = animationMixer.clipAction(clip);
          action.play();
        });
        setMixer(animationMixer);
      }

      setModel(model);
    }).catch((error) => {
      console.error("Error loading model:", error);
      setError("Failed to load model.");
    });
  }, [loader, onModelLoaded]);

  useEffect(() => {
    if (!mixer) return;
    const clock = new Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      mixer.update(clock.getDelta());
    };
    animate();
  }, [mixer]);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return model ? <primitive object={model} /> : null;
}

type ModelViewerProps = {
  modelUrl: string;
};

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
  const [cameraPosition, setCameraPosition] = useState(new Vector3(10, 10, 10));
  return (
    <Canvas style={{ width: '100%', height: '100%', background: 'transparent' }} camera={{ position: cameraPosition.toArray(), fov: FOV }} gl={{ alpha: true }}>
      <ambientLight intensity={1} />
      <directionalLight position={[2, 1, 1]} intensity={1} />
      <Suspense fallback={<div>Loading model...</div>}>
        <Model url={modelUrl} onModelLoaded={setCameraPosition} />
      </Suspense>
      <OrbitControls enableZoom enablePan />
    </Canvas>
  );
}
