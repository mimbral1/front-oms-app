// import { User } from "@/app/context/auth/AuthContext";

export const VALID_CREDENTIALS = {
  email: "admin@mimbral.com",
  password: "admin123",
};

export const MOCK_PROFILE = {
  id: "u-001",
  email: "admin@mimbral.com",
  nombre: "Marcelo",
  apellido: "Cancino",
  rol: "admin",
};

// export const MOCK_USERS = [
//   {
//     email: "admin@mimbral.com",
//     password: "admin123",
//     profile: {
//       id: "u-001",
//       email: "admin@mimbral.com",
//       nombre: "Marcelo",
//       apellido: "Cancino",
//       role: "admin",
//     } satisfies User,
//   },
//   {
//     email: "vendedor@mimbral.com",
//     password: "ventas123",
//     profile: {
//       id: "u-002",
//       email: "vendedor@mimbral.com",
//       nombre: "Ana",
//       apellido: "Vega",
//       role: "user",
//     } satisfies User,
//   },
// ] as const;
