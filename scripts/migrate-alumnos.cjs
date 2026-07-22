const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// === CONFIGURACIÓN ===
const OLD_PROJECT_KEY = 'C:/Users/ADMIN/Downloads/gestion-escolar-cssj-firebase-adminsdk-fbsvc-7384fec7be.json';
const NEW_PROJECT_KEY = 'C:/Users/ADMIN/Downloads/campus-27248-firebase-adminsdk-fbsvc-226a4833db.json';

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
};

// === INICIALIZAR ===
const oldApp = initializeApp({ credential: cert(require(OLD_PROJECT_KEY)) }, 'old');
const oldDb = getFirestore(oldApp);

const newApp = initializeApp({ credential: cert(require(NEW_PROJECT_KEY)) }, 'new');
const newDb = getFirestore(newApp);

async function main() {
  console.log('\n=== MIGRACIÓN DE ALUMNOS ===\n');

  // 1. Leer grados actuales para validar mapeo
  const gradesSnap = await newDb.collection('grades').get();
  const currentGrades = {};
  gradesSnap.forEach(d => { currentGrades[d.id] = d.data().name; });
  console.log(`Grados en campus-27248: ${Object.keys(currentGrades).length}`);
  Object.entries(currentGrades).forEach(([id, name]) => console.log(`  ${id} → ${name}`));

  // 2. Leer secciones actuales
  const sectionsSnap = await newDb.collection('sections').get();
  const sectionsByGrade = {};
  sectionsSnap.forEach(d => {
    const data = d.data();
    if (!sectionsByGrade[data.gradeId]) sectionsByGrade[data.gradeId] = [];
    sectionsByGrade[data.gradeId].push({ id: d.id, name: data.name });
  });

  // 3. Leer alumnos existentes para evitar duplicados
  const existingSnap = await newDb.collection('students').get();
  const existingCarnets = new Set();
  existingSnap.forEach(d => { if (d.data().carnet) existingCarnets.add(d.data().carnet); });
  console.log(`\nAlumnos ya existentes en campus-27248: ${existingCarnets.size}`);

  // 4. Leer alumnos del proyecto viejo
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

    // Saltar graduados e inactivos
    if (a.estado === 'INACTIVO' || a.estado === 'GRADUADO' || a.gradoActual === 'Graduado') {
      inactive++;
      continue;
    }

    // Saltar si no tiene grado mapeable
    const gradeId = GRADE_MAP[a.gradoActual];
    if (!gradeId) {
      noGrade++;
      continue;
    }

    // Saltar si ya existe por carnet
    const carnet = a.carnet || doc.id;
    if (existingCarnets.has(carnet)) {
      skipped++;
      continue;
    }

    // Construir alumno
    const firstName = (a.nombres || '').trim();
    const lastName = (a.apellidos || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const gender = a.sexo === 'FEMENINO' ? 'F' : 'M';
    const enrollmentYear = parseInt(a.anioIngreso) || new Date().getFullYear();

    // Asignar sección por defecto (la primera del grado)
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
      sectionId,
      enrollmentYear,
      status: 'ACTIVO',
      enrollmentHistory: [
        { year: enrollmentYear, gradeId, sectionId: sectionId || undefined }
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

  // Último lote
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
