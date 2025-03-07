import {
  Suspense,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, Environment } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import Template from "../Template/Template";
import "./Exhibit.css";
import { useNavigate } from "react-router-dom";

// Duck data with IDs, URLs, and names
const DUCKS = [
  { id: 1, url: "/models/mj_duck.glb", name: "King of Pop Duck" },
  { id: 2, url: "/models/mj_duck.glb", name: "King of Pop Duck" },
  { id: 3, url: "/models/mj_duck.glb", name: "King of Pop Duck" },
  { id: 4, url: "/models/mj_duck.glb", name: "King of Pop Duck" },
];

function SelectableDuck({
  modelUrl,
  position,
  id,
  isSelected,
  anyDuckSelected,
  onSelect,
}: {
  modelUrl: string;
  position: [number, number, number];
  id: number;
  isSelected: boolean;
  anyDuckSelected: boolean;
  onSelect: (id: number) => void;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const modelRef = useRef<THREE.Group>(null);
  const originalMaterialsRef = useRef(new Map());

  // Clone the scene to avoid shared materials
  const model = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  // Store original materials on first render
  useEffect(() => {
    if (!model) return;

    model.traverse((node: any) => {
      if (node.isMesh && node.material) {
        // Store a reference to the original material if not already stored
        if (!originalMaterialsRef.current.has(node.uuid)) {
          originalMaterialsRef.current.set(node.uuid, node.material.clone());
        }
      }
    });
  }, [model]);

  // Make the duck spin
  useFrame(() => {
    if (modelRef.current) {
      // Rotate faster by default, slower when selected
      modelRef.current.rotation.y +=
        anyDuckSelected && !isSelected ? 0.002 : 0.01;
    }
  });

  const scale = 1.5;

  // Apply materials based on selection state
  useEffect(() => {
    if (!model) return;

    model.traverse((node: any) => {
      if (node.isMesh) {
        // Only apply gray material if a duck is
        // selected and this duck is not the selected one
        if (anyDuckSelected && !isSelected) {
          // Apply metallic gray material
          // for unselected ducks
          const grayMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x888888),
            metalness: 0.9,
            roughness: 0.3,
            envMapIntensity: 1.0,
          });

          // Apply the gray material
          node.material = grayMaterial;
        } else {
          // Restore original colorful material
          // for selected duck or when no duck is selected
          const originalMaterial = originalMaterialsRef.current.get(node.uuid);
          if (originalMaterial) {
            node.material = originalMaterial.clone();
          }
        }

        // Always ensure material is updated
        node.material.needsUpdate = true;
      }
    });
  }, [model, isSelected, anyDuckSelected]);

  // Function to find the canvas
  // element and apply pointer cursor
  const setCursorStyle = (isPointer: boolean) => {
    const canvas = document.querySelector("#model-grid canvas");
    if (canvas) {
      if (isPointer) {
        canvas.classList.add("duck-hover");
      } else {
        canvas.classList.remove("duck-hover");
      }
    }
  };

  return (
    <group position={position}>
      <primitive
        ref={modelRef}
        object={model}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setCursorStyle(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setCursorStyle(false);
        }}
      />
    </group>
  );
}

// Main Exhibit component
function Exhibit() {
  const navigate = useNavigate();
  const [selectedDuckId, setSelectedDuckId] = useState<number | null>(null);

  const handleSelectDuck = useCallback((id: number) => {
    setSelectedDuckId((prevId) => {
      // If we click other duck than currently selected, select it
      if (prevId !== id) {
        return id;
      } else {
        return prevId;
      }
    });
  }, []);

  // Get the selected duck data
  const selectedDuck = DUCKS.find((duck) => duck.id === selectedDuckId);

  // Handle proceeding to order
  const handleProceedToOrder = () => {
    if (selectedDuck) {
      navigate("/order", {
        state: {
          selectedDuckUrl: selectedDuck.url,
          selectedDuckDescription: selectedDuck.name,
        },
      });
    }
  };

  // Check if any duck is selected
  const anyDuckSelected = selectedDuckId !== null;
  // Grid spacing configuration
  const gridSpacing = 2.0;

  // Make sure cursor is reset when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
      const canvas = document.querySelector("#model-grid canvas");
      if (canvas) {
        canvas.classList.remove("duck-hover");
      }
    };
  }, []);

  return (
    <Template onBackClick={() => navigate(-1)}>
      <div id="title-wrapper">
        <h1>Order your duck</h1>
        <h1>Right now</h1>
      </div>
      <div id="model-grid">
        <Canvas
          camera={{ position: [0, 0, 12], fov: 40 }}
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
            castShadow={false}
          />
          <pointLight position={[0, 5, 0]} intensity={0.8} />
          <Environment preset="studio" background={false} />

          <Suspense fallback={<Html center>Loading models...</Html>}>
            {DUCKS.map((duck, index) => {
              // Calculate positions in a grid with equal spacing
              const row = Math.floor(index / 2);
              const col = index % 2;

              // Use same spacing for x and y
              const x = col === 0 ? -gridSpacing : gridSpacing;
              const y = row === 0 ? gridSpacing : -gridSpacing;

              return (
                <SelectableDuck
                  key={duck.id}
                  id={duck.id}
                  modelUrl={duck.url}
                  position={[x, y, 0]}
                  isSelected={selectedDuckId === duck.id}
                  anyDuckSelected={anyDuckSelected}
                  onSelect={handleSelectDuck}
                />
              );
            })}
          </Suspense>
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Canvas>
        <h3 id="collection-description">King of pop duck</h3>
      </div>
      <div id="exhibit-actions-wrapper">
        <div id="exhibit-action-description">
          <h3>
            {selectedDuckId
              ? `You selected duck #${selectedDuckId}`
              : "Select your desired duck"}
          </h3>
        </div>
        <div id="exhibit-actions">
          <h4
            onClick={() => {
              navigate(-1);
            }}
          >
            Go back
          </h4>
          <span>&nbsp;or&nbsp;</span>
          <h4
            onClick={handleProceedToOrder}
            className={!selectedDuckId ? "action-inactive" : ""}
          >
            Proceed with your order
          </h4>
        </div>
      </div>
    </Template>
  );
}

export default Exhibit;
