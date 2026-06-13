// features/delivery/components/rutas/listadorutas/TruckScene.tsx
// ============================================================================
// ESCENA 3D (three.js puro) — se carga SOLO en cliente vía next/dynamic.
//
// Render directo con three.js (sin react-reconciler) para ser independiente de
// la versión de React que use el host de Next. Aísla todo el WebGL del resto
// de la vista de Carga.
//
// Reglas de negocio visuales:
//   - Bultos pesados abajo, frágiles arriba (orden de apilado).
//   - Color por parada/ruta.
//   - Transparencia controlable (opacidad de materiales).
// ============================================================================

"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { LoadPlanPackage } from "./loadPlan";
import { stopColor } from "./loadPlan";
import type { LoadViewMode } from "./TruckLoad3DViewer";

/* ─── Geometría del compartimento de carga (metros, aprox.) ─── */
const TRUCK = { length: 6, width: 2.6, height: 2.8 };
const GRID = { rows: 4, cols: 3 }; // rows → largo (x), cols → ancho (z)
const PER_LAYER = GRID.rows * GRID.cols;
const GAP = 0.06;

/** Orden de apilado: pesados abajo, frágiles arriba (regla de negocio). */
function stackOrder(a: LoadPlanPackage, b: LoadPlanPackage): number {
  const rank = (p: LoadPlanPackage) => (p.heavy ? 0 : p.fragile ? 2 : 1);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  return b.weightKg - a.weightKg;
}

interface PlacedBox {
  pkg: LoadPlanPackage;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

function placeBoxes(packages: LoadPlanPackage[]): PlacedBox[] {
  const ordered = [...packages].sort(stackOrder);
  const boxW = TRUCK.length / GRID.rows - GAP; // x
  const boxD = TRUCK.width / GRID.cols - GAP; // z
  const boxH = 0.72; // y

  return ordered.map((pkg, i) => {
    const layer = Math.floor(i / PER_LAYER);
    const within = i % PER_LAYER;
    const row = Math.floor(within / GRID.cols);
    const col = within % GRID.cols;

    const x = (row + 0.5) * (TRUCK.length / GRID.rows) - TRUCK.length / 2;
    const z = (col + 0.5) * (TRUCK.width / GRID.cols) - TRUCK.width / 2;
    const y = boxH / 2 + layer * (boxH + GAP);

    return {
      pkg,
      position: [x, y, z],
      size: [boxW, boxH, boxD],
      color: stopColor(pkg.stopSequence),
    };
  });
}

export interface TruckSceneProps {
  packages: LoadPlanPackage[];
  viewMode: LoadViewMode;
  /** Opacidad de las cajas, 0–100. */
  transparency: number;
  controlsRef: React.MutableRefObject<any | null>;
}

export default function TruckScene({
  packages,
  viewMode,
  transparency,
  controlsRef,
}: TruckSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<any | null>(null);
  const sceneRef = useRef<any | null>(null);
  const cameraRef = useRef<any | null>(null);
  const cargoGroupRef = useRef<any | null>(null);
  const boxMaterialsRef = useRef<any[]>([]);

  /* ── Inicialización del renderer/escena (una vez) ── */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 400;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(8, 6, 9);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Luces
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(6, 10, 6);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dir2.position.set(-6, 6, -4);
    scene.add(dir2);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb0bcc9, 0.4));

    // Piso / plataforma
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(TRUCK.length + 0.4, TRUCK.width + 0.4),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Furgón: caja translúcida + aristas
    const shellGeo = new THREE.BoxGeometry(
      TRUCK.length,
      TRUCK.height,
      TRUCK.width
    );
    const shell = new THREE.Mesh(
      shellGeo,
      new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
      })
    );
    shell.position.y = TRUCK.height / 2;
    scene.add(shell);
    const shellEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(shellGeo),
      new THREE.LineBasicMaterial({ color: 0x94a3b8 })
    );
    shellEdges.position.y = TRUCK.height / 2;
    scene.add(shellEdges);

    // Grupo de carga (los bultos se construyen en el otro effect)
    const cargo = new THREE.Group();
    scene.add(cargo);
    cargoGroupRef.current = cargo;

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 20;
    controls.target.set(0, 1.1, 0);
    controls.update();
    controls.saveState(); // estado base para reset()
    controlsRef.current = controls;

    // Loop de animación
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      shellGeo.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      controlsRef.current = null;
    };
    // controlsRef es estable (ref); init solo una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── (Re)construir bultos cuando cambian packages o viewMode ── */
  useEffect(() => {
    const cargo = cargoGroupRef.current;
    if (!cargo) return;

    // Limpiar bultos previos
    for (const child of [...cargo.children]) {
      cargo.remove(child);
      child.traverse((obj: any) => {
        const mesh = obj as any;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as any).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
    }
    boxMaterialsRef.current = [];

    const opacity = Math.max(0.15, Math.min(1, 1 - transparency / 100));
    const showEdges = viewMode === "packages";

    for (const box of placeBoxes(packages)) {
      const geo = new THREE.BoxGeometry(...box.size);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(box.color),
        transparent: opacity < 1,
        opacity,
        roughness: 0.55,
        metalness: 0.05,
      });
      boxMaterialsRef.current.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...box.position);

      if (showEdges) {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
          })
        );
        mesh.add(edges);
      }
      cargo.add(mesh);
    }
  }, [packages, viewMode, transparency]);

  /* ── Actualizar opacidad cuando cambia la transparencia ── */
  useEffect(() => {
    const opacity = Math.max(0.15, Math.min(1, 1 - transparency / 100));
    for (const mat of boxMaterialsRef.current) {
      mat.opacity = opacity;
      mat.transparent = opacity < 1;
      mat.needsUpdate = true;
    }
  }, [transparency]);

  return <div ref={mountRef} className="h-full w-full" />;
}
