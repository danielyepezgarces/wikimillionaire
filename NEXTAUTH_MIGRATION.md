# Migración a NextAuth con Wikimedia Provider

Este documento describe la migración del sistema de autenticación personalizado a NextAuth.js con el proveedor de Wikimedia.

## Cambios Principales

### 1. Sistema de Autenticación

**Antes:**
- Sistema OAuth personalizado con gestión manual de tokens
- API routes personalizadas en `/api/auth/*`
- Gestión de sesión mediante localStorage y cookies personalizadas

**Después:**
- NextAuth.js v4 con proveedor personalizado de Wikimedia
- API route centralizada en `/api/auth/[...nextauth]`
- Gestión automática de sesión mediante JWT con next-auth

### 2. Archivos Nuevos

#### `/auth.ts`
Configuración principal de NextAuth con:
- Proveedor personalizado de Wikimedia OAuth
- Callbacks para sincronizar usuarios con la base de datos
- Configuración de JWT y sesión

#### `/auth.config.ts`
Configuración de NextAuth con:
- Páginas personalizadas
- Callbacks de sesión y JWT
- Estrategia de sesión (JWT)

#### `/types/next-auth.d.ts`
Extensión de tipos de NextAuth para incluir:
- `wikimedia_id` en el objeto de usuario
- Propiedades personalizadas en la sesión

#### `/app/api/auth/[...nextauth]/route.ts`
API route que maneja todas las peticiones de autenticación de NextAuth.

### 3. Archivos Modificados

#### `/contexts/auth-context.tsx`
- Simplificado para usar `useSession` de NextAuth
- Eliminada lógica compleja de gestión de OAuth
- Mantiene la interfaz para compatibilidad con el resto de la app

#### `/components/wikimedia-login-button.tsx`
- Actualizado para usar `login()` y `logout()` del contexto simplificado
- Eliminada lógica de generación de URL de OAuth

#### `/app/layout.tsx`
- Añadido `SessionProvider` de NextAuth
- Eliminados componentes obsoletos (`SessionHandler`, `AuthDebug`)

#### `/app/leaderboard/page.tsx`
- Botón de navegación cambiado de `button` con `onClick` a `Link` de Next.js
- Eliminada dependencia de estado `isClient` en `handleNavigation`
- Mejorada la carga inicial sin bloqueo del renderizado

#### `/app/auth/callback/page.tsx`
- Simplificado completamente
- NextAuth maneja el callback automáticamente en `/api/auth/callback/wikimedia`
- La página solo redirige a home

#### `/middleware.ts`
- Simplificado: todas las rutas son públicas
- La autenticación se maneja en el nivel de componente

#### `/.env.example`
- Añadidas variables de entorno para NextAuth:
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
- Actualizada `WIKIMEDIA_REDIRECT_URI` a `/api/auth/callback/wikimedia`

### 4. Archivos Obsoletos (No eliminados por compatibilidad)

Los siguientes archivos ya no se usan con NextAuth pero se mantienen:
- `/api/auth/login/route.ts`
- `/api/auth/callback/route.ts`
- `/api/auth/token/route.ts`
- `/api/auth/user/route.ts`
- `/api/auth/logout/route.ts`
- `/lib/auth.ts` (contiene funciones de JWT personalizadas)
- `/lib/cookie-auth.ts`

## Configuración Requerida

### Variables de Entorno

```bash
# Wikimedia OAuth Configuration
WIKIMEDIA_CLIENT_ID=your_client_id
WIKIMEDIA_CLIENT_SECRET=your_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Configuración de Wikimedia OAuth

Actualizar la aplicación OAuth en Wikimedia:
1. Ir a https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration
2. Editar la aplicación existente
3. Actualizar "OAuth callback URL" a: `http://localhost:3000/api/auth/callback/wikimedia`
   - Para producción: `https://tu-dominio.com/api/auth/callback/wikimedia`

## Flujo de Autenticación

### Antes (OAuth Personalizado)

1. Usuario hace clic en "Login"
2. App genera state y codeVerifier
3. App guarda state en localStorage
4. App redirige a Wikimedia OAuth
5. Wikimedia redirige a `/auth/callback?code=...&state=...`
6. App valida state
7. App intercambia code por token
8. App obtiene info de usuario
9. App guarda usuario en localStorage
10. App redirige a home

### Después (NextAuth)

1. Usuario hace clic en "Login"
2. NextAuth redirige a Wikimedia OAuth
3. Wikimedia redirige a `/api/auth/callback/wikimedia`
4. NextAuth valida y procesa automáticamente
5. Callback de `signIn` sincroniza usuario con DB
6. Usuario autenticado disponible en sesión
7. NextAuth redirige a home

## Ventajas de la Migración

1. **Menos código personalizado**: NextAuth maneja la mayoría de la lógica OAuth
2. **Más seguro**: Gestión automática de tokens y sesiones
3. **Mejor mantenimiento**: Dependencia bien mantenida por la comunidad
4. **Más características**: Soporte para múltiples proveedores, renovación de tokens, etc.
5. **Mejor DX**: Hooks y utilidades de Next-auth simplifican el código

## Testing

### Verificar Autenticación

1. Iniciar el servidor: `npm run dev`
2. Hacer clic en el botón de login (icono de login)
3. Autenticarse con Wikimedia
4. Verificar que la sesión se mantiene después de recargar
5. Hacer clic en el avatar para ver el menú
6. Cerrar sesión y verificar que funciona

### Verificar Navegación en Leaderboard

1. Ir a `/play`
2. Completar un juego
3. Hacer clic en "Ver tabla de clasificación"
4. Verificar que navega correctamente a `/leaderboard`
5. Hacer clic en el botón de "atrás" (flecha)
6. Verificar que navega correctamente a `/`

## Rollback (Si es necesario)

Si hay problemas con NextAuth, se puede revertir temporalmente:

1. Revertir cambios en `contexts/auth-context.tsx`
2. Revertir cambios en `app/layout.tsx`
3. Revertir cambios en `components/wikimedia-login-button.tsx`
4. Comentar o eliminar `auth.ts` y `auth.config.ts`
5. Reiniciar el servidor

Los archivos antiguos se mantuvieron para facilitar el rollback si es necesario.

## Siguientes Pasos

1. **Eliminar código obsoleto**: Una vez verificado que todo funciona, eliminar:
   - API routes antiguas en `/api/auth/*` (excepto `[...nextauth]`)
   - Funciones en `/lib/auth.ts` y `/lib/cookie-auth.ts`
   - Componentes `SessionHandler` y `AuthDebug`

2. **Mejorar tipos**: Ajustar tipos TypeScript según sea necesario

3. **Agregar refresh token**: Configurar renovación automática de tokens

4. **Agregar múltiples proveedores**: Si se desea soportar otros métodos de login

## Soporte

Para más información sobre NextAuth:
- Documentación: https://next-auth.js.org/
- Proveedor OAuth: https://next-auth.js.org/configuration/providers/oauth
- Callbacks: https://next-auth.js.org/configuration/callbacks
