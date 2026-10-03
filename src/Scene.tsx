import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  Box3,
  BufferGeometry,
  Color,
  FrontSide,
  Mesh,
  PerspectiveCamera,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { byId } from "./anatomy";
import { emphasis, pickTarget, type ViewerState } from "./state";
export type CameraCommand = {
  key: number;
  direction: "left" | "right" | "up" | "down";
};
type Props = {
  state: ViewerState;
  onSelect: (id: string) => void;
  command: CameraCommand;
  onOrbit: () => void;
};
type Part = { id: string; geometry: BufferGeometry };
class RenderBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Failure
        title="3D rendering is unavailable"
        text="Your browser may not support WebGL 2. Try a current browser with graphics acceleration. You can still explore every structure in the anatomy panel."
        retry={this.props.onRetry}
      />
    ) : (
      this.props.children
    );
  }
}
function Failure({
  title,
  text,
  retry,
}: {
  title: string;
  text: string;
  retry: () => void;
}) {
  return (
    <div className="scene-message" role="alert">
      <span className="eyebrow">VIEWER UNAVAILABLE</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="button primary" onClick={retry}>
        Retry 3D viewer
      </button>
    </div>
  );
}
function CameraRig({
  state,
  command,
  onOrbit,
  bounds,
}: {
  state: ViewerState;
  command: CameraCommand;
  onOrbit: () => void;
  bounds: Box3;
}) {
  const { camera, gl, invalidate, size } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const previousZoom = useRef(state.zoom);
  const lastFit = useRef<{
    key: number;
    view: string;
    distance: number;
  } | null>(null);
  const onOrbitRef = useRef(onOrbit);
  onOrbitRef.current = onOrbit;
  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    controls.current = c;
    c.enablePan = false;
    c.enableDamping = false;
    c.minDistance = 3;
    c.maxDistance = 30;
    c.maxPolarAngle = Math.PI - 0.1;
    c.minPolarAngle = 0.1;
    let interacting = false;
    c.addEventListener("start", () => {
      interacting = true;
    });
    c.addEventListener("end", () => {
      interacting = false;
    });
    c.addEventListener("change", () => {
      invalidate();
      if (interacting) onOrbitRef.current();
    });
    return () => {
      c.dispose();
      controls.current = null;
    };
  }, [camera, gl, invalidate]);
  useEffect(() => {
    const center = bounds.getCenter(new Vector3());
    const extent = bounds.getSize(new Vector3());
    const aspect = size.width / size.height;
    // Narrow stages need more side room than height room so the lateral
    // lung edges do not touch the screen edges on phones.
    const distance =
      Math.max(extent.y * 1.16, (extent.x * 1.34) / aspect) /
      (2 * Math.tan((32 * Math.PI) / 360));
    const directions = {
      Anterior: [0, 0, 1],
      Posterior: [0, 0, -1],
      "Left lateral": [1, 0, 0],
      "Right lateral": [-1, 0, 0],
    };
    const previous = lastFit.current;
    const resized =
      previous?.key === state.cameraKey && previous.view === state.view;
    const offset = camera.position.clone().sub(center);
    // Resizing the stage preserves a user's orbit and wheel/pinch zoom.
    // A named view or reset intentionally re-establishes the anatomical camera.
    const direction = resized
      ? offset.clone().normalize()
      : new Vector3(...directions[state.view]);
    const zoomFactor = resized
      ? offset.length() / previous.distance
      : 1 / previousZoom.current;
    camera.position
      .copy(center)
      .add(direction.multiplyScalar(distance * zoomFactor));
    lastFit.current = { key: state.cameraKey, view: state.view, distance };
    camera.up.set(0, 1, 0);
    camera.lookAt(center);
    controls.current?.target.copy(center);
    controls.current?.update();
    invalidate();
  }, [
    camera,
    invalidate,
    bounds,
    size.width,
    size.height,
    state.cameraKey,
    state.view,
  ]);
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    camera.position
      .sub(c.target)
      .multiplyScalar(previousZoom.current / state.zoom)
      .add(c.target);
    previousZoom.current = state.zoom;
    c.update();
    invalidate();
  }, [state.zoom, camera, invalidate, state.cameraKey]);
  useEffect(() => {
    if (!command.key) return;
    const c = controls.current;
    if (!c) return;
    const offset = camera.position.clone().sub(c.target);
    if (command.direction === "left" || command.direction === "right")
      offset.applyAxisAngle(
        new Vector3(0, 1, 0),
        command.direction === "left" ? 0.2 : -0.2,
      );
    else
      offset.applyAxisAngle(
        new Vector3().crossVectors(camera.up, offset).normalize(),
        command.direction === "up" ? 0.15 : -0.15,
      );
    camera.position.copy(c.target).add(offset);
    c.update();
    onOrbitRef.current();
    invalidate();
  }, [command, camera, invalidate]);
  return null;
}
const stageTone = new Color("#e4e3dc");
const muted = new Map<string, string>();
function mutedColor(color: string) {
  let value = muted.get(color);
  if (!value) {
    value = "#" + new Color(color).lerp(stageTone, 0.55).getHexString();
    muted.set(color, value);
  }
  return value;
}
function Model({
  parts,
  state,
  onSelect,
}: {
  parts: Part[];
  state: ViewerState;
  onSelect: (id: string) => void;
}) {
  const hidden = new Set(state.hidden);
  return (
    <group>
      {parts.map(({ id, geometry }) => {
        const n = byId[id];
        const surface = n.kind === "segment";
        const opacity = surface ? state.opacity : 1;
        if (hidden.has(id) || opacity === 0) return null;
        const target = pickTarget(id, state.pick);
        const emphasized = emphasis(id, state);
        const color = emphasized === "muted" ? mutedColor(n.color) : n.color;
        const select = (event: ThreeEvent<MouseEvent>) => {
          if (!target) return;
          event.stopPropagation();
          if (event.delta < 5) onSelect(target);
        };
        return (
          <mesh
            key={id}
            geometry={geometry}
            onClick={target ? select : undefined}
            raycast={target ? Mesh.prototype.raycast : () => {}}
          >
            <meshStandardMaterial
              key={opacity < 1 ? "revealed" : "solid"}
              color={color}
              roughness={surface ? 0.57 : 0.44}
              metalness={0}
              side={FrontSide}
              opacity={opacity}
              transparent={opacity < 1}
              depthWrite={opacity === 1}
              emissive={emphasized === "selected" ? n.color : "#000000"}
              emissiveIntensity={emphasized === "selected" ? 0.22 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}
function ContextGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}
export default function Scene(props: Props) {
  const [parts, setParts] = useState<Part[]>([]);
  const [bounds, setBounds] = useState<Box3>();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let geometries: BufferGeometry[] = [];
    setError(false);
    setProgress(0);
    setParts([]);
    setBounds(undefined);
    setContextLost(false);
    try {
      const probe = document.createElement("canvas").getContext("webgl2");
      if (!probe) {
        setSupported(false);
        return;
      }
      probe.getExtension("WEBGL_lose_context")?.loseContext();
      setSupported(true);
    } catch {
      setSupported(false);
      return;
    }
    async function load() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}models/lungs.glb`,
          { signal: controller.signal },
        );
        if (!response.ok) throw Error("Model unavailable");
        const total = Number(response.headers.get("content-length"));
        const reader = response.body?.getReader();
        if (!reader) throw Error("Download unavailable");
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (!cancelled)
            setProgress(total ? Math.min(95, (received / total) * 95) : 30);
        }
        const bytes = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
        const loaded: Part[] = [];
        gltf.scene.traverse((obj) => {
          if (obj instanceof Mesh) {
            if (!byId[obj.name]) throw Error("Unknown model structure");
            loaded.push({ id: obj.name, geometry: obj.geometry });
            geometries.push(obj.geometry);
            const mats = Array.isArray(obj.material)
              ? obj.material
              : [obj.material];
            mats.forEach((m) => m.dispose());
          }
        });
        if (loaded.length !== 20) throw Error("Incomplete model");
        if (cancelled) {
          geometries.forEach((g) => g.dispose());
          return;
        }
        const box = new Box3();
        for (const p of loaded) {
          p.geometry.computeBoundingBox();
          box.union(p.geometry.boundingBox!);
        }
        setParts(loaded);
        setBounds(box);
        setProgress(100);
      } catch (e) {
        if (!cancelled) {
          console.error("Lungs model could not load", e);
          setError(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
      geometries.forEach((g) => g.dispose());
    };
  }, [attempt]);
  const retry = () => setAttempt((x) => x + 1);
  if (supported === null)
    return (
      <div className="scene-message" role="status">
        Checking graphics support…
      </div>
    );
  if (!supported)
    return (
      <Failure
        title="WebGL 2 is unavailable"
        text="Try enabling graphics acceleration or use a current browser. All anatomy remains available as text."
        retry={retry}
      />
    );
  if (error)
    return (
      <Failure
        title="The anatomy model could not load"
        text="Check your connection and retry. Anatomy names and descriptions remain available in the panel. Local setup instructions include model recovery steps."
        retry={retry}
      />
    );
  if (contextLost)
    return (
      <Failure
        title="The graphics connection was interrupted"
        text="Retry to rebuild the 3D view. Your anatomy selection is still available in the panel."
        retry={retry}
      />
    );
  return (
    <RenderBoundary key={attempt} onRetry={retry}>
      <Canvas
        key={attempt}
        frameloop="demand"
        dpr={[1, 1.7]}
        camera={{ position: [0, 0, 14], fov: 32, near: 0.05, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.domElement.setAttribute(
            "aria-label",
            "Interactive lung anatomy. Use the adjacent anatomy and camera controls for keyboard access.",
          );
        }}
        fallback={
          <Failure
            title="WebGL 2 is unavailable"
            text="Try enabling graphics acceleration or use a current browser. All anatomy remains available as text."
            retry={retry}
          />
        }
      >
        <ContextGuard onLost={() => setContextLost(true)} />
        <ambientLight intensity={1.4} />
        <hemisphereLight args={["#fff7e9", "#70857e", 1.5]} />
        <directionalLight position={[-5, 8, 8]} intensity={2.7} />
        <directionalLight position={[5, 2, -6]} intensity={2} />
        {bounds && (
          <>
            <CameraRig {...props} bounds={bounds} />
            <Model
              parts={parts}
              state={props.state}
              onSelect={props.onSelect}
            />
          </>
        )}
      </Canvas>
      {progress < 100 && (
        <div className="scene-message loading" role="status">
          <span className="eyebrow">PREPARING YOUR EXPLORER</span>
          <h2>Making room to explore.</h2>
          <p>Loading lung surfaces and airways</p>
          <progress
            value={progress}
            max="100"
            aria-label="Model loading progress"
          />
          <span>{Math.round(progress)}%</span>
        </div>
      )}
    </RenderBoundary>
  );
}
