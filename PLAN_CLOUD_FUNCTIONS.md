# Plan: Activación de Cloud Functions (Firebase Blaze)

> **Fecha:** 28 julio 2026
> **Estado:** Pendiente — esperando cambio a plan Blaze
> **Proyecto:** campus-27248

---

## 1. Por qué necesita Blaze

| Recurso | Spark (Free) | Blaze (Pago-por-uso) |
|---------|-------------|----------------------|
| Cloud Functions (2da gen) | ❌ No disponible | ✅ Disponible |
| Red externa en Functions | ❌ Solo Google APIs | ✅ Cualquier endpoint |
| Firestore lecturas/día | 50k | Sin límite fijo |
| Costo fijo | $0 | $0 (solo por uso real) |

Las 3 funciones en `functions/src/index.ts` requieren Blaze:
- **`assignUserRole`** — Asignar roles desde admin
- **`geminiProxy`** — Proxy a Gemini API
- **`validateUserCreation`** — Validar registro de usuarios

---

## 2. Pasos para activar

### 2.1 Subir a Blaze
1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Proyecto `campus-27248` → **Usage & Billing** (o "Facturación")
3. Click **Seleccionar plan Blaze**
4. Confirmar — **no hay costo fijo**, solo se cobra lo que se use

### 2.2 Configurar Gemini API Key
```bash
# Desde la terminal (con firebase-tools instalado)
firebase functions:secrets:set GEMINI_API_KEY
# Pegar la API Key cuando lo solicite
```
O desde [Google AI Studio](https://makersuite.google.com/app/apikey) crear una API Key.

### 2.3 Desplegar funciones
```bash
cd functions
npm run build        # ya compilado, pero por si acaso
firebase deploy --only functions
```

### 2.4 Verificar
```bash
firebase functions:log
```
Probar en la app: desde admin asignar un rol a un usuario.

---

## 3. Funciones incluidas

| Función | Tipo | Descripción |
|---------|------|-------------|
| `assignUserRole` | `onCall` | Admin asigna roles a usuarios. Valida permisos del llamante. |
| `geminiProxy` | `onCall` | Proxy a Gemini 2.0 Flash. Requiere `GEMINI_API_KEY` en secrets. |
| `validateUserCreation` | `onCall` | Valida datos antes de crear usuario. |

---

## 4. Mantenimiento

```bash
# Logs en tiempo real
firebase functions:log

# Actualizar función específica
firebase deploy --only functions:geminiProxy

# Ver secretos configurados
firebase functions:secrets:list
```

---

## 5. Costos estimados (Blaze)

| Servicio | Uso esperado | Costo estimado/mes |
|----------|-------------|-------------------|
| Cloud Functions | ~100k invocaciones | ~$0.40 |
| Firestore | ~500k lecturas, ~100k escrituras | ~$1.00 |
| Gemini API | ~30k consultas/mes | ~$4.50 |
| **Total estimado** | | **~$6.00 USD/mes** |

> **Nota:** Gemini API se cobra directo en Google AI Studio / Cloud AI Platform, no en Firebase.
