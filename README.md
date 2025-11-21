# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Autenticación con Google (OAuth)

Se agregó una pantalla básica de login usando `@react-oauth/google`.

### Configuración
1. Copia el archivo `.env.example` a `.env.local`.
2. Coloca tu Client ID de OAuth en `VITE_GOOGLE_CLIENT_ID`.
3. Inicia la app: `npm run dev`.

### Seguridad
- El Client Secret NO debe incluirse en el frontend ni en variables expuestas. Mantén solo el Client ID.
- `.env.local` está ignorado por git (ver `.gitignore`).
- Si necesitas usar el Client Secret, hazlo en un backend seguro (intercambio de tokens, refresh, etc.).

### Flujo implementado
- Botón de Login con Google (`GoogleLogin`).
- Uso de OneTap cuando es posible (`useOneTap`).
- Al éxito se guarda el credential (ID token) en `localStorage` bajo la clave `google_credential`.
- Se decodifica el token para mostrar `name`, `email` y `picture`.
- Botón de logout que limpia almacenamiento y llama `googleLogout()`.

### Extender
- Protección de rutas y expiración ya implementadas (ver abajo).
- Refrescar token mediante backend (pendiente de implementación si se requiere flujo server-side).
- Reemplazar `localStorage` por `sessionStorage` si se desea caducidad al cerrar pestaña.

### Nota
El token almacenado es un ID token (JWT). No lo uses directamente para autorizar llamadas críticas sin validarlo en servidor.

## Protección de rutas y expiración

Se añadió un contexto de autenticación en `src/auth/AuthContext.tsx` que:
- Almacena el ID token y perfil decodificado.
- Calcula expiración usando el campo `exp` del JWT.
- Programa logout automático al vencer el token.

### Hook
`useAuth` expone: `credential`, `profile`, `isAuthenticated`, `isExpired`, `login(cred)`, `logout()`.

### Ruta protegida
`ProtectedRoute` redirige a `/` si la sesión no es válida o expiró.

### Rutas
- `/` -> `Login`.
- `/dashboard` -> `Dashboard` (protegida).

### Flujo de expiración
Cuando `exp` se cumple, se hace `logout()`, se limpia localStorage y cualquier acceso a rutas protegidas redirige al login.

### Extensión futura
- Implementar refresh tokens en backend para sesiones largas.
- Añadir manejo de roles/claims si se necesitan autorizaciones adicionales.

## Estilos Creepy Retro

Se integró Tailwind CSS para estilizar la pantalla de login con una estética retro oscura.

### Instalación rápida
```
npm install -D tailwindcss postcss autoprefixer clsx tailwind-merge
```

Archivos agregados:
- `tailwind.config.js` (paleta `creepy` y animaciones flicker + scanlines).
- `postcss.config.js`.
- `src/index.css` reemplazado con directivas Tailwind y variables de tema.
- Utilidad `src/lib/utils.ts` para función `cn`.
- Componentes UI adaptados: `Login.tsx`, `Dashboard.tsx`, `GhostLoader.tsx`.

### Customización
- Cambia colores en `tailwind.config.js` bajo `colors.creepy`.
- Ajusta efectos de scanlines en `.scanlines` dentro de `index.css`.
- Fuente pixel: Google Font "Press Start 2P".

### Buenas prácticas
- Mantener lógica de auth separada del estilado (contexto vs clases Tailwind).
- Evitar exponer secretos en estilos o HTML.

