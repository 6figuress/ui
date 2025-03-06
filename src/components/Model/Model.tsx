import {
  Component,
  Suspense,
  ReactNode,
  useRef,
  useState,
  useEffect,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import "./Model.css";

interface ModelProps {
  modelUrl: string;
  description: string;
}

// This component loads and renders the 3D model
function ModelViewer({ modelUrl }: { modelUrl: string }) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const modelRef = useRef<THREE.Group>(null);

  // Apply proper material settings to all meshes in the model
  useEffect(() => {
    if (gltf) {
      gltf.scene.traverse((node: any) => {
        if (node.isMesh) {
          // Ensure textures are properly set up
          const material = node.material;
          if (material) {
            material.needsUpdate = true;

            // Enable color mapping if available
            if (material.map) {
              material.map.needsUpdate = true;
            }

            // Set proper material settings based on the model type
            material.transparent = Boolean(material.transparent);
            material.side = THREE.DoubleSide; // Render both sides
          }
        }
      });
    }
  }, [gltf]);

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
  const [modelError, setModelError] = useState<string | null>(null);

  return (
    <div id="model-wrapper">
      <div id="inner-model-wrapper">
        <ErrorBoundary onError={(error) => setModelError(error.message)}>
          <Canvas
            camera={{ position: [0, 0, 5], fov: 45 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.0,
            }}
          >
            <ambientLight intensity={1.2} />
            <spotLight
              position={[5, 10, 5]}
              angle={0.3}
              penumbra={1}
              intensity={1.5}
              castShadow={false}
            />
            <spotLight
              position={[-5, 10, -5]}
              angle={0.3}
              penumbra={1}
              intensity={1}
              castShadow
            />
            <pointLight position={[0, 5, 0]} intensity={0.8} />
            <Environment preset="park" background={false} />
            <Suspense fallback={<Loader />}>
              <ModelViewer modelUrl={modelUrl} />
            </Suspense>
            <OrbitControls enableZoom={true} enablePan={true} />
          </Canvas>
        </ErrorBoundary>
        {modelError && (
          <div id="model-error">Error loading model: {modelError}</div>
        )}
      </div>
      <h3>{description}</h3>
    </div>
  );
}

// Loading component
function Loader() {
  return <Html center>Loading...</Html>;
}

// Error boundary component
class ErrorBoundary extends Component<{
  children: ReactNode;
  onError: (error: Error) => void;
}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default Model;
