/**
 * Script de setup: crear usuarios de prueba usando Firebase Auth REST API.
 * Ejecutar con: node scripts/create-users.mjs
 * 
 * Requiere variables de entorno en .env (ver .env.example).
 * Nunca hardcodees passwords ni API keys en este archivo.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env manually
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn('⚠️  No se encontró archivo .env. Usando variables de entorno del sistema.');
  }
}

loadEnv();

function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ Variable de entorno requerida no configurada: ${key}`);
    console.error(`   Agrega ${key}="valor" en tu archivo .env`);
    process.exit(1);
  }
  return val;
}

const API_KEY = requireEnv('FIREBASE_API_KEY');
const PROJECT_ID = requireEnv('FIREBASE_PROJECT_ID');
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts`;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const USERS = [
  { email: 'admin@salesianosanjose.edu.sv',          password: requireEnv('SEED_ADMIN_PASSWORD'),          displayName: 'Administrador General',  role: 'admin' },
  { email: 'coord.academica@salesianosanjose.edu.sv', password: requireEnv('SEED_COORD_PASSWORD'),         displayName: 'Coord. Académica',       role: 'coordinacion_academica' },
  { email: 'coord.convivencia@salesianosanjose.edu.sv', password: requireEnv('SEED_COORD_PASSWORD'),      displayName: 'Coord. Convivencia',     role: 'coordinacion_convivencia' },
  { email: 'coord.primaria@salesianosanjose.edu.sv',  password: requireEnv('SEED_COORD_PASSWORD'),         displayName: 'Coord. Primaria',        role: 'coordinacion_primaria' },
  { email: 'coord.parvularia@salesianosanjose.edu.sv', password: requireEnv('SEED_COORD_PASSWORD'),        displayName: 'Coord. Parvularia',      role: 'coordinacion_parvularia' },
  { email: 'registro@salesianosanjose.edu.sv',        password: requireEnv('SEED_REGISTRO_PASSWORD'),      displayName: 'Registro Académico',     role: 'registro_academico' },
  { email: 'enfermeria@salesianosanjose.edu.sv',      password: requireEnv('SEED_ENFERMERIA_PASSWORD'),    displayName: 'Enfermería',             role: 'enfermeria' },
  { email: 'psicopedagogia@salesianosanjose.edu.sv',  password: requireEnv('SEED_PSICOPEDAGOGIA_PASSWORD'), displayName: 'Psicopedagogía',        role: 'psicopedagogio' },
  { email: 'docente@salesianosanjose.edu.sv',         password: requireEnv('SEED_DOCENTE_PASSWORD'),       displayName: 'Docente de Prueba',      role: 'docente' },
  { email: 'alumno@salesianosanjose.edu.sv',          password: requireEnv('SEED_ALUMNO_PASSWORD'),        displayName: 'Alumno de Prueba',       role: 'alumno' },
];

async function signUp(email, password, displayName) {
  const res = await fetch(`${AUTH_URL}:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { uid: data.localId, idToken: data.idToken };
}

async function createFirestoreUser(uid, data, idToken) {
  const url = `${FIRESTORE_URL}/users`;
  const body = {
    fields: {
      uid: { stringValue: uid },
      email: { stringValue: data.email },
      displayName: { stringValue: data.displayName },
      role: { stringValue: data.role },
      createdAt: { stringValue: new Date().toISOString() },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    if (err.error?.message?.includes('permission') || res.status === 403) {
      return { warning: 'Firestore permission denied - user created in Auth only' };
    }
    throw new Error(err.error?.message || 'Unknown error');
  }
  return await res.json();
}

async function main() {
  console.log('🔧 Creando usuarios de prueba...\n');

  const results = [];

  for (const user of USERS) {
    try {
      const { uid, idToken } = await signUp(user.email, user.password, user.displayName);
      console.log(`  ✅ Auth: ${user.email} → uid: ${uid}`);

      try {
        await createFirestoreUser(uid, user, idToken);
        console.log(`  ✅ Firestore: users/${uid} → role: ${user.role}`);
      } catch (fsErr) {
        console.log(`  ⚠️  Firestore: ${fsErr.message} (user in Auth only)`);
      }

      results.push({ email: user.email, role: user.role, uid });
    } catch (err) {
      if (err.message.includes('EMAIL_EXISTS')) {
        console.log(`  ⚠️  ${user.email} ya existe en Auth`);
        results.push({ email: user.email, role: user.role, uid: 'EXISTING' });
      } else {
        console.error(`  ❌ ${user.email}: ${err.message}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  USUARIOS CREADOS');
  console.log('═'.repeat(60));
  console.log('');
  console.log('  USUARIO                              ROL');
  console.log('  ' + '─'.repeat(56));
  for (const r of results) {
    const email = r.email.padEnd(36);
    console.log(`  ${email}${r.role}`);
  }
  console.log('');
  console.log('═'.repeat(60));
  console.log('\n  Nota: Las contraseñas están en .env — nunca se imprimen por seguridad.');
  console.log('  Para que Firestore funcione, crea las reglas o');
  console.log('  asigna el rol manualmente en Firebase Console → Firestore.\n');
}

main().catch(console.error);
