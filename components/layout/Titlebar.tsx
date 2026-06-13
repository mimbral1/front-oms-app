// components/Titlebar.tsx
"use client";

export default function Titlebar() {
  // sólo en Electron tendremos electronAPI
  const isElectron =
    typeof window !== "undefined" &&
    typeof (window as any).electronAPI === "object";

  if (!isElectron) return null;

  return (
    <div className="drag flex h-8 w-full items-center justify-end gap-3 bg-gray-800 text-white select-none">
      <button onClick={() => (window as any).windowAPI.minimize()}>—</button>
      <button onClick={() => (window as any).windowAPI.maximize()}>🔲</button>
      <button onClick={() => (window as any).windowAPI.close()}>✕</button>
    </div>
  );
}
