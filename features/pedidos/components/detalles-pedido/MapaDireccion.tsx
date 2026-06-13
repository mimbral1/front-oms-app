// "use client";

// import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
// import { useEffect, useState } from "react";

// type Props = {
//     direccion: string;
// };

// const containerStyle = { width: "100%", height: "600px" };

// const centerDefault = {
//     lat: -35.6036296,
//     lng: -71.7348412, // ferretería mimbral
// };

// const LOADER_ID = "google-map-script"; // igual que en el otro componente

// export function MapaDireccion({ direccion }: Props) {
//     const [coords, setCoords] = useState(centerDefault);

//     const { isLoaded } = useJsApiLoader({
//         id: LOADER_ID,
//         googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
//         // No necesitas libraries aquí; usas Geocoding REST + Marker simple
//     });

//     useEffect(() => {
//         if (!direccion) return;

//         const geocode = async () => {
//             const res = await fetch(
//                 `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
//                     direccion
//                 )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
//             );
//             const data = await res.json();

//             if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
//                 const { lat, lng } = data.results[0].geometry.location;
//                 setCoords({ lat, lng });
//             }
//             // Opcional: maneja otros status (ZERO_RESULTS, OVER_QUERY_LIMIT, etc.)
//         };

//         geocode();
//     }, [direccion]);

//     if (!isLoaded) return <p>Cargando mapa...</p>;

//     return (
//         <GoogleMap mapContainerStyle={containerStyle} center={coords} zoom={16}>
//             <Marker position={coords} />
//         </GoogleMap>
//     );
// }

// views/PedidosView/Detalles-Pedido/components/MapaDireccion.tsx
"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";

type Props = { direccion: string };

const containerStyle = { width: "100%", height: "320px" };
const centerDefault = { lat: -35.6036296, lng: -71.7348412 };
const LOADER_ID = "google-map-script";

export function MapaDireccion({ direccion }: Props) {
    const { isLoaded, loadError } = useLoadScript({
        id: LOADER_ID,
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: ["places", "drawing"],
    });

    const [coords, setCoords] = useState(centerDefault);

    const query = useMemo(() => (direccion || "").trim(), [direccion]);

    useEffect(() => {
        if (!query) return;

        const run = async () => {
            try {
                const res = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                        query
                    )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
                );
                const data = await res.json();
                const loc = data?.results?.[0]?.geometry?.location;
                if (loc?.lat && loc?.lng) setCoords({ lat: loc.lat, lng: loc.lng });
            } catch {
                // ignorar; dejamos coords por defecto
            }
        };
        run();
    }, [query]);

    if (loadError) {
        // Fallback: tarjeta de error — NO se monta GoogleMap
        return (
            <div className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white p-8 text-center">
                <div>
                    <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                        !
                    </div>
                    <div className="text-base font-semibold text-gray-900">
                        No pudimos cargar el mapa
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                        Revisa la clave y restricciones de Google Maps, o vuelve a intentar.
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            Reintentar
                        </button>
                        <a
                            href="https://developers.google.com/maps/documentation/javascript/error-messages#project-denied-map-error"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline"
                        >
                            Ver ayuda
                        </a>
                        {query && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    query
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-blue-600 hover:underline"
                            >
                                Abrir en Google Maps
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Mientras carga el script: skeleton simple (no bloquea nada)
    if (!isLoaded) {
        return (
            <div className="h-[320px] w-full animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
        );
    }

    // Script OK ⇒ ahora sí montamos el mapa
    return (
        <GoogleMap mapContainerStyle={containerStyle} center={coords} zoom={16}>
            <Marker position={coords} />
        </GoogleMap>
    );
}
