# Campus Salesiano San José — Guía de inicio

## Requisitos

- Node.js 18+
- npm
- Cuenta de Firebase
- Cuenta de GitHub

## Primeros pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/glacersv/campus.git
cd campus

# 2. Instalar dependencias
npm install
cd functions && npm install && cd ..

# 3. Configurar variables de entorno
# Copiar .env.example a .env y llenar las variables
cp .env.example .env
```

## Variables de entorno (.env)

```
GEMINI_API_KEY="tu-api-key"
VITE_GEMINI_API_KEY="tu-api-key"
FIREBASE_API_KEY="tu-firebase-api-key"
FIREBASE_PROJECT_ID="campus-27248"
GOOGLE_APPLICATION_CREDENTIALS="ruta/al/service-account.json"

# Contraseñas para usuarios de prueba (seed)
SEED_ADMIN_PASSWORD="Admin2026!"
SEED_COORD_PASSWORD="Coord2026!"
SEED_REGISTRO_PASSWORD="Registro2026!"
SEED_ENFERMERIA_PASSWORD="Enfermeria2026!"
SEED_PSICOPEDAGOGIA_PASSWORD="Psicopedagogia2026!"
SEED_DOCENTE_PASSWORD="Docente2026!"
SEED_ALUMNO_PASSWORD="Alumno2026!"
```

## Firebase

1. Crear proyecto en Firebase Console
2. Habilitar Authentication (email/password)
3. Habilitar Firestore Database
4. Habilitar Hosting
5. Descargar service-account.json y colocarlo en una ruta segura
6. Configurar firebase-applet-config.json con las credenciales del proyecto

## Despliegue

```bash
# Construir y subir hosting
npm run deploy

# Subir reglas de Firestore
npm run rules

# Subir Cloud Functions (requiere plan Blaze)
cd functions && npm run deploy && cd ..
```

## Usuarios de prueba

Crear usuarios en Firebase Auth:

```bash
npx tsx scripts/create-users.ts
```

Usuarios disponibles:

| Email | Contraseña | Rol |
|---|---|---|
| admin@salesianosanjose.edu.sv | (ver .env) | Administrador |
| docente@salesianosanjose.edu.sv | (ver .env) | Docente |
| alumno@salesianosanjose.edu.sv | (ver .env) | Alumno |
| registro@salesianosanjose.edu.sv | (ver .env) | Registro Académico |
| enfermeria@salesianosanjose.edu.sv | (ver .env) | Enfermería |
| psicopedagogia@salesianosanjose.edu.sv | (ver .env) | Psicopedagogía |
| coord.academica@salesianosanjose.edu.sv | (ver .env) | Coord. Académica |
| coord.convivencia@salesianosanjose.edu.sv | (ver .env) | Coord. Convivencia |
| coord.primaria@salesianosanjose.edu.sv | (ver .env) | Coord. Primaria |
| coord.parvularia@salesianosanjose.edu.sv | (ver .env) | Coord. Parvularia |

## Desarrollo local

```bash
npm run dev
# Servidor en http://localhost:3000
```
