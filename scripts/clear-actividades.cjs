/**
 * Script para limpiar TODAS las actividades evaluadas (rúbricas, calificaciones)
 * de todos los proyectos en Firestore.
 *
 * Ejecutar con: node scripts/clear-actividades.cjs
 *
 * Requiere: GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/service-account.json
 *
 * ⚠️ ACCIÓN IRREVERSIBLE: borra la colección 'actividades_evaluadas' y el
 * arreglo 'actividades_evaluadas' de cada documento en 'proyectos'.
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');
const { resolve } = require('path');

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

const CHUNK = 400;

async function clearActividades() {
  console.log('🧹 Eliminando actividades_evaluadas...');
  let total = 0;
  let lastDoc = null;

  while (true) {
    let q = db.collection('actividades_evaluadas').limit(CHUNK);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    lastDoc = snap.docs[snap.docs.length - 1];
    console.log(`   → ${total} eliminadas...`);
    if (snap.size < CHUNK) break;
  }
  console.log(`✅ actividades_evaluadas eliminadas: ${total}`);
}

async function clearProyectoArray() {
  console.log('🧹 Limpiando arreglo actividades_evaluadas en proyectos...');
  const snap = await db.collection('proyectos').get();
  let count = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (Array.isArray(data.actividades_evaluadas) && data.actividades_evaluadas.length > 0) {
      await doc.ref.update({ actividades_evaluadas: [] });
      count++;
    }
  }
  console.log(`✅ Proyectos actualizados: ${count} de ${snap.size}`);
}

async function main() {
  await clearActividades();
  await clearProyectoArray();
  console.log('\n✅ Limpieza completa. Recarga la app.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
