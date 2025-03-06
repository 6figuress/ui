import { useRef, Suspense } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "@react-three/drei";
import { Group } from "three";

interface ModelProps {
  modelUrl: string;
  description: string;
}

// This component loads and renders the 3D model
function ModelViewer({ modelUrl }: { modelUrl: string }) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const modelRef = useRef<Group>(null);

  // This hook creates a loop,
  // spinning the model
  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.005;
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      scale={1.5}
      position={[0, 0, 0]}
    />
  );
}

function Model({ modelUrl, description }: ModelProps) {
  return (
    <div id="model-wrapper">
      <div id="inner-wrapper">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <Suspense fallback={<div>Loading...</div>}>
            <ModelViewer modelUrl={modelUrl} />
            <OrbitControls enableZoom={true} enablePan={true} />
          </Suspense>
        </Canvas>
      </div>
      <h3>{description}</h3>
    </div>
  );
}

export default Model;
