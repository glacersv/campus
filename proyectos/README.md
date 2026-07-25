# 🔬 Sistema de Proyectos – Semana de la Juventud 2026
## Colegio Salesiano San José — React + TypeScript + Firebase

Sistema completo de registro y validación de proyectos científicos, con
generación de sugerencias de complemento de Informática usando IA (Claude API).

---

## 📁 Estructura del proyecto

```
salesiano-firebase/
├── functions/                    ← Cloud Functions (backend)
│   └── src/index.ts              ← Llama a Claude API de forma segura
├── src/
│   ├── types/index.ts            ← Todos los tipos TypeScript
│   ├── lib/firebase.ts           ← Inicialización de Firebase
│   ├── hooks/
│   │   ├── useAuth.tsx           ← Login, registro, sesión
│   │   ├── useProyectos.ts       ← CRUD y transiciones de estado
│   │   └── useCatalogos.ts       ← Validadores, historial, perfiles
│   ├── components/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── FormularioProyecto.tsx
│   │   ├── Historial.tsx
│   │   ├── Cronograma.tsx
│   │   ├── AdminPanel.tsx
│   │   └── SugerenciaInformatica.tsx   ← Botón de sugerencias IA
│   ├── App.tsx
│   └── main.tsx
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .firebaserc
└── package.json
```

---

## 🚀 PARTE 1 — Crear el proyecto en Firebase

### 1.1 Crear proyecto
1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. **"Agregar proyecto"** → nombre: `salesiano-2026`
3. Desactiva Google Analytics (no es necesario)
4. Espera a que se cree (~1 min)

### 1.2 Activar Authentication
1. Menú izquierdo → **Authentication → Comenzar**
2. Tab **Sign-in method** → habilita **Correo/contraseña**
3. **(Recomendado para pruebas)** Authentication → Settings → desactiva
   "Requerir verificación de correo" para no bloquear el flujo de prueba

### 1.3 Crear Firestore
1. Menú izquierdo → **Firestore Database → Crear base de datos**
2. **"Iniciar en modo de producción"**
3. Ubicación: `us-central1`
4. Clic en **Listo**

### 1.4 Registrar la app web
1. En la página principal del proyecto, clic en el ícono **`</>`**
2. Nombre: `salesiano-web`
3. ✅ Activa **Firebase Hosting** en este mismo paso
4. Copia el bloque `firebaseConfig` que aparece — lo necesitarás en la Parte 3

---

## 🔐 PARTE 2 — Activar plan Blaze (necesario para las Cloud Functions con IA)

> **Por qué se necesita:** El plan Spark no permite que Cloud Functions hagan
> llamadas salientes a internet (como llamar a la API de Claude). El plan Blaze
> sigue siendo gratis dentro de las cuotas — solo se cobra el excedente, y para
> el volumen de una feria escolar el costo real será de centavos o $0.

1. En Firebase Console, esquina inferior izquierda → **"Actualizar"** (o ícono de cohete)
2. Selecciona **Blaze (pago por uso)**
3. Vincula una tarjeta de crédito/débito (Google la pide, pero no cobra si no superas cuotas gratuitas)
4. Confirma

