"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PickingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/picking/rondas");
  }, [router]);

  return null;
}
