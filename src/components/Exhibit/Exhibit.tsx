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
import { getDuckData, clearDuckData } from "../../utils/indexedDB";

const DUCKS = [
  { id: 1, url: "/models/mj_duck.glb", name: "King of Pop Duck" },
  { id: 2, url: "/models/leather_duck.glb", name: "Rockstar Duck" },
  { id: 3, url: "/models/chinese_duck.glb", name: "Chinese Duck" },
  { id: 4, url: "/models/police_duck.glb", name: "Police Duck" },
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
  name: string;
}) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const modelRef = useRef<THREE.Group>(null);
  const originalMaterialsRef = useRef(new Map());
  const model = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  useEffect(() => {
    if (!model) return;
    model.traverse((node: any) => {
      if (node.isMesh && node.material) {
        if (!originalMaterialsRef.current.has(node.uuid)) {
          originalMaterialsRef.current.set(node.uuid, node.material.clone());
        }
      }
    });
  }, [model]);

  useFrame(() => {
    if (modelRef.current) {
      modelRef.current.rotation.y +=
        anyDuckSelected && !isSelected ? 0.002 : 0.01;
    }
  });

  useEffect(() => {
    if (!model) return;
    model.traverse((node: any) => {
      if (node.isMesh) {
        if (anyDuckSelected && !isSelected) {
          const grayMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x888888),
            metalness: 0.9,
            roughness: 0.3,
            envMapIntensity: 1.0,
          });
          node.material = grayMaterial;
        } else {
          const originalMaterial = originalMaterialsRef.current.get(node.uuid);
          if (originalMaterial) {
            node.material = originalMaterial.clone();
          }
        }
        node.material.needsUpdate = true;
      }
    });
  }, [model, isSelected, anyDuckSelected]);

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
        scale={1.5}
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

function Exhibit() {
  const navigate = useNavigate();
  const [selectedDuckId, setSelectedDuckId] = useState<number | null>(null);
  const [generatedDuckUrls, setGeneratedDuckUrls] = useState<string[]>([]);
  const [promptDescription, setPromptDescription] = useState<string>("");

  useEffect(() => {
    const loadDucks = async () => {
      try {
        const data = await getDuckData();

        if (data && data.ducks) {
          const urls = data.ducks.map((duckData: string) => {
            const binaryString = window.atob(duckData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "model/gltf-binary" });
            return URL.createObjectURL(blob);
          });

          setGeneratedDuckUrls(urls);
          setPromptDescription(data.prompt);
        }
      } catch (error) {
        console.error("Error loading duck data:", error);
      }
    };

    loadDucks();

    return () => {
      generatedDuckUrls.forEach((url) => URL.revokeObjectURL(url));
      clearDuckData().catch(console.error);
    };
  }, []);

  const displayDucks = useMemo(() => {
    if (generatedDuckUrls.length > 0) {
      return generatedDuckUrls.map((url, index) => ({
        id: index + 1,
        url,
        name: promptDescription,
      }));
    }
    return DUCKS;
  }, [generatedDuckUrls]);

  const handleSelectDuck = useCallback((id: number) => {
    setSelectedDuckId((prevId) => (prevId !== id ? id : prevId));
  }, []);

  const selectedDuck = displayDucks.find((duck) => duck.id === selectedDuckId);

  const handleProceedToOrder = () => {
    if (selectedDuck) {
      navigate("/order", {
        state: {
          selectedDuckUrl: selectedDuck.url,
          selectedDuckDescription:
            selectedDuck.id === 1 ? promptDescription : selectedDuck.name,
        },
      });
    }
  };

  const anyDuckSelected = selectedDuckId !== null;
  const gridSpacing = 2.0;

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
            {displayDucks.map((duck, index) => {
              const row = Math.floor(index / 2);
              const col = index % 2;
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
                  name={duck.name}
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
        <h3 id="collection-description">
          {selectedDuckId === 1 && promptDescription
            ? promptDescription
            : selectedDuck?.name || "Select a duck"}
        </h3>
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
          <h4 onClick={() => navigate(-1)}>Go back</h4>
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
