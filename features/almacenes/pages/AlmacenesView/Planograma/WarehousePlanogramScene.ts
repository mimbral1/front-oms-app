import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type SceneStatus = "available" | "occupied" | "reserved" | "blocked";
export type SceneOrientation = "V" | "H";

export type SceneRack = {
  id: number;
  label: string;
  orientation: SceneOrientation;
  levels: number;
  positions: number;
  heightM: number;
  schemaType: string;
};

export type ScenePosition = {
  id: string;
  positionKey: string;
  status: SceneStatus;
  rackId: number;
  level: number;
  index: number;
  schemaType: string;
};

type Placement = {
  axis: "x" | "z";
  start: number;
  lateral: number;
};

type ShellSpec = {
  pos: any;
  size: [number, number, number];
  color: any;
  position: ScenePosition;
};

type BoxSpec = {
  pos: any;
  size: [number, number, number];
};

const BAY_WIDTH = 1.5;
const BIN_LEN = 1.4;
const BIN_DEPTH = 1.1;
const BIN_H_RATIO = 0.82;
const RACK_PITCH_X = 4.4;
const HALF_ACROSS = BIN_DEPTH / 2 + 0.1;
const POST_THICK = 0.1;
const BEAM_THICK = 0.08;
const ZONE_GAP = 6;
const FIT_MARGIN = 0.9;

const COLORS = {
  background: "#ffffff",
  floor: "#ffffff",
  frame: "#7b8aa3",
  rackLabel: "#56657f",
  zoneLabel: "#93a0b5",
  reception: "#3b82f6",
  dispatch: "#22c55e",
  outline: "#2563eb",
};

const STATUS_COLORS: Record<SceneStatus, string> = {
  available: "#10b981",
  occupied: "#3b82f6",
  reserved: "#f59e0b",
  blocked: "#64748b",
};

const SECTOR_COLORS = [
  "#60a5fa",
  "#86efac",
  "#c4b5fd",
  "#5eead4",
  "#fcd34d",
  "#fca5a5",
];

const HIGHLIGHT = new THREE.Color("#0b1220");
const HOVER_MIX = 0.2;
const SELECT_MIX = 0.32;
const OUTLINE_SCALE = 1.05;
const CAM_DIR = new THREE.Vector3(0.55, 0.58, 1).normalize();
const NO_ROTATION = new THREE.Quaternion();

function levelPitch(rack: SceneRack): number {
  return rack.heightM / Math.max(1, rack.levels);
}

function colorForSector(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % SECTOR_COLORS.length;
  }
  return SECTOR_COLORS[Math.abs(hash)];
}

export class WarehousePlanogramScene {
  private readonly container: HTMLElement;
  private readonly racks: SceneRack[];
  private readonly onSelect: (position: ScenePosition) => void;

  private scene!: any;
  private camera!: any;
  private renderer!: any;
  private controls!: any;
  private raf = 0;

  private readonly ray = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private shells!: any;
  private readonly shellSpecs: ShellSpec[] = [];
  private readonly shellMatrix: any[] = [];
  private hoveredId = -1;
  private selectedId = -1;
  private selectedOutline: any | null = null;
  private readonly frameMat = new THREE.MeshLambertMaterial({ color: COLORS.frame });
  private readonly byRack = new Map<number, Map<string, ScenePosition>>();
  private readonly camHome = new THREE.Vector3();
  private readonly target = new THREE.Vector3();

  constructor(
    container: HTMLElement,
    racks: SceneRack[],
    positions: ScenePosition[],
    onSelect: (position: ScenePosition) => void
  ) {
    this.container = container;
    this.racks = racks;
    this.onSelect = onSelect;

    this.indexPositions(positions);
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.buildLights();
    this.buildFloor();
    this.buildRacks();
    this.frameCamera();

    this.renderer.domElement.addEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.loop();
  }

  private indexPositions(positions: ScenePosition[]) {
    positions.forEach((position) => {
      let byCoord = this.byRack.get(position.rackId);
      if (!byCoord) {
        byCoord = new Map();
        this.byRack.set(position.rackId, byCoord);
      }
      byCoord.set(`${position.level}-${position.index}`, position);
    });
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.fog = new THREE.Fog(COLORS.background, 130, 380);
  }

