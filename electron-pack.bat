@echo off
REM ------------------------------------------------------------
REM  electron-pack.bat  –  Empaqueta Mimbral 360 para Windows
REM ------------------------------------------------------------
chcp 65001 > nul

REM 1. Cierra instancias de tu app y herramientas que puedan
REM    tener abierto el app.asar
echo 🔪  Cerrando instancias previas...
for %%P in (electron.exe nombre-app-escritorio.exe 7zFM.exe) do (
    taskkill /f /im %%P > nul 2>&1
)

REM 2. Limpia la carpeta dist para evitar locks residuales
echo 🧹  Limpiando carpeta dist...
if exist dist (
    rmdir /s /q dist
) else (
    echo     (no había carpeta dist)
)

REM 3. Compila Next.js
echo 🛠️  Ejecutando build de Next.js...
call npm run build
if errorlevel 1 (
    echo ❌  next build falló. Abortando empaquetado.
    exit /b 1
)

REM 4. Empaqueta con electron‑builder
echo 📦  Empaquetando con electron‑builder...
npx electron-builder --win --x64
if errorlevel 1 (
    echo ❌  electron-builder falló.
    exit /b 1
)

echo ✅  Empaquetado terminado. Revisa dist\win-unpacked\ o el instalador en dist\.
