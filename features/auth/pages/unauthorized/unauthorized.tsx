// app/unauthorized/page.tsx
"use client";

import { Button, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-white p-10 shadow-xl">
        {/* Ícono */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <LockOutlinedIcon fontSize="large" className="text-red-600" />
        </div>

        {/* Título y texto */}
        <Typography variant="h4" component="h1" className="font-semibold">
          Acceso no autorizado
        </Typography>
        <Typography
          variant="body1"
          className="text-center text-gray-600 max-w-sm"
        >
          No tienes permisos para ver esta sección. Si crees que se trata de un
          error, contacta a un administrador o vuelve al inicio.
        </Typography>

        {/* Botones */}
        <div className="flex gap-4">
          <Link href="/home">
            <Button variant="contained" color="primary">
              Ir al inicio
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outlined">Iniciar sesión</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
