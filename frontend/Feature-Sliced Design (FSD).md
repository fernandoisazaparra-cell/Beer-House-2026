# 1 Capa
src/
├── app/         # Bootstrap: entry point, router, providers globales
├── features/    # El negocio: auth, layout, users, sales, etc.
├── pages/       # Composición de páginas (arma la página juntando features)
├── shared/      # Solo lo que usan 2+ features (componentes/hooks genéricos)
├── config/      # Configuración estática (menús, constantes)
└── ui/          # Assets, iconos, estilos globales

# 2 Capa
src/
│
├── app/
│   ├── router/            # Definición de rutas (React Router)
│   └── providers/         # Junta todos los providers de features/
│
├── features/
│   ├── auth/               # Login, sesión, roles
│   ├── layout/             # AdminLayout, sidebar, header
│   ├── users/              # Ejemplo: módulo de usuarios
│   └── sales/              # Ejemplo: módulo de ventas
│
├── pages/
│   ├── auth/               # LoginPage, etc.
│   ├── users/              # UsersPage
│   └── sales/              # SalesPage
│
├── shared/
│   ├── components/         # Button, Modal, Table genéricos
│   ├── hooks/              # useDebounce, useClickOutside, etc.
│   └── utils/              # formatDate, helpers varios
│
├── config/
│   ├── menuConfig.ts
│   └── menuConfig.types.ts
│
└── ui/
    ├── assets/             # Logo, imágenes
    ├── icons/              # Re-export de react-icons
    └── styles/             # main.css, tokens.css, reset.css

# Capa App
app/
│
├── App.tsx                         # Componente raíz: junta providers + router
│
├── main.tsx                        # Entry point real (ReactDOM.createRoot)
│
├── router/
│   └── AppRouter.tsx                # Combina las rutas de cada feature (usersRoutes,
│                                    # salesRoutes, authRoutes, etc.) + rutas que no
│                                    # pertenecen a ningún feature (ej: 404, redirects)
│
├── providers/
│   └── AppProviders.tsx             # Envuelve la app con TODOS los providers globales
│                                    # (importa AuthProvider, LayoutProvider, QueryClientProvider,
│                                    # etc. desde sus respectivos features/ — NO los define acá)
│
├── config/
│   └── env.ts                       # Variables de entorno tipadas y validadas
│                                    # (falla rápido si falta una var requerida)
│
└── errors/
    └── ErrorBoundary.tsx            # Atrapa errores de render no controlados de TODA

# Capa features
features/{nombre}/
│
├── components/                      # UI específica del módulo (componentes de nivel raíz)
│   └── {Componente}/
│       ├── {Componente}.tsx
│       ├── {Componente}.module.css
│       ├── {Componente}.types.ts
│       ├── {Componente}.test.tsx
│       │
│       └── {SubComponente}/         # Subcomponente PRIVADO de {Componente}
│           ├── {SubComponente}.tsx
│           └── {SubComponente}.module.css
│           # Se queda acá mientras solo lo use {Componente}.
│           # Se promueve a shared/components/ SOLO si otro módulo lo necesita.
│
├── hooks/                           # TODOS los hooks del módulo, sin importar
│   │                                # qué componente los usa. Nombre específico
│   │                                # por lo que hacen, no genérico.
│   ├── use{NombreEspecifico}.ts
│   └── use{NombreEspecifico}.test.ts
│
├── context/                         # Estado global SOLO de este módulo
│   └── {Nombre}Context.tsx
│
├── store/                           # Alternativa a context (Zustand/Redux)
│   └── {nombre}Slice.ts
│
├── services/                        # Llamadas HTTP agrupadas en un archivo
│   └── {nombre}Service.ts           # (elegir services/ O api/, no ambas)
│
├── api/                             # Alternativa a services: 1 función = 1 archivo
│   ├── get{Nombre}.ts
│   ├── create{Nombre}.ts
│   ├── update{Nombre}.ts
│   ├── delete{Nombre}.ts
│   └── index.ts                     # Barrel: reexporta todo lo de api/
│                                    # así se importa como conjunto:
│                                    # import { getUsers, createUser } from '@/features/x/api'
│
├── adapters/                        # Transforman datos API → modelo interno
│   └── {nombre}.adapter.ts
│
├── schemas/                         # Validación (zod/yup) — formularios y respuestas API
│   └── {nombre}.schema.ts
│
├── mocks/                           # Datos falsos para dev/tests, sin backend real
│   └── {nombre}.mock.ts
│
├── constants/                       # Valores fijos del módulo
│   └── {nombre}.constants.ts
│
├── utils/                           # Funciones puras específicas del módulo
│   └── {funcion}.ts
│
├── README.md                        # Qué hace el módulo, decisiones no obvias, cómo probarlo
│
├── routes.tsx                       # define qué rutas expone el módulo
│
├── types.ts                         # Tipos TypeScript del módulo
│
└── index.ts                         # Barrel export — API pública del módulo completo

# Capa pages
pages/
│
├── DashboardPage.tsx                # Página sin sub-ruta anidada, va directo en la raíz
│
├── {nombre}/                        # Una carpeta por módulo que tiene rutas navegables
│   ├── {Nombre}Page.tsx             # Página principal del módulo (ej: listado)
│   ├── {Nombre}DetailPage.tsx       # Página de detalle, si aplica (ej: /users/:id)
│   └── {Nombre}CreatePage.tsx       # Página de creación, si aplica (ej: /users/new)
│
└── {otroNombre}/
    └── {OtroNombre}Page.tsx

# Capa shared
shared/
│
├── components/                      # UI genérica, sin lógica de negocio, usada por 2+ features
│   └── {Componente}/
│       ├── {Componente}.tsx
│       ├── {Componente}.module.css
│       ├── {Componente}.types.ts
│       └── {Componente}.test.tsx
│                                    # Mismas reglas que en features/: si tiene subcomponentes
│                                    # privados, van anidados igual (carpeta hermana directa)
│
├── hooks/                           # Hooks genéricos, sin conocimiento de ningún módulo
│   ├── use{NombreGenerico}.ts       # ej: useDebounce, useClickOutside, useMediaQuery
│   └── use{NombreGenerico}.test.ts
│
├── lib/                             # Wrappers/configuración de librerías externas
│   ├── apiClient.ts                 # Instancia única de axios/fetch configurada
│   └── queryClient.ts               # Config de React Query, si se usa
│
├── errors/                          # Manejo de errores reutilizable en toda la app
│   ├── ApiError.ts                  # Clase de error tipada para respuestas de API
│   └── ErrorBoundary.tsx            # (o vive en app/errors/ si es solo el de nivel raíz)
│
├── types/                           # Tipos genéricos, no ligados a un módulo específico
│   └── common.types.ts              # ej: Pagination<T>, ApiResponse<T>, SelectOption
│
├── constants/                       # Constantes globales, no de un módulo puntual
│   └── app.constants.ts             # ej: límites de paginación por defecto, formatos de fecha
│
└── utils/                           # Funciones puras genéricas
    ├── formatDate.ts
    ├── formatCurrency.ts
    └── debounce.ts

# Capa del css
ui/styles/
├── main.css              # Importa todo en orden
├── reset.css             # Normaliza el navegador
├── tokens.css            # Variables de diseño (colores, spacing, etc.)
├── base.css              # Estilos por defecto de elementos HTML
├── typography.css        # Jerarquía tipográfica
├── animations.css        # Keyframes reutilizables
├── z-index.css           # Escala de z-index centralizada
├── fonts.css             # @font-face si aplica
└── utilities.css         # Clases utility sueltas