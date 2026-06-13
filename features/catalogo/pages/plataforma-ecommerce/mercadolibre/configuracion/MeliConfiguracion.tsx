// features/catalogo/pages/plataforma-ecommerce/mercadolibre/configuracion/MeliConfiguracion.tsx
//
// Vista de configuración del marketplace ML. UI completa con campos de
// credenciales, tokens y opciones de sincronización; la persistencia contra
// el endpoint del backend está pendiente. Mientras tanto, el formulario
// expone un estado local visible para el usuario mediante un banner de
// "vista preliminar" en la parte superior de la pantalla.
"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card";
import { CheckCircle, AlertTriangle } from "lucide-react";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";

interface MeliConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    accessToken: string;
    refreshToken: string;
    autoSync: boolean;
    syncIntervalMinutes: number;
    publishNewProducts: boolean;
    updatePrices: boolean;
    updateStock: boolean;
    officialStoreId: string;
}

const DEFAULT_CONFIG: MeliConfig = {
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    accessToken: "",
    refreshToken: "",
    autoSync: false,
    syncIntervalMinutes: 30,
    publishNewProducts: false,
    updatePrices: true,
    updateStock: true,
    officialStoreId: "",
};

export function MeliConfiguracion() {
    const [config, setConfig] = useState<MeliConfig>(DEFAULT_CONFIG);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = (field: keyof MeliConfig, value: string | boolean | number) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        // Stub: hasta conectar el endpoint de persistencia, validamos los
        // campos en memoria y mostramos la confirmación de "vista preliminar".
        setSaving(true);
        await new Promise((r) => setTimeout(r, 800));
        setSaving(false);
        setSaved(true);
    };

    const platform = useEcommercePlatform();

    const headerActions = [
        {
            label: saving ? "Guardando…" : "Guardar configuración",
            variant: "success" as const,
            onClick: handleSave,
            icon: saved ? (
                <CheckCircle className="h-5 w-5" />
            ) : undefined,
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-page-bg">
            <PageHeader
                sticky
                stickyTop={0}
                title={`Configuración ${platform.name}`}
                action={headerActions}
            />

            <div className="flex-1 p-6 space-y-6 max-w-4xl">
                {/* Banner: la vista funciona como preview hasta que se conecte el endpoint */}
                <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-900 p-3 rounded-md text-sm">
                    <p className="font-medium">Vista preliminar</p>
                    <p className="mt-1">
                        La interfaz está completa, pero la persistencia contra el backend aún no está conectada.
                        Los cambios que ingreses se mantienen solo en memoria durante esta sesión.
                    </p>
                </div>

                {/* Credenciales API */}
                <Card title={`Credenciales API de ${platform.name}`}>
                    <div className="p-4 space-y-4">
                        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-3 rounded-md text-sm">
                            <p>
                                Para integrar {platform.name}, necesita las credenciales de su
                                aplicación registrada en el portal de desarrolladores.
                            </p>
                        </div>

                        <TextField
                            label="Client ID (App ID)"
                            fullWidth
                            size="small"
                            value={config.clientId}
                            onChange={(e) => handleChange("clientId", e.target.value)}
                        />
                        <TextField
                            label="Client Secret"
                            fullWidth
                            size="small"
                            type="password"
                            value={config.clientSecret}
                            onChange={(e) => handleChange("clientSecret", e.target.value)}
                        />
                        <TextField
                            label="Redirect URI"
                            fullWidth
                            size="small"
                            value={config.redirectUri}
                            onChange={(e) => handleChange("redirectUri", e.target.value)}
                            placeholder="https://..."
                        />
                        <TextField
                            label="Official Store ID (opcional)"
                            fullWidth
                            size="small"
                            value={config.officialStoreId}
                            onChange={(e) => handleChange("officialStoreId", e.target.value)}
                        />
                    </div>
                </Card>

                {/* Tokens */}
                <Card title="Tokens de autenticación">
                    <div className="p-4 space-y-4">
                        <TextField
                            label="Access Token"
                            fullWidth
                            size="small"
                            type="password"
                            value={config.accessToken}
                            onChange={(e) => handleChange("accessToken", e.target.value)}
                        />
                        <TextField
                            label="Refresh Token"
                            fullWidth
                            size="small"
                            type="password"
                            value={config.refreshToken}
                            onChange={(e) => handleChange("refreshToken", e.target.value)}
                        />

                        <div className="flex items-center gap-2 text-sm">
                            {config.accessToken ? (
                                <span className="inline-flex items-center gap-1 text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    Token configurado
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-yellow-700">
                                    <AlertTriangle className="h-4 w-4" />
                                    Sin token — la sincronización no funcionará
                                </span>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Sincronización */}
                <Card title="Opciones de sincronización">
                    <div className="p-4 space-y-3">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.autoSync}
                                    onChange={(e) => handleChange("autoSync", e.target.checked)}
                                />
                            }
                            label="Sincronización automática"
                        />

                        {config.autoSync && (
                            <TextField
                                label="Intervalo de sincronización (minutos)"
                                fullWidth
                                size="small"
                                type="number"
                                value={config.syncIntervalMinutes}
                                onChange={(e) =>
                                    handleChange(
                                        "syncIntervalMinutes",
                                        Math.max(5, parseInt(e.target.value) || 30)
                                    )
                                }
                                inputProps={{ min: 5 }}
                            />
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.publishNewProducts}
                                    onChange={(e) =>
                                        handleChange("publishNewProducts", e.target.checked)
                                    }
                                />
                            }
                            label={`Publicar productos nuevos automáticamente en ${platform.name}`}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.updatePrices}
                                    onChange={(e) =>
                                        handleChange("updatePrices", e.target.checked)
                                    }
                                />
                            }
                            label="Sincronizar precios"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.updateStock}
                                    onChange={(e) =>
                                        handleChange("updateStock", e.target.checked)
                                    }
                                />
                            }
                            label="Sincronizar stock"
                        />
                    </div>
                </Card>

                {/* Confirmación honesta: el cambio quedó en memoria, no persistido */}
                {saved && (
                    <div className="bg-green-50 border-l-4 border-green-400 text-green-800 p-3 rounded-md text-sm">
                        <span className="inline-flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Cambios aplicados en la vista preliminar. Se persistirán cuando se conecte el endpoint del backend.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
