"use client";

import NativeListScreen from "@/features/mobile/_generic/NativeListScreen";
import { MODULES } from "@/features/mobile/_generic/modules";

export default function Page() {
  return <NativeListScreen config={MODULES["catalogo"]} />;
}
