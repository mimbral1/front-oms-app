"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@mui/material";
import { useLoadScript } from "@react-google-maps/api";

interface Props {
    value: string;                    // valor externo (opcionalmente lo reflejamos)
    onChange: (value: string) => void; // notificamos al padre (con debounce)
    placeholder?: string;
    country?: string;                 // por defecto "cl"
    debounceMs?: number;              // por defecto 350ms
}

const LIBRARIES: ("places" | "drawing")[] = ["places", "drawing"];
const LOADER_ID = "google-map-script";

export default function GooglePlacesAutocomplete({
    value,
    onChange,
    placeholder = "Ingresa la dirección",
    country = "cl",
    debounceMs = 350,
}: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Estado local para que escribir NUNCA se bloquee
    const [draft, setDraft] = useState(value || "");
    // Sincronizamos si el padre cambia desde afuera
    useEffect(() => setDraft(value || ""), [value]);

    // Cargador del script — si falla, dejamos el input 100% libre
    const { isLoaded, loadError } = useLoadScript({
        id: LOADER_ID,
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: LIBRARIES,
    });

    // Debounce de lo que escribe el usuario → notificamos al padre
    useEffect(() => {
        const t = setTimeout(() => onChange(draft), debounceMs);
        return () => clearTimeout(t);
    }, [draft, debounceMs, onChange]);

    // Enganchamos Autocomplete SOLO si el script cargó bien
    useEffect(() => {
        if (!isLoaded || loadError || !inputRef.current) return;

        let ac: google.maps.places.Autocomplete | undefined;
        let listener: google.maps.MapsEventListener | undefined;

        try {
            ac = new google.maps.places.Autocomplete(inputRef.current, {
                types: ["geocode"],
                componentRestrictions: { country },
            });
            listener = ac.addListener("place_changed", () => {
                const place = ac!.getPlace();
                if (place?.formatted_address) {
                    // reflejamos al instante y notificamos sin debounce
                    setDraft(place.formatted_address);
                    onChange(place.formatted_address);
                }
            });
        } catch {
            // Si algo falla, seguimos con el input libre
        }

        return () => {
            listener?.remove();
            // @ts-ignore
            ac?.unbindAll?.();
        };
    }, [isLoaded, loadError, country, onChange]);

    return (
        <div className="relative">
            <Input
                fullWidth
                inputRef={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}     // ↍ SIEMPRE editable
                placeholder={placeholder}
                autoComplete="off"
                spellCheck={false}
                className="gplaces-input"
                sx={{
                    "& input": {
                        background: "#fff !important",
                        backgroundImage: "none !important",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(0,0,0,0.08)",
                        fontSize: "14px",
                    },
                    "&:before, &:after": { display: "none" },
                }}
            />
        </div>
    );
}