### Configurar límite de gasto (opcional, recomendado)
1. Ve a [console.cloud.google.com/billing/budgets](https://console.cloud.google.com/billing/budgets)
2. Crea un presupuesto de **$5 USD/mes** con alertas
3. Así Google te avisa si algo se sale de lo esperado — no te cobra automáticamente más de lo que configures como alerta, pero verás cualquier gasto inusual

---

## 🔑 PARTE 3 — Obtener API Key de Anthropic (Claude)

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta si no tienes
3. Ve a **API Keys** → **Create Key**
4. Copia la key (empieza con `sk-ant-...`) — **solo se muestra una vez**
5. Agrega crédito mínimo en **Billing** (con $5 USD alcanza para cientos de sugerencias)

---

## ⚙️ PARTE 4 — Configurar el proyecto en tu computadora

### 4.1 Instalar herramientas necesarias
```bash
# Node.js 20+ (si no lo tienes, descarga de nodejs.org)
node --version

# Firebase CLI
npm install -g firebase-tools

# Iniciar sesión con tu cuenta Google
firebase login
```

### 4.2 Preparar el proyecto
```bash
cd salesiano-firebase

# Instalar dependencias del frontend
npm install

# Instalar dependencias de las Cloud Functions
cd functions
npm install
cd ..
```

### 4.3 Vincular tu proyecto Firebase
Abre `.firebaserc` y reemplaza el ID:
```json
{
  "projects": {
    "default": "salesiano-2026"
  }
}
```
> Usa el **Project ID** real (lo ves en Firebase Console → ⚙️ Configuración del proyecto)

### 4.4 Configurar variables de entorno del frontend
```bash
cp .env.example .env
```
Abre `.env` y pega los valores de tu `firebaseConfig` (Parte 1.4):
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=salesiano-2026.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=salesiano-2026
VITE_FIREBASE_STORAGE_BUCKET=salesiano-2026.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4.5 Configurar el secret de Claude API (para las Cloud Functions)
Esto guarda tu API key de forma segura en Firebase, **nunca** en el código:
```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
```
Te pedirá pegar el valor → pega tu `sk-ant-...` y presiona Enter.

Verifica que se guardó:
```bash
firebase functions:secrets:access ANTHROPIC_API_KEY
```

---

## ▶️ PARTE 5 — Probar en desarrollo (antes de publicar)

```bash
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173)

> ⚠️ Las Cloud Functions con secrets **no funcionan bien en local** sin el
> emulador completo. Para probar el botón de sugerencias IA, es más simple
> desplegar directo a Firebase (Parte 6) y probar ahí — el resto de la app
> (login, registro, validación) sí funciona 100% en local.

---

## 🌐 PARTE 6 — Publicar (Firebase Hosting + Functions)

### 6.1 Publicar las reglas de Firestore
```bash
firebase deploy --only firestore:rules
```

### 6.2 Publicar las Cloud Functions
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```
Este paso tarda 2-5 minutos la primera vez. Verás algo como:
```
✔ functions[sugerirComplementoInformatica(us-central1)] Successful create operation.
✔ functions[asignarComplementoInformatica(us-central1)] Successful create operation.
```

### 6.3 Compilar y publicar el frontend
```bash
npm run build
firebase deploy --only hosting
```

Al terminar verás tu URL pública:
```
✔ Hosting URL: https://salesiano-2026.web.app
```

**Esa es la URL que comparte con docentes, coordinación y estudiantes.**

### 6.4 Deploy completo (atajo para futuras actualizaciones)
Una vez configurado todo, para subir cambios futuros solo necesitas:
```bash
npm run build
firebase deploy
```
(Esto despliega hosting + functions + reglas de Firestore juntos)

---

## 🌍 PARTE 7 — Dominio personalizado (opcional)

Si el colegio tiene un dominio propio (ej. `proyectos.salesiano.edu.sv`):

1. Firebase Console → **Hosting → Agregar dominio personalizado**
2. Escribe tu dominio
3. Firebase te da registros DNS (tipo `TXT` y `A`) para agregar en tu proveedor de dominio
4. Espera verificación (puede tardar hasta 24h, normalmente minutos)
5. Firebase emite el certificado SSL automáticamente — gratis

Si no tienes dominio propio, **`https://salesiano-2026.web.app` funciona perfecto y es gratis para siempre.**

---

## 👤 PARTE 8 — Crear los primeros usuarios

Con la app ya publicada, ve a la URL y usa el tab **"Registrarse"**:

| Rol | Datos que pide |
|---|---|
| **Coordinación** | Nombre, correo, contraseña |
| **Docente** | Nombre, correo, contraseña, materia que imparte |
| **Estudiante** | Nombre, correo, contraseña, grado, sección, N° de lista |

> El primer usuario que registres como **admin** debe hacerse manualmente:
> Firebase Console → Firestore → colección `perfiles` → busca tu documento
> (por tu UID) → edita el campo `rol` y ponlo en `"admin"`.

---

## 🔐 PARTE 9 — Asignar docentes validadores

1. Inicia sesión como **admin**
2. Ve a la pestaña **⚙️ Administración → 🔐 Validadores**
3. Selecciona grado + materia + docente → **Guardar asignación**
4. Repite para cada combinación que necesites

---

## 💻 PARTE 10 — Usar el complemento de Informática (tu flujo)

1. Coordinación aprueba un proyecto oficialmente (flujo normal)
2. Tú (como docente de Informática) entras al detalle de ese proyecto
3. Verás la sección **"💻 Complemento de Informática"**
4. Clic en **✨ Generar sugerencias con IA** → Claude analiza el tema del
   proyecto y devuelve 3 opciones: Presentación / Dashboard / Aplicación
5. Lees las 3 opciones (con alcance y herramientas sugeridas: App Inventor,
   VB 2013, Excel, etc.)
6. Eliges la que más te convenza con el radio button → **✓ Asignar esta opción**
7. O si prefieres escribir la tuya: **✏️ Escribir manualmente**
8. Queda guardado permanentemente en el proyecto, visible para ti y para
   el grupo de estudiantes

Cada llamada a "Generar sugerencias" cuesta una fracción de centavo de tu
crédito en Anthropic Console — puedes ver el consumo ahí en cualquier momento.

---

## 📋 Flujo de estados del sistema

```
BORRADOR → REGISTRADO → EN_REVISION_MATERIA → EN_COORDINACION → APROBADO_OFICIAL
                                ↓                                      ↓
                    RECLASIFICAR / RECHAZADO_MATERIA          💻 Complemento Informática
                                              ↓
                                     RECHAZADO_OFICIAL
```

---

## 📅 Fechas límite importantes (ya integradas en el sistema)

| Fecha | Evento |
|---|---|
| 8 jun | Primera recepción de fichas |
| 15 jun | Segunda recepción corregida |
| **17 jun** | **Límite para registrar proyectos** (el sistema lo bloquea automáticamente) |
| **23 jun** | **Límite para aprobación oficial** (el sistema lo bloquea automáticamente) |
| 10 ago | Entrega trabajo digital + montaje |
| 11–13 ago | Exposición de proyectos |

---

## 💰 Resumen de costos reales esperados

| Servicio | Costo esperado para una feria escolar |
|---|---|
| Firebase Hosting | $0 (muy por debajo del límite gratis) |
| Firestore | $0 (muy por debajo del límite gratis) |
| Cloud Functions (ejecuciones) | $0 (límite gratis: 2M invocaciones/mes) |
| Claude API (sugerencias IA) | Centavos de dólar — quizás $1-3 USD total para toda la feria |
| **Total estimado** | **Menos de $5 USD para todo el ciclo escolar** |

---

## ❓ Problemas comunes

**"Error: functions/permission-denied al generar sugerencias"**
→ Verifica que tu usuario tenga rol `docente`, `coordinacion` o `admin` en Firestore → `perfiles`

**"La función tarda mucho o da timeout"**
→ Normal la primera vez que se usa después de inactividad (cold start). Reintenta.

**"No veo el botón de sugerencias IA"**
→ Solo aparece si el proyecto está en estado `aprobado_oficial` y tu rol es docente/coordinación/admin

**"Firebase deploy falla en functions"**
→ Verifica que ejecutaste `npm run build` dentro de `functions/` antes de deploy
→ Verifica que el secret esté configurado: `firebase functions:secrets:access ANTHROPIC_API_KEY`

**"Variables de entorno no se leen"**
→ El archivo debe llamarse exactamente `.env` (no `.env.example`) y estar en la raíz

---

## 🛠️ Comandos de referencia rápida

```bash
# Desarrollo local
npm run dev

# Ver logs de las funciones en producción
firebase functions:log

# Re-desplegar todo después de cambios
npm run build && firebase deploy

# Solo el frontend
firebase deploy --only hosting

# Solo las funciones
cd functions && npm run build && cd .. && firebase deploy --only functions

# Solo las reglas de seguridad
firebase deploy --only firestore:rules
```

---

## 🛠️ Tecnologías usadas

- **React 18 + TypeScript + Vite**
- **Firebase Authentication** — login y roles
- **Firestore** — base de datos en tiempo real
- **Firebase Hosting** — publicación con SSL gratis
- **Cloud Functions (Node 20)** — backend seguro para llamar a Claude API
- **Anthropic Claude API** (`claude-sonnet-4-6`) — generación de sugerencias
