'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Canvas, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three-stdlib';
import { Box3, Vector3, MeshBasicMaterial } from 'three';
import { useState, useRef, useEffect, Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';

function Model({ url, onModelLoaded }: { url: string, onModelLoaded: (cameraPos: Vector3) => void }) {
  const objRef = useRef<any>(null);
  console.log(`Loading... ${url}`);
  useEffect(() => {
    if (objRef.current) {
      // Obtener el bounding box del modelo
      const box = new Box3().setFromObject(objRef.current);

      // Obtener el tamaño del modelo
      const size = new Vector3();
      box.getSize(size);

      // Calcular la distancia necesaria para la cámara
      const distance = size.length(); // Factor de distancia según el tamaño del modelo

      // Llamar a la función `onModelLoaded` con la nueva posición de la cámara (Vector3)
      onModelLoaded(new Vector3(0, 0, distance));

      // Ajustar el modelo para centrarlo
      const center = new Vector3();
      box.getCenter(center);
      objRef.current.position.sub(center);

      // Escalar el modelo para asegurarnos de que se ajuste bien a la vista
      const scaleFactor = 1; // Ajusta este valor para que el modelo se vea más pequeño
      objRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  }, [url, onModelLoaded]);

  // Cargar el objeto .obj sin usar .mtl
  const obj = useLoader(OBJLoader, url);
  console.log(`${JSON.stringify}`)

  // Asegurarnos de que el material se aplique correctamente
  useEffect(() => {
    if (objRef.current) {
      objRef.current.traverse((child: any) => {
        if (child.isMesh) {
          // Aplicar un material básico si no hay texturas
          if (!child.material) {
            child.material = new MeshBasicMaterial({ color: 0x555555 });
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
