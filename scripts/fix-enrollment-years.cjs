/**
 * Script de calibración y corrección de años de ingreso (enrollmentYear)
 * e historial académico (enrollmentHistory) para el proyecto campus-27248.
 *
 * Ejecutar con: node scripts/fix-enrollment-years.cjs
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp
} = require('firebase/firestore');

const firebaseConfig = require('../firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log('========================================================');
  console.log('Iniciando calibración de años de ingreso en campus-27248');
  console.log('========================================================\n');

  // 1. Iniciar sesión como Super Admin para contar con permisos de escritura
  console.log('1. Autenticando como Administrador...');
  await signInWithEmailAndPassword(auth, 'admin@salesianosanjose.edu.sv', '123456');
  console.log('   Autenticación exitosa.\n');

  // 2. Obtener grados para nombres en historial
  const gradesSnap = await getDocs(collection(db, 'grades'));
  const gradeMap = new Map();
  gradesSnap.forEach(d => gradeMap.set(d.id, d.data().name || `${d.id}° Grado`));

  // 3. Obtener alumnos
  console.log('2. Obteniendo colección de estudiantes...');
  const studentsSnap = await getDocs(collection(db, 'students'));
  console.log(`   Total de alumnos encontrados: ${studentsSnap.size}\n`);

  // Año escolar de referencia actual en el sistema
  const currentYear = 2027;

  let updatedCount = 0;
  let skippedCount = 0;
  const BATCH_SIZE = 400; // Firestore soporta hasta 500 por batch
  let batch = writeBatch(db);
  let batchOps = 0;

  for (const docSnap of studentsSnap.docs) {
    const data = docSnap.data();
    const carnet = String(data.carnet || '');
    const prefix = parseInt(carnet.slice(0, 4), 10);

    let realEntryYear = null;

    // A. Si el carnet empieza con un año válido entre 2010 y 2027
    if (Number.isFinite(prefix) && prefix >= 2010 && prefix <= currentYear) {
      realEntryYear = prefix;
    } else if (Number.isFinite(data.enrollmentYear) && data.enrollmentYear >= 2010 && data.enrollmentYear <= currentYear) {
      realEntryYear = data.enrollmentYear;
    } else {
      // Si no tiene año válido en carnet (ej. SEED-001 o sin año), deducir lógicamente por grado
      const currentGradeId = String(data.gradeId || '');
      const numStr = currentGradeId.replace(/[^0-9]/g, '');
      const currentGradeNum = parseInt(numStr, 10);
      if (Number.isFinite(currentGradeNum) && currentGradeNum >= 1) {
        realEntryYear = currentYear - (currentGradeNum - 1);
      } else {
        realEntryYear = currentYear;
      }
    }

    // Calcular grado numérico actual
    const currentGradeId = String(data.gradeId || '');
    const numStr = currentGradeId.replace(/[^0-9]/g, '');
    const suffix = currentGradeId.toLowerCase().includes('t') ? 't' : currentGradeId.toLowerCase().includes('g') ? 'g' : '';
    let currentGradeNum = -1;

    if (currentGradeId === 'k4') currentGradeNum = -1;
    else if (currentGradeId === 'k5' || currentGradeId === 'k6') currentGradeNum = 0;
    else if (Number.isFinite(parseInt(numStr, 10))) currentGradeNum = parseInt(numStr, 10);

    // Reconstruir historial académico cronológico coherente
    const newHistory = [];
    if (currentGradeNum !== -1) {
      for (let yr = realEntryYear; yr <= currentYear; yr++) {
        const diff = currentYear - yr;
        const targetNum = currentGradeNum - diff;

        let gradeForYr = '';
        if (targetNum <= -1) gradeForYr = 'k4';
        else if (targetNum === 0) gradeForYr = 'k5';
        else gradeForYr = targetNum <= 9 ? String(targetNum) : `${targetNum}${suffix}`;

        const sectionId = data.sectionId || 'A';
        const sectionLetter = sectionId.includes('-')
          ? sectionId.split('-').pop()?.toUpperCase() || 'A'
          : sectionId.toUpperCase();
        const cleanLetter = sectionLetter.replace(/[0-9]/g, '').replace('G', '').replace('T', '').toLowerCase();
        const histSectionId = `${yr}-${gradeForYr}-${cleanLetter || 'a'}`;

        newHistory.push({
          year: yr,
          gradeId: gradeForYr,
          gradeName: gradeMap.get(gradeForYr) || `${gradeForYr}° Grado`,
          sectionId: histSectionId,
          sectionName: (cleanLetter || 'A').toUpperCase(),
          status: yr === currentYear ? 'EN_CURSO' : 'FINALIZADO'
        });
      }
    } else {
      newHistory.push({
        year: realEntryYear,
        gradeId: currentGradeId,
        gradeName: gradeMap.get(currentGradeId) || currentGradeId,
        sectionId: data.sectionId || '',
        status: 'EN_CURSO'
      });
    }

    // Actualizar registro en Firestore
    const studentRef = doc(db, 'students', docSnap.id);
    batch.update(studentRef, {
      enrollmentYear: realEntryYear,
      enrollmentHistory: newHistory,
      updatedAt: serverTimestamp()
    });

    batchOps++;
    updatedCount++;

    if (batchOps >= BATCH_SIZE) {
      console.log(`   Guardando lote de ${batchOps} alumnos en Firestore...`);
      await batch.commit();
      batch = writeBatch(db);
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    console.log(`   Guardando lote final de ${batchOps} alumnos en Firestore...`);
    await batch.commit();
  }

  console.log('\n========================================================');
  console.log(`✅ PROCESO COMPLETADO EXITOSAMENTE`);
  console.log(`   Total de alumnos corregidos en campus-27248: ${updatedCount}`);
  console.log('========================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error durante la calibración:', err);
  process.exit(1);
});
