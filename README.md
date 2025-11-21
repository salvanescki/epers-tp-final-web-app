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
- Validar expiración del token y refrescar mediante backend.
- Añadir protección de rutas (wrapper que verifique presencia del token antes de renderizar páginas privadas).
- Reemplazar `localStorage` por `sessionStorage` si se desea caducidad al cerrar pestaña.

### Nota
El token almacenado es un ID token (JWT). No lo uses directamente para autorizar llamadas críticas sin validarlo en servidor.
