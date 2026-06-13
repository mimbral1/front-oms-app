"use client";

import { Toaster } from "react-hot-toast";
import { toastClassName } from "./toast.styles";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{ className: toastClassName }}
    />
  );
}
