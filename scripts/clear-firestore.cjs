/**
 * Script para limpiar colecciones de Firestore.
 * Ejecutar con: node scripts/clear-firestore.cjs
 * 
 * Requiere: GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/service-account.json
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Load .env
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
    // .env not found, rely on system env vars
  }
}

loadEnv();

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CREDENTIALS;

if (!credentialsPath) {
  console.error('❌ No se encontró credencial de servicio.');
  console.error('   Configura GOOGLE_APPLICATION_CREDENTIALS en tu .env o como variable de entorno.');
  process.exit(1);
}

const serviceAccount = require(credentialsPath);
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Cleared ${collectionName} (${snapshot.size} docs)`);
}

async function main() {
  console.log('Clearing Firestore collections...\n');
  
  await clearCollection('grades');
  await clearCollection('sections');
  await clearCollection('buildings');
  await clearCollection('computer_labs');
  await clearCollection('baccalaureate_types');
  
  console.log('\nDone! Recarga la app.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
