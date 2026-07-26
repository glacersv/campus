/**
 * Script de migración de alumnos desde proyecto viejo a nuevo.
 * Ejecutar con: node scripts/migrate-alumnos.cjs
 * 
 * Requiere en .env:
 *   OLD_PROJECT_CREDENTIALS=/ruta/al/service-account-viejo.json
 *   GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/service-account-nuevo.json
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
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

const OLD_PROJECT_KEY = process.env.OLD_PROJECT_CREDENTIALS;
const NEW_PROJECT_KEY = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CREDENTIALS;

if (!OLD_PROJECT_KEY || !NEW_PROJECT_KEY) {
  console.error('❌ Faltan credenciales de servicio.');
  console.error('   Configura en .env:');
  console.error('   OLD_PROJECT_CREDENTIALS=/ruta/al/service-account-viejo.json');
  console.error('   GOOGLE_APPLICATION_CREDENTIALS=/ruta/al/service-account-nuevo.json');
  process.exit(1);
}

const GRADE_MAP = {
  '1° Grado': '1',
  '2° Grado': '2',
  '3° Grado': '3',
  '4° Grado': '4',
  '5° Grado': '5',
  '6° Grado': '6',
  '7° Grado': '7',
  '8° Grado': '8',
  '9° Grado': '9',
  '1° Bachillerato': '10g',
  '2° Bachillerato': '11g',
  '1° Diseño Gráfico': '10t',
  '3° Diseño Gráfico': '12t',
  'Preparatoria': 'k6',
  'Kinder 4': 'k4',
  'Kinder 5': 'k5',
};

const oldApp = initializeApp({ credential: cert(require(OLD_PROJECT_KEY)) }, 'old');
const oldDb = getFirestore(oldApp);

const newApp = initializeApp({ credential: cert(require(NEW_PROJECT_KEY)) }, 'new');
const newDb = getFirestore(newApp);

async function cleanStudents(db) {
  console.log('\n🧹 Limpiando colección students...');
  const snapshot = await db.collection('students').get();
  if (snapshot.size === 0) {
    console.log('  No hay alumnos que limpiar.');
    return;
  }
  const BATCH_SIZE = 50;
  let batch = db.batch();
  let count = 0;
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    if (count % BATCH_SIZE === 0) {
      await batch.commit();
      console.log(`  → Eliminados ${count} alumnos...`);
      batch = db.batch();
    }
  }
  if (count % BATCH_SIZE !== 0) await batch.commit();
  console.log(`  ✅ Total eliminados: ${count}`);
}

async function main() {
  console.log('\n=== MIGRACIÓN DE ALUMNOS ===\n');

  await cleanStudents(newDb);

  const gradesSnap = await newDb.collection('grades').get();
  const currentGrades = {};
  gradesSnap.forEach(d => { currentGrades[d.id] = d.data().name; });
  console.log(`Grados en campus-27248: ${Object.keys(currentGrades).length}`);
  Object.entries(currentGrades).forEach(([id, name]) => console.log(`  ${id} → ${name}`));

  const sectionsSnap = await newDb.collection('sections').get();
  const sectionsByGrade = {};
  sectionsSnap.forEach(d => {
    const data = d.data();
    if (!sectionsByGrade[data.gradeId]) sectionsByGrade[data.gradeId] = [];
    sectionsByGrade[data.gradeId].push({ id: d.id, name: data.name });
  });

  const existingSnap = await newDb.collection('students').get();
  const existingCarnets = new Set();
  existingSnap.forEach(d => { if (d.data().carnet) existingCarnets.add(d.data().carnet); });
  console.log(`\nAlumnos ya existentes en campus-27248: ${existingCarnets.size}`);

  const oldSnap = await oldDb.collection('alumnos').get();
  console.log(`\nTotal alumnos en old project: ${oldSnap.size}`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let noGrade = 0;
  let inactive = 0;

  const BATCH_SIZE = 50;
  let batch = newDb.batch();
  let batchCount = 0;

  for (const doc of oldSnap.docs) {
    const a = doc.data();

    if (a.estado === 'INACTIVO' || a.estado === 'GRADUADO' || a.gradoActual === 'Graduado') {
      inactive++;
      continue;
    }

    const gradeId = GRADE_MAP[a.gradoActual];
    if (!gradeId) {
      noGrade++;
      continue;
    }

    const carnet = a.carnet || doc.id;
    if (existingCarnets.has(carnet)) {
      skipped++;
      continue;
    }

    const firstName = (a.nombres || '').trim();
    const lastName = (a.apellidos || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const gender = a.sexo === 'FEMENINO' ? 'F' : 'M';
    const enrollmentYear = parseInt(a.anioIngreso) || new Date().getFullYear();

    const sections = sectionsByGrade[gradeId] || [];
    const sectionId = sections.length > 0 ? sections[0].id : '';

    const id = `mig_${carnet}`;

    const studentData = {
      carnet,
      firstName,
      lastName,
      name: fullName,
      gender,
      gradeId,
      sectionId: sectionId || '',
      enrollmentYear,
      status: 'ACTIVO',
      enrollmentHistory: [
        { year: enrollmentYear, gradeId, sectionId: sectionId || '' }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    batch.set(newDb.collection('students').doc(id), studentData);
    batchCount++;
    imported++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`  → Lote de ${batchCount} alumnos guardado (${imported} total)`);
      batch = newDb.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`  → Lote final de ${batchCount} alumnos guardado`);
  }

  console.log('\n=== RESUMEN ===');
  console.log(`  Importados:    ${imported}`);
  console.log(`  Saltados (duplicados): ${skipped}`);
  console.log(`  Inactivos/Graduados:   ${inactive}`);
  console.log(`  Sin grado mapeable:    ${noGrade}`);
  console.log(`  Errores:       ${errors}`);
  console.log('');
  process.exit(0);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
