/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Canvas, useLoader } from '@react-three/fiber';
import { OBJLoader, MTLLoader } from 'three-stdlib';
import { Box3, Vector3, MeshBasicMaterial, Object3D } from 'three';
import { useState, useRef, useEffect, Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';

interface ModelProps {
  url: string;
  onModelLoaded: (cameraPos: Vector3) => void;
}

function Model({ url, onModelLoaded }: ModelProps) {
  const objRef = useRef<Object3D | null>(null);

  useEffect(() => {
    if (objRef.current) {
      // Obtener el bounding box del modelo
      const box = new Box3().setFromObject(objRef.current);

      // Obtener el tamaño del modelo
      const size = new Vector3();
      box.getSize(size);

      // Calcular la distancia necesaria para la cámara
      const distance = size.length() * 1.5; // Factor de distancia según el tamaño del modelo

      // Llamar a la función `onModelLoaded` con la nueva posición de la cámara (Vector3)
      onModelLoaded(new Vector3(0, 0, distance));

      // Ajustar el modelo para centrarlo
      const center = new Vector3();
      box.getCenter(center);
      objRef.current.position.sub(center);

      // Escalar el modelo para asegurarnos de que se ajuste bien a la vista
      const scaleFactor = 0.04; // Ajusta este valor para que el modelo se vea más pequeño
      objRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  }, [url, onModelLoaded]);

  // Cargar el material .mtl
  const mtl = useLoader(MTLLoader, url.replace('.obj', '.mtl'));

  // Cargar el objeto .obj y aplicar los materiales cargados
  const obj = useLoader(OBJLoader, url, (loader) => {
    mtl.preload();  // Pre-cargar los materiales
    loader.setMaterials(mtl); // Aplicar los materiales al objeto
  });

  // Asegurarnos de que el material se aplique correctamente
  useEffect(() => {
    if (objRef.current) {
      objRef.current.traverse((child) => {
        if ((child as any).isMesh) {
          // Si el material no está presente, aplicar un material básico
          if (!(child as any).material) {
            (child as any).material = new MeshBasicMaterial({ color: 0x555555 });
          }
        }
      });
    }
  }, [obj]);

  return <primitive ref={objRef} object={obj} />;
}

type ModelViewerProps = {
  modelUrl: string;
};

export default function ModelViewer({ modelUrl }: ModelViewerProps) {
  const [cameraPosition, setCameraPosition] = useState(new Vector3(-Math.cos(Math.PI / 4) * 5, 2, Math.sin(Math.PI / 4) * 5));

  return (
    <Canvas
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      camera={{ position: cameraPosition.toArray(), fov: 90 }} // Convertimos a arreglo cuando lo pasamos a la cámara
      gl={{ alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={1} />
      <Suspense fallback={null}>
        <Model url={modelUrl} onModelLoaded={setCameraPosition} />
      </Suspense>
      <OrbitControls enableZoom={true} enablePan={true} />
    </Canvas>
  );
}
