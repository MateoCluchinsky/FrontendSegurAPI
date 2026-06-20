# Frontend SegurAPI

Este proyecto es el cliente web para la gestión de pólizas y clientes de SegurAPI, construido con **React**, **Vite** y con soporte para notificaciones en tiempo real vía **WebSockets (STOMP)**.

## 🛠️ Requisitos Previos

Asegúrate de tener instalado:
* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
* Un gestor de paquetes como `npm` (incluido con Node)

---

## 🚀 Guía de Inicio Rápido

Sigue estos pasos para levantar el proyecto localmente:

### 1. Clonar el repositorio e instalar dependencias
Entra al directorio del proyecto y ejecuta:
```bash
npm install
```

### 2. Configurar variables de entorno
1. Copia el archivo de ejemplo para crear tu archivo `.env` local:
   ```bash
   cp .env.example .env
   ```
2. Abre el archivo `.env` y ajusta las URLs si tu backend corre en un puerto o dominio distinto:
   * `VITE_API_URL`: URL base del API Backend.
   * `VITE_FILES_URL`: Endpoint para la descarga de archivos.
   * `VITE_WS_URL`: Endpoint de WebSocket (STOMP) para las notificaciones en tiempo real.

### 3. Iniciar el servidor de desarrollo
Para correr la aplicación en modo desarrollo con soporte para recarga rápida (HMR):
```bash
npm run dev
```
Por defecto, la aplicación estará disponible en [http://localhost:5173](http://localhost:5173).

---

## 📦 Construcción para Producción

Si deseas compilar la aplicación para producción:
```bash
npm run build
```
Esto generará los archivos optimizados dentro de la carpeta `dist`.
