# 04 — Sistema de Diseño UI/UX y Plan de Sprints

## 1. Paleta Tailwind Obligatoria (`tailwind.config.ts`)
```ts
colors: {
  docuflow: {
    bg: '#DCEAF7',      // Fondo general de aplicación
    surface: '#FFFFFF', // Tarjetas, paneles y editor
    input: '#E8EEF5',   // Campos de texto, selects y buscadores
    primary: '#23478D', // Sidebar activa, headers y botones primarios
    action: '#1E60B8',  // Hover de botones y enlaces de acción
    navy: '#0D253F',    // Títulos y texto principal
    slate: '#5A6B7C',   // Texto secundario y metadatos
    cyan: '#00C2E0',    // Progreso activo, SVM Relevante, estados en proceso
    violet: '#9D4EDD',  // Plan Pro/Team/Enterprise, badges IA y tokens
    orange: '#EB8934',  // borrador_ia pendiente, alertas de cuota y ads Freemium
  },
}

2. Principios de Diseño Funcional y Progresivo

    Regla de los 3 clics: Desde /dashboard el usuario sube un .zip, abre el proyecto y audita/exporta sin menús enterrados.

    Comportamiento dinámico por Plan:

        Freemium: Muestra un banner técnico discreto en la parte superior del panel (estilo anuncio para desarrolladores) y al hacer clic en Procesar .zip o Exportar .md dispara un Modal Intersticial con cuenta regresiva real de 15 segundos y CTA "Elimina los anuncios con Pro ($399 MXN/mes)". Los tabs de Manual Técnico, Manual de Usuario y botón PDF se muestran con candado y tooltip de upgrade.

        Pro / Team IA / Enterprise: Cero banners y cero esperas de 15s.

        Enterprise White-Label: Si el usuario activa White-Label en /billing, el nombre de marca en el Sidebar/Navbar se actualiza en vivo.

    Accesibilidad y feedback: Todos los formularios muestran estados de carga, errores claros por campo y notificaciones toast no intrusivas.

3. Mapa de Vistas

    / (Landing Page): Hero limpio, explicación del flujo (Subir .zip Laravel -> Filtro SVM -> Redacción IA -> Validación Humana), tabla comparativa interactiva de los 4 planes y botones Login/Registro.

    /login y /register: Formularios centrados sobre docuflow-bg con tarjeta docuflow-surface.

    /dashboard:

        Banner publicitario (solo Freemium).

        Barra de cuota mensual (usados / max_proyectos_mes), nivel de inteligencia activa (L1/L2/L3/L4) y almacenamiento del plan.

        Grid/tabla de proyectos con badges de estado (pendiente, filtrando_svm, redactando_ia, completado).

        Modal "Nuevo Proyecto Laravel (.zip)" con drag & drop, selector de versión Laravel y progreso en tiempo real.

    /projects/[codigo] (Workspace Human-in-the-loop):

        Header con código (PRJ-001), framework, estado y selector de pestañas:

            Documentación (Split-View): Selector de los 3 documentos normativos, editor Markdown izquierdo, vista previa renderizada derecha, contador de tokens y modelo IA, botón "Guardar cambios", toggle "Validar documento (validado_humano)" y botones Exportar .md / .pdf.

            Filtro SVM (componentes_filtrados): Tabla con filtro Todos / Código Relevante / Ruido Visual, archivo .blade.php, ruta web y badges de elementos_detectados.

            Integración y Auditoría (Team IA / Enterprise): Configuración de Webhook GitHub/GitLab y reporte de código muerto / WCAG 2.1 / OWASP.

    /billing (Planes, Equipo y Marca Blanca): Tarjetas de los 4 planes con cambio instantáneo, gestión de miembros del equipo (según límite del plan) y panel White-Label + API Key (Enterprise).

    /admin/audit (Bitácora de Seguridad): Tabla cronológica de logs_auditoria leída con auditor_qa_docuflow (read), filtro por resultado (EXITOSO / BLOQUEADO_UNAUTHORIZED) y consulta de borradores con token_count > 1200.

4. Plan de Ejecución por Sprints (Con Checkpoints Git)
Sprint 0 — Cimientos Docker, Nginx y Transporte Base

    Inicializar Next.js 15 (App Router, TS, Tailwind) con paleta docuflow.

    Crear docker/next/Dockerfile, docker/nginx/default.conf, docker-compose.yml y .env.example.

    Crear src/lib/db/mongodb.ts (doble conexión getWriteConnection y getReadOnlyConnection).

    Crear src/lib/http/basicGet.ts y src/lib/http/httpClient.ts 100% agnósticos.

    Crear GET /api/health.

    Verificación: http://localhost/api/health responde 200 OK vía Nginx con ambos usuarios MongoDB conectados. git commit -m "feat(infra): setup docker, nginx, mongodb connections and base http layer".

Sprint 1 — Modelos, Seed Seguro, Auth y RBAC

    Crear src/core/constants/plans.ts, src/core/types/ y src/core/schemas/.

    Crear modelos Mongoose en src/infrastructure/models/ respetando las 5 colecciones exactas.

    Crear repositorios en src/infrastructure/repositories/ y scripts/sync-seed.ts.

    Implementar Auth (/api/auth/*), servicio JWT/bcrypt, middleware de rutas protegidas y src/services/client/petitions.ts (bloque Auth).

    Crear vistas /login y /register.

    Verificación: Registro, login con emiliano@docuflow.ia, cookie HttpOnly activa y evento guardado en logs_auditoria. git commit -m "feat(auth): models, repositories, RBAC auth and login/register views".

Sprint 2 — Proyectos, Cuotas, Lector Real .zip y Dashboard

    Implementar planGuardService.ts y aiPipelineAdapter.ts con adm-zip (protección Zip Slip, conteo de .blade.php, extracción real de componentes SVM y generación de borradores Markdown).

    Implementar /api/projects y /api/projects/[codigo].

    Crear layout autenticado (Sidebar + Navbar con soporte White-Label) y /dashboard con modal de carga .zip, barra de cuotas y banner/intersticial 15s para Freemium.

    Verificación: Subir un .zip con vistas .blade.php, ver inserción real en proyectos, componentes_filtrados y documentos_generados. git commit -m "feat(projects): zip analyzer, plan quotas, dashboard and freemium interstitial".

Sprint 3 — Workspace Human-in-the-loop y Exportación .md / .pdf

    Implementar /api/documents/[id] y /api/documents/[id]/export (.md con marca de agua en Freemium y .pdf limpio/White-Label desde Pro).

    Construir /projects/[codigo] con Split-View Markdown, cambio borrador_ia -> validado_humano y pestaña de tabla SVM.

    Verificación: Editar documento, marcar como validado y descargar .md y .pdf reales. git commit -m "feat(workspace): markdown split editor, human validation, SVM view and md/pdf export".

Sprint 4 — Planes /billing, Equipo, Auditoría /admin/audit y Landing /

    Implementar /api/billing/*, /api/team/* y /api/admin/audit (vía conexión solo lectura auditor_qa_docuflow).

    Construir /billing (upgrade en vivo + equipo + White-Label/API Key), /admin/audit y Landing Page /.

    Verificación: Cambiar de Freemium -> Pro -> Enterprise, verificar desaparición de anuncios, desbloqueo de PDF/manuales y lectura de logs_auditoria. git commit -m "feat(saas): billing tiers, team rbac, audit panel and landing page".