  private initCamera() {
    const aspect = Math.max(1, this.container.clientWidth) / Math.max(1, this.container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.container.appendChild(this.renderer.domElement);
  }

  private initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 240;
    this.controls.maxPolarAngle = Math.PI / 2.05;
  }

  private buildLights() {
    this.scene.add(new THREE.HemisphereLight("#ffffff", "#c9d4e6", 1.15));
    const key = new THREE.DirectionalLight("#ffffff", 0.58);
    key.position.set(40, 60, 30);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight("#dbe7ff", 0.32);
    fill.position.set(-30, 24, -24);
    this.scene.add(fill);
  }

  private buildFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      new THREE.MeshBasicMaterial({ color: COLORS.floor })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
  }

  private buildRacks() {
    const verticalRacks = this.racks.filter((rack) => rack.orientation === "V");
    const horizontalRacks = this.racks.filter((rack) => rack.orientation === "H");
    const maxBays = Math.max(1, ...verticalRacks.map((rack) => rack.positions));
    const maxLen = maxBays * BAY_WIDTH;
    const frontZ = -maxLen / 2;
    const backZ = frontZ + maxLen;
    const startX = -((verticalRacks.length - 1) * RACK_PITCH_X) / 2;
    const firstDispatchZ = backZ + ZONE_GAP;

    const posts: BoxSpec[] = [];
    const beams: BoxSpec[] = [];
    let verticalIndex = 0;
    let horizontalIndex = 0;
    let lastDispatchZ = firstDispatchZ;

    this.racks.forEach((rack) => {
      let placement: Placement;
      if (rack.orientation === "V") {
        placement = { axis: "z", start: frontZ, lateral: startX + verticalIndex * RACK_PITCH_X };
        verticalIndex += 1;
      } else {
        lastDispatchZ = firstDispatchZ + horizontalIndex * RACK_PITCH_X;
        placement = { axis: "x", start: -(rack.positions * BAY_WIDTH) / 2, lateral: lastDispatchZ };
        horizontalIndex += 1;
      }

      this.buildRack(rack, placement, posts, beams);
    });

    this.commitInstances(posts, beams);
    this.floorZone("RECEPCION", 0, frontZ - ZONE_GAP - 1, COLORS.reception);
    if (horizontalRacks.length > 0) {
      this.floorZone("DESPACHO", 0, lastDispatchZ + ZONE_GAP + 1, COLORS.dispatch);
    }
  }

  private buildRack(rack: SceneRack, placement: Placement, posts: BoxSpec[], beams: BoxSpec[]) {
    this.buildRackFloor(rack, placement);
    this.buildBins(rack, placement);
    this.buildFrame(rack, placement, posts, beams);
    this.buildRackLabel(rack, placement);
  }

  private buildRackFloor(rack: SceneRack, placement: Placement) {
    const runLen = rack.positions * BAY_WIDTH;
    const laneAcross = RACK_PITCH_X * 0.94;
    const laneAlong = runLen + BAY_WIDTH;
    const width = placement.axis === "z" ? laneAcross : laneAlong;
    const height = placement.axis === "z" ? laneAlong : laneAcross;
    const { x, z } = this.worldOf(placement, placement.start + runLen / 2, placement.lateral);
    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color: colorForSector(rack.schemaType),
        transparent: true,
        opacity: 0.45,
      })
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(x, 0.015, z);
    this.scene.add(lane);
  }

  private buildBins(rack: SceneRack, placement: Placement) {
    const lookup = this.byRack.get(rack.id);
    if (!lookup) return;

    const pitch = levelPitch(rack);
    const binH = pitch * BIN_H_RATIO;
    const binSizeX = placement.axis === "z" ? BIN_DEPTH : BIN_LEN;
    const binSizeZ = placement.axis === "z" ? BIN_LEN : BIN_DEPTH;

    for (let level = 1; level <= rack.levels; level += 1) {
      const y = (level - 1) * pitch + pitch / 2;
      for (let positionIndex = 1; positionIndex <= rack.positions; positionIndex += 1) {
        const position = lookup.get(`${level}-${positionIndex}`);
        if (!position) continue;

        const alongPos = placement.start + (positionIndex - 0.5) * BAY_WIDTH;
        const { x, z } = this.worldOf(placement, alongPos, placement.lateral);
        this.shellSpecs.push({
          pos: new THREE.Vector3(x, y, z),
          size: [binSizeX, binH, binSizeZ],
          color: new THREE.Color(STATUS_COLORS[position.status]),
          position,
        });
      }
    }
  }

  private buildFrame(rack: SceneRack, placement: Placement, posts: BoxSpec[], beams: BoxSpec[]) {
    const pitch = levelPitch(rack);
    for (let marker = 0; marker <= rack.positions; marker += 1) {
      const alongPos = placement.start + marker * BAY_WIDTH;
      [-1, 1].forEach((side) => {
        const { x, z } = this.worldOf(placement, alongPos, placement.lateral + side * HALF_ACROSS);
        posts.push({
          pos: new THREE.Vector3(x, rack.heightM / 2, z),
          size: [POST_THICK, rack.heightM, POST_THICK],
        });
      });
    }

    const runLen = rack.positions * BAY_WIDTH;
    const centerAlong = placement.start + runLen / 2;
    for (let level = 0; level <= rack.levels; level += 1) {
      const y = level * pitch;
      [-1, 1].forEach((side) => {
        const { x, z } = this.worldOf(placement, centerAlong, placement.lateral + side * HALF_ACROSS);
        const size: [number, number, number] =
          placement.axis === "z" ? [BEAM_THICK, BEAM_THICK, runLen] : [runLen, BEAM_THICK, BEAM_THICK];
        beams.push({ pos: new THREE.Vector3(x, y, z), size });
      });
    }
  }

  private buildRackLabel(rack: SceneRack, placement: Placement) {
    const { x, z } = this.worldOf(placement, placement.start - 1, placement.lateral);
    const label = this.makeLabel(rack.label, { size: 58, color: COLORS.rackLabel, weight: 700 });
    label.scale.multiplyScalar(2.4);
    label.position.set(x, 0.8, z);
    this.scene.add(label);
  }

  private commitInstances(posts: BoxSpec[], beams: BoxSpec[]) {
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const shellMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.shells = new THREE.InstancedMesh(unit, shellMat, this.shellSpecs.length);
    this.shells.frustumCulled = false;

    this.shellSpecs.forEach((spec, index) => {
      const matrix = this.matrixOf(spec.pos, spec.size);
      this.shellMatrix.push(matrix);
      this.shells.setMatrixAt(index, matrix);
      this.shells.setColorAt(index, spec.color);
    });
    this.shells.instanceMatrix.needsUpdate = true;
    if (this.shells.instanceColor) {
      this.shells.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.shells);

    const frame = [...posts, ...beams];
    const frameMesh = new THREE.InstancedMesh(unit, this.frameMat, frame.length);
    frameMesh.frustumCulled = false;
    frame.forEach((box, index) => frameMesh.setMatrixAt(index, this.matrixOf(box.pos, box.size)));
    frameMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(frameMesh);
  }

  private makeLabel(text: string, opts: { size?: number; color?: string; weight?: number } = {}): any {
    const { size = 64, color = "#e6edf6", weight = 600 } = opts;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is not available.");

    ctx.font = `${weight} ${size}px Arial`;
    canvas.width = Math.max(1, Math.ceil(ctx.measureText(text).width));
    canvas.height = Math.ceil(size * 1.4);
    ctx.font = `${weight} ${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(text, 0, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.scale.set(canvas.width / canvas.height, 1, 1);
    return sprite;
  }

  private floorZone(label: string, x: number, z: number, color: string) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 7),
      new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.22 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, 0.02, z);
    this.scene.add(plane);

    const sprite = this.makeLabel(label, { size: 54, color: COLORS.zoneLabel });
    sprite.scale.multiplyScalar(3.2);
    sprite.position.set(x, 1.8, z);
    this.scene.add(sprite);
  }

  private worldOf(placement: Placement, alongPos: number, cross: number): { x: number; z: number } {
    return placement.axis === "z" ? { x: cross, z: alongPos } : { x: alongPos, z: cross };
  }

  private matrixOf(pos: any, size: [number, number, number]): any {
    return new THREE.Matrix4().compose(pos, new THREE.Quaternion(), new THREE.Vector3(size[0], size[1], size[2]));
  }

  private frameCamera() {
    if (this.shellSpecs.length === 0) {
      this.camera.position.set(12, 12, 18);
      this.controls.target.set(0, 0, 0);
      this.camHome.copy(this.camera.position);
      this.target.copy(this.controls.target);
      return;
    }

    const box = new THREE.Box3();
    this.shellSpecs.forEach((spec) => box.expandByPoint(spec.pos));
    const center = box.getCenter(new THREE.Vector3());
    const radius = 0.5 * box.getSize(new THREE.Vector3()).length() + 3;
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const dist = (radius / Math.sin(Math.min(vFov, hFov) / 2)) * FIT_MARGIN;

    this.target.copy(center);
    this.camHome.copy(center).addScaledVector(CAM_DIR, dist);
    this.camera.position.copy(this.camHome);
    this.controls.target.copy(this.target);
  }

  private setPointer(event: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private pickInstance(): number {
    if (!this.shells) return -1;
    this.ray.setFromCamera(this.pointer, this.camera);
    const hits = this.ray.intersectObject(this.shells, false);
    return hits.length > 0 && hits[0].instanceId != null ? hits[0].instanceId : -1;
  }

  private paint(id: number, color: any) {
    this.shells.setColorAt(id, color);
    if (this.shells.instanceColor) {
      this.shells.instanceColor.needsUpdate = true;
    }
  }

  private restoreColor(id: number) {
    this.paint(id, this.shellSpecs[id].color);
  }

  private handlePointerMove = (event: PointerEvent) => {
    this.setPointer(event);
    const id = this.pickInstance();
    if (id === this.hoveredId) return;
    if (this.hoveredId >= 0 && this.hoveredId !== this.selectedId) {
      this.restoreColor(this.hoveredId);
    }
    this.hoveredId = id;
    if (id >= 0 && id !== this.selectedId) {
      this.paint(id, this.shellSpecs[id].color.clone().lerp(HIGHLIGHT, HOVER_MIX));
    }
    this.renderer.domElement.style.cursor = id >= 0 ? "pointer" : "default";
  };

  private handlePointerDown = (event: PointerEvent) => {
    this.setPointer(event);
    const id = this.pickInstance();
    if (id >= 0) {
      this.select(id);
    }
  };

  private clearSelection() {
    if (this.selectedOutline) {
      this.scene.remove(this.selectedOutline);
      this.selectedOutline.geometry.dispose();
      const material = this.selectedOutline.material;
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else {
        material.dispose();
      }
      this.selectedOutline = null;
    }
    if (this.selectedId >= 0) {
      this.restoreColor(this.selectedId);
    }
    this.selectedId = -1;
  }

  private select(id: number) {
    this.clearSelection();
    this.selectedId = id;
    const spec = this.shellSpecs[id];
    this.paint(id, spec.color.clone().lerp(HIGHLIGHT, SELECT_MIX));

    const box = new THREE.BoxGeometry(
      ...(spec.size.map((value) => value * OUTLINE_SCALE) as [number, number, number])
    );
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    this.selectedOutline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: COLORS.outline }));
    this.selectedOutline.position.copy(spec.pos);
    this.scene.add(this.selectedOutline);

    this.onSelect(spec.position);
  }

  public resetView() {
    this.camera.position.copy(this.camHome);
    this.controls.target.copy(this.target);
  }

  public selectByPositionId(positionId: string | null) {
    if (!positionId) {
      this.clearSelection();
      return;
    }

    const index = this.shellSpecs.findIndex((spec) => spec.position.id === positionId);
    if (index >= 0 && index !== this.selectedId) {
      this.select(index);
    }
  }

  public resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    cancelAnimationFrame(this.raf);
    this.renderer.domElement.removeEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.controls.dispose();
    this.scene.traverse((object: any) => {
      const mesh = object as any;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (!material) return;
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((item) => {
        const standard = item as any;
        standard.map?.dispose();
        item.dispose();
      });
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
