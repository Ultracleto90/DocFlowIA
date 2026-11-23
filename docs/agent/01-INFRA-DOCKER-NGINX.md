# 01 — Infraestructura Docker, Nginx y Red

## 1. Topología de Contenedores
El motor MongoDB (`DocuFlowAI`) ya existe en el host Docker del desarrollador (ej. contenedor `mongo-utvt` en puerto `27017`). Por tanto, `docker-compose.yml` SOLO orquesta dos servicios:

1. **`web` (Next.js + Node 20 Alpine):**
   - Puerto interno: `3000` (NO exponer al host si se entra por Nginx, o exponer solo `127.0.0.1:3000:3000` para debug).
   - Volumen compartido para archivos subidos: `./storage/uploads:/storage/uploads` (coincide con las rutas `/storage/uploads/*.zip` de la BD).
   - Conexión a MongoDB existente mediante red externa `docuflow_network` O `extra_hosts: ["host.docker.internal:host-gateway"]`.
2. **`nginx` (Nginx Alpine):**
   - Puerto público: `80:80`
   - Función: Reverse proxy hacia `http://web:3000`.
   - Reenvío obligatorio de headers reales para `logs_auditoria`:
     - `X-Real-IP`
     - `X-Forwarded-For`
     - `X-Forwarded-Proto`
     - `Host`
   - Subidas de archivos `.zip`: `client_max_body_size 2048M;` (para soportar hasta Plan Enterprise) y `proxy_read_timeout 300s;`.

## 2. Estructura de Archivos de Infraestructura
- `docker/next/Dockerfile` (multi-stage: `deps`, `dev`, `builder`, `runner`; usar target `dev` en desarrollo con hot-reload o `runner` para producción).
- `docker/nginx/default.conf`
- `docker-compose.yml`
- `.env.example` (versionado en Git; `.env` siempre en `.gitignore`).

## 3. Variables de Entorno (`.env.example`)
Nota crítica: las contraseñas con `!` deben codificarse como `%21` dentro de las URIs estándar de MongoDB si el driver lo requiere.

```env
NODE_ENV=development
APP_URL=http://localhost

# Conexión operativa principal (Principio de Mínimo Privilegio: readWrite)
MONGO_URI=mongodb://worker_ia_service:WorkerSVM_Phi3_2026_RW%21@host.docker.internal:27017/DocuFlowAI?authSource=DocuFlowAI

# Conexión exclusiva de solo lectura para módulo QA / Auditoría (read)
MONGO_URI_READONLY=mongodb://auditor_qa_docuflow:QaDocuFlow2026_Read%21@host.docker.internal:27017/DocuFlowAI?authSource=DocuFlowAI

# Seguridad de sesión (cambiar en entorno real)
JWT_SECRET=docuflow_super_secret_jwt_key_2026_change_me
JWT_EXPIRES_IN=7d

# Ruta física dentro del contenedor para los .zip
UPLOADS_DIR=/storage/uploads

# Futuro microservicio Python (Fase 2 - opcional en esta iteración)
AI_PIPELINE_MODE=local_analyzer
AI_SERVICE_URL=http://ai-worker:8000
4. Criterio de Aceptación de Infraestructura

    GET http://localhost/api/health responde 200 OK pasando por Nginx -> Next.js -> MongoDB (worker_ia_service y auditor_qa_docuflow conectados con ping exitoso).
---
