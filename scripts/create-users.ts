/**
 * Script de setup: crear usuarios de prueba para cada rol.
 * Ejecutar con: npx tsx scripts/create-users.ts
 * 
 * Requiere variables de entorno en .env (ver .env.example).
 * Nunca hardcodees passwords en este archivo.
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually (sin dotenv como dependencia)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
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

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'campus-27248';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`❌ Variable de entorno requerida no configurada: ${key}`);
    console.error(`   Agrega ${key}="valor" en tu archivo .env`);
    process.exit(1);
  }
  return val;
}

// Usuarios a crear: email → { password, displayName, role }
const USERS: Record<string, { password: string; displayName: string; role: string }> = {
  'admin@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_ADMIN_PASSWORD'),
    displayName: 'Administrador General',
    role: 'admin',
  },
  'coord.academica@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_COORD_PASSWORD'),
    displayName: 'Coord. Académica',
    role: 'coordinacion_academica',
  },
  'coord.convivencia@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_COORD_PASSWORD'),
    displayName: 'Coord. Convivencia',
    role: 'coordinacion_convivencia',
  },
  'coord.primaria@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_COORD_PASSWORD'),
    displayName: 'Coord. Primaria',
    role: 'coordinacion_primaria',
  },
  'coord.parvularia@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_COORD_PASSWORD'),
    displayName: 'Coord. Parvularia',
    role: 'coordinacion_parvularia',
  },
  'registro@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_REGISTRO_PASSWORD'),
    displayName: 'Registro Académico',
    role: 'registro_academico',
  },
  'enfermeria@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_ENFERMERIA_PASSWORD'),
    displayName: 'Enfermería',
    role: 'enfermeria',
  },
  'psicopedagogia@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_PSICOPEDAGOGIA_PASSWORD'),
    displayName: 'Psicopedagogía',
    role: 'psicopedagogio',
  },
  'docente@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_DOCENTE_PASSWORD'),
    displayName: 'Docente de Prueba',
    role: 'docente',
  },
  'alumno@salesianosanjose.edu.sv': {
    password: requireEnv('SEED_ALUMNO_PASSWORD'),
    displayName: 'Alumno de Prueba',
    role: 'alumno',
  },
};

async function main() {
  console.log('🔧 Inicializando Firebase Admin...');

  if (getApps().length === 0) {
    initializeApp({ projectId: PROJECT_ID });
  }

  const auth = getAuth();
  const db = getFirestore();

  console.log(`\n📋 Creando ${Object.keys(USERS).length} usuarios...\n`);

  for (const [email, data] of Object.entries(USERS)) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
        console.log(`  ⚠️  ${email} ya existe en Auth (uid: ${userRecord.uid})`);
      } catch {
        userRecord = await auth.createUser({
          email,
          password: data.password,
          displayName: data.displayName,
          emailVerified: true,
        });
        console.log(`  ✅ Auth: ${email} → uid: ${userRecord.uid}`);
      }

      const userRef = db.collection('users').doc(userRecord.uid);
      const existing = await userRef.get();
      if (!existing.exists) {
        await userRef.set({
          uid: userRecord.uid,
          email,
          displayName: data.displayName,
          role: data.role,
          createdAt: new Date().toISOString(),
        });
        console.log(`  ✅ Firestore: users/${userRecord.uid} → role: ${data.role}`);
      } else {
        console.log(`  ⚠️  Firestore: users/${userRecord.uid} ya existe`);
      }
    } catch (err: any) {
      console.error(`  ❌ Error con ${email}:`, err.message);
    }
  }

  console.log('\n🔍 Verificando jose.marquez@salesianosanjose.edu.sv...');
  try {
    const jose = await auth.getUserByEmail('jose.marquez@salesianosanjose.edu.sv');
    const joseDoc = await db.collection('users').doc(jose.uid).get();
    if (joseDoc.exists) {
      console.log(`  ✅ Existe: uid=${jose.uid}, role=${joseDoc.data()?.role}`);
    } else {
      await db.collection('users').doc(jose.uid).set({
        uid: jose.uid,
        email: 'jose.marquez@salesianosanjose.edu.sv',
        displayName: 'José Marquez',
        role: 'docente',
        createdAt: new Date().toISOString(),
      });
      console.log(`  ✅ Creado en Firestore: uid=${jose.uid}, role=docente`);
    }
  } catch {
    console.log('  ⚠️  Usuario jose.marquez no encontrado en Auth (créalo en Firebase Console)');
  }

  console.log('\n✅ ¡Listo! Usuarios creados.\n');
  console.log('Nota: Las contraseñas están en .env — nunca se imprimen por seguridad.');
}

main().catch(console.error);
