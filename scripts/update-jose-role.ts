import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
    console.warn('⚠️  No se encontró archivo .env');
  }
}

loadEnv();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'campus-27248';

async function main() {
  const email = 'jose.marquez@salesianosanjose.edu.sv';

  if (getApps().length === 0) {
    initializeApp({ projectId: PROJECT_ID });
  }

  const auth = getAuth();
  const db = getFirestore();

  try {
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      console.log('❌ No se encontró el documento en Firestore para ese usuario.');
      return;
    }

    const currentRole = doc.data()?.role;
    console.log(`📋 Rol actual: ${currentRole}`);

    await userRef.update({ role: 'docente' });
    console.log(`✅ Rol actualizado a "docente" para ${email} (uid: ${uid})`);
    console.log('   El cambio se reflejará al cerrar sesión y volver a iniciar.');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log(`❌ El usuario ${email} no existe en Firebase Auth.`);
      console.log('   Créalo primero en Firebase Console > Authentication.');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
}

main().catch(console.error);
