// test-carga.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 30, // 30 usuarios virtuales concurrentes
  duration: "1m", // durante 1 minuto
  thresholds: {
    http_req_duration: ["p(95)<500"], // El 95% de los requests deben durar < 500ms
  },
};

export default function () {
  const ordersApiUrl = __ENV.ORDERS_API_URL;
  if (!ordersApiUrl) {
    throw new Error("ORDERS_API_URL no esta definido");
  }

  const res = http.get(ordersApiUrl);

  check(res, {
    "✅ status 200": (r) => r.status === 200,
    "⚡ respuesta rápida (<500ms)": (r) => r.timings.duration < 500,
  });

  sleep(1); // Simula que el usuario espera 1 segundo entre acciones
}
