# Prescriptions Web

Frontend de la aplicación de prescripciones médicas. Construido con Next.js (Pages Router), React, TypeScript y Tailwind CSS. Consume el backend [prescriptions-api](https://github.com/GabrielGarciaRodri/prescriptions-api).

- **Repositorio backend:** [prescriptions-api](https://github.com/GabrielGarciaRodri/prescriptions-api)
- **Frontend en producción:** https://prescriptions-web.vercel.app
- **API en producción:** https://prescriptions-api-production-2da6.up.railway.app

## Tabla de contenido

1. [Stack tecnológico](#stack-tecnológico)
2. [Cuentas de prueba](#cuentas-de-prueba)
3. [Funcionalidad por rol](#funcionalidad-por-rol)
4. [Setup local](#setup-local)
5. [Variables de entorno](#variables-de-entorno)
6. [Scripts disponibles](#scripts-disponibles)
7. [Arquitectura](#arquitectura)
8. [Despliegue](#despliegue)
9. [Decisiones técnicas](#decisiones-técnicas)

## Stack tecnológico

- **Framework:** Next.js 16 con **Pages Router**
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4
- **Estado global:** Zustand con persist (localStorage)
- **HTTP:** Axios con interceptor de refresh automático
- **Formularios:** react-hook-form + zod
- **Gráficos:** Recharts
- **Toasts:** Sonner
- **Iconos:** Lucide React
- **Fechas:** date-fns con locale `es`

## Cuentas de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@test.com | admin123 |
| Médico | dr@test.com | dr123 |
| Paciente | patient@test.com | patient123 |

Las credenciales están visibles en la pantalla de login para facilitar la evaluación.

## Funcionalidad por rol

### Médico (`/doctor/prescriptions`)

- Listado paginado de sus propias prescripciones con filtros (estado, rango de fechas) sincronizados con querystring.
- Creación de nuevas prescripciones (`/doctor/prescriptions/new`) con:
  - Búsqueda de paciente por email con autocompletado (debounce 300ms, mínimo 2 caracteres).
  - Notas generales opcionales.
  - Ítems dinámicos (agregar/remover) con `useFieldArray`, validación por ítem.
- Detalle de cada prescripción (`/doctor/prescriptions/[id]`).

### Paciente (`/patient/prescriptions`)

- Listado de sus prescripciones con filtro por estado.
- Acción "Consumir" con confirmación (solo en pending).
- Descarga de PDF como blob desde el navegador.
- Detalle individual con acciones (`/patient/prescriptions/[id]`).

### Admin (`/admin`)

- Tarjetas con totales (médicos, pacientes, prescripciones).
- Gráfico de torta de distribución por estado (Recharts).
- Gráfico de barras de prescripciones por día.
- Listado "Top médicos por volumen".
- Filtro de rango de fechas que aplica a los gráficos pero no a los totales absolutos de usuarios.

### Transversal

- Login con persistencia de sesión (sobrevive a refresh).
- Logout que revoca el refresh token en el backend.
- Refresh automático de access token al expirar (transparente para el usuario).
- Guards de rutas: redirección a `/login` si no hay sesión, redirección a la home del rol si el rol no está permitido.
- Diseño responsive (mobile, tablet, desktop).
- Estados de carga, error y vacío en todas las pantallas con datos.

## Setup local

### Requisitos

- Node.js 20+
- El backend corriendo en `http://localhost:3000` (ver [prescriptions-api](https://github.com/GabrielGarciaRodri/prescriptions-api) para setup).

### Instalación

```bash
# 1. Clonar
git clone https://github.com/GabrielGarciaRodri/prescriptions-web.git
cd prescriptions-web

# 2. Instalar
npm install

# 3. Configurar variables
cp .env.local.example .env.local
# Verifica que la URL apunte a tu backend local

# 4. Levantar
npm run dev
```

El frontend queda en `http://localhost:3001`.

## Variables de entorno

Archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

El prefijo `NEXT_PUBLIC_` es necesario para que la variable esté disponible en el navegador. Sin él, el cliente HTTP no puede acceder a la URL.

En Vercel, la misma variable se configura desde el dashboard con el dominio de la API en Railway.

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3001. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build de producción localmente. |
| `npm run lint` | Linter. |

## Arquitectura

### Estructura de carpetas

```
src/
├── pages/
│   ├── _app.tsx                          # Toaster global
│   ├── index.tsx                         # Redirect según sesión
│   ├── login.tsx
│   ├── admin/index.tsx                   # Dashboard
│   ├── doctor/prescriptions/
│   │   ├── index.tsx                     # Listado
│   │   ├── new.tsx                       # Formulario crear
│   │   └── [id].tsx                      # Detalle
│   └── patient/prescriptions/
│       ├── index.tsx                     # Listado
│       └── [id].tsx                      # Detalle
├── components/
│   ├── RouteGuard.tsx                    # Protección por rol
│   ├── PrescriptionCard.tsx              # Card reusable
│   ├── PrescriptionFilters.tsx           # Filtros con querystring
│   ├── Pagination.tsx
│   ├── layout/AppLayout.tsx              # Header + logout
│   └── ui/                               # Primitives: Button, Input, Badge, Spinner, EmptyState
├── lib/
│   ├── api.ts                            # Axios + interceptor de refresh
│   ├── auth-store.ts                     # Zustand persisted
│   ├── use-query.ts                      # Hook simple para GET
│   ├── format.ts                         # Helpers de fechas
│   └── types.ts                          # Tipos compartidos
└── styles/
    └── globals.css                       # Tailwind v4
```

### Flujo de autenticación

1. **Login** → `setAuth` en Zustand → persist a localStorage → redirect según rol.
2. Cada request lleva el `accessToken` vía interceptor de request de axios.
3. Si el backend responde 401, el interceptor de respuesta:
   - Marca el request como ya intentado (`_retry = true`).
   - Llama a `/auth/refresh` con el refresh token.
   - Si hay otro refresh en curso, encola el request hasta que termine (evita múltiples refreshes paralelos que la detección de reuso del backend rechazaría).
   - Actualiza los tokens en el store y reintenta el request original.
   - Si el refresh falla, limpia la sesión y redirige a `/login`.

### Protección de rutas

`RouteGuard` envuelve cada página protegida. Su lógica:

1. Si el store no está hidratado, muestra un spinner (evita flicker en SSR).
2. Si no hay sesión, redirige a `/login` (siempre que no esté ya ahí, anti-loop).
3. Si la página tiene `allowedRoles` y el rol del usuario no está, redirige a la home del rol.

### Sincronización con querystring

`PrescriptionFilters` y `Pagination` escriben los filtros y la página actual en el querystring de la URL vía `router.replace`. Esto permite:

- Refrescar la página sin perder filtros.
- Compartir URLs que incluyen el estado del listado.
- Navegación back/forward del navegador respeta el estado.

## Despliegue

### Producción actual

| Componente | Plataforma | URL |
|---|---|---|
| Frontend | Vercel | https://prescriptions-web.vercel.app |
| Backend | Railway | https://prescriptions-api-production-2da6.up.railway.app |

### Configuración en Vercel

- Framework Preset: **Next.js** (detección automática).
- Build Command: `next build` (por defecto).
- Output Directory: `.next` (por defecto).
- Install Command: `npm install` (por defecto).
- Variable de entorno única: `NEXT_PUBLIC_API_BASE_URL` apuntando al dominio del backend en Railway.
- Cada push a `main` dispara un deploy automático.

### Pasos para replicar

1. Importar el repo en Vercel desde GitHub.
2. Configurar `NEXT_PUBLIC_API_BASE_URL` con el dominio del backend.
3. Deploy (Vercel detecta Next.js automáticamente).
4. Una vez con dominio, añadir ese dominio a `APP_ORIGIN` del backend (sin barra final).

## Decisiones técnicas

### Por qué Pages Router y no App Router

Pages Router es más cercano a React puro, con un mental model conocido (cada archivo en `pages/` es una ruta, `getServerSideProps` para SSR opcional). En esta app **todas las pantallas son client-side autenticadas** con tokens en localStorage, por lo que los beneficios de App Router (server components, server actions) no aplican al caso de uso. Pages Router también tiene mejor compatibilidad con Zustand persisted sin tener que regar `'use client'` por todos lados.

### Por qué Zustand persisted y no Context API o Redux

Zustand con `persist` da exactamente lo que se necesita en este caso (estado global de auth + sincronización con localStorage) sin la verbosidad de Redux ni el problema de re-renders de Context. El store completo cabe en ~40 líneas y los selectores evitan re-renders innecesarios.

El flag `hydrated` se expone explícitamente para que `RouteGuard` pueda esperar a que se lea el localStorage antes de decidir redirigir. Sin esto habría flicker visual en el primer render.

### Por qué interceptor con cola de requests

El refresh con rotación del backend revoca el token usado y rechaza intentos de reuso. Si el navegador tiene 3 widgets pidiendo data al mismo tiempo y los 3 reciben 401, sin cola los 3 dispararían refresh simultáneamente: el primer refresh rotaría el token y los otros 2 (con el refresh viejo) serían marcados como reuso, revocando toda la familia y expulsando al usuario. La cola garantiza que solo el primer 401 dispara refresh y los demás esperan.

### Por qué un `useQuery` propio y no SWR o React Query

Para una app con ~6 pantallas que consumen GET, un hook propio de ~30 líneas con loading/error/refetch cubre todas las necesidades. SWR/React Query son herramientas excelentes pero traerían dependencias adicionales y patrones que no se aprovechan completamente en este alcance.

### Por qué los filtros en querystring

El enunciado pedía explícitamente "Filtros con persistencia en querystring". Más allá del requerimiento, hace la UX mucho mejor: un usuario puede compartir un link de "todas las pendientes del último mes" o usar el botón "atrás" del navegador para volver a un filtro anterior.

### Por qué react-hook-form + zod en el formulario de crear

El formulario de crear prescripción tiene ítems dinámicos (agregar/remover medicamentos), cada uno con validaciones propias. `useFieldArray` de react-hook-form es exactamente el caso de uso para esto, y zod permite validar el shape completo incluido el array anidado con un schema declarativo que también se usa en el resolver de TypeScript.