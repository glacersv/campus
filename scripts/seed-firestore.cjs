const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('C:/Users/ADMIN/Downloads/campus-27248-firebase-adminsdk-fbsvc-226a4833db.json');

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function main() {
  console.log('Seeding Firestore...\n');

  // Buildings
  const buildings = [
    { id: 'b1', name: 'Edificio Principal', code: 'EP', color: '#12562E', description: 'Administración y oficinas' },
    { id: 'b2', name: 'Edificio Académico', code: 'EA', color: '#0D71B9', description: 'Aulas de clases' },
    { id: 'b3', name: 'Edificio Técnico', code: 'ET', color: '#FAB700', description: 'Laboratorios y talleres' },
    { id: 'b4', name: 'Edificio Deportivo', code: 'ED', color: '#D32F2F', description: 'Gimnasio y deportes' }
  ];
  for (const b of buildings) await db.collection('buildings').doc(b.id).set(b);
  console.log(`Created ${buildings.length} buildings`);

  // Computer Labs
  const labs = [
    { id: 'cl1', name: 'Lab 1', buildingId: 'b3', capacity: 30, devices: 30 },
    { id: 'cl2', name: 'Lab 2', buildingId: 'b3', capacity: 30, devices: 28 },
    { id: 'cl3', name: 'Lab 3', buildingId: 'b3', capacity: 30, devices: 30 },
    { id: 'cl4', name: 'Lab 4', buildingId: 'b2', capacity: 25, devices: 25 },
    { id: 'cl5', name: 'Lab 5', buildingId: 'b2', capacity: 25, devices: 24 },
    { id: 'cl6', name: 'Lab 6', buildingId: 'b2', capacity: 25, devices: 25 },
    { id: 'cl7', name: 'Lab 7', buildingId: 'b3', capacity: 35, devices: 35 },
    { id: 'cl8', name: 'Lab 8', buildingId: 'b3', capacity: 35, devices: 32 },
    { id: 'cl9', name: 'Lab 9', buildingId: 'b3', capacity: 35, devices: 35 },
    { id: 'cl10', name: 'Lab 10', buildingId: 'b3', capacity: 30, devices: 30 }
  ];
  for (const l of labs) await db.collection('computer_labs').doc(l.id).set(l);
  console.log(`Created ${labs.length} computer labs`);

  // Baccalaureate Types
  const bacTypes = [
    { id: 'general', name: 'Bachillerato General', maxGrade: 11 },
    { id: 'tecnico', name: 'Bachillerato Técnico', maxGrade: 12 }
  ];
  for (const bt of bacTypes) await db.collection('baccalaureate_types').doc(bt.id).set(bt);
  console.log(`Created ${bacTypes.length} baccalaureate types`);

  // Grades
  const grades = [
    { id: '1', name: '1° Grado', cycle: '1' },
    { id: '2', name: '2° Grado', cycle: '1' },
    { id: '3', name: '3° Grado', cycle: '1' },
    { id: '4', name: '4° Grado', cycle: '2' },
    { id: '5', name: '5° Grado', cycle: '2' },
    { id: '6', name: '6° Grado', cycle: '2' },
    { id: '7', name: '7° Grado', cycle: '3' },
    { id: '8', name: '8° Grado', cycle: '3' },
    { id: '9', name: '9° Grado', cycle: '3' },
    { id: '10g', name: '10° Bachillerato General', cycle: '4', baccalaureateType: 'general' },
    { id: '11g', name: '11° Bachillerato General', cycle: '4', baccalaureateType: 'general' },
    { id: '10t', name: '10° Bachillerato Técnico', cycle: '4', baccalaureateType: 'tecnico' },
    { id: '11t', name: '11° Bachillerato Técnico', cycle: '4', baccalaureateType: 'tecnico' },
    { id: '12t', name: '12° Bachillerato Técnico', cycle: '4', baccalaureateType: 'tecnico' }
  ];
  for (const g of grades) await db.collection('grades').doc(g.id).set(g);
  console.log(`Created ${grades.length} grades`);

  // Sections
  const sections = [
    { id: '1a', name: 'A', gradeId: '1', capacity: 45, buildingId: 'b2' },
    { id: '1b', name: 'B', gradeId: '1', capacity: 42, buildingId: 'b2' },
    { id: '2a', name: 'A', gradeId: '2', capacity: 45, buildingId: 'b2' },
    { id: '2b', name: 'B', gradeId: '2', capacity: 42, buildingId: 'b2' },
    { id: '3a', name: 'A', gradeId: '3', capacity: 45, buildingId: 'b2' },
    { id: '3b', name: 'B', gradeId: '3', capacity: 42, buildingId: 'b2' },
    { id: '4a', name: 'A', gradeId: '4', capacity: 45, buildingId: 'b2' },
    { id: '4b', name: 'B', gradeId: '4', capacity: 42, buildingId: 'b2' },
    { id: '5a', name: 'A', gradeId: '5', capacity: 45, buildingId: 'b2' },
    { id: '5b', name: 'B', gradeId: '5', capacity: 42, buildingId: 'b2' },
    { id: '6a', name: 'A', gradeId: '6', capacity: 45, buildingId: 'b2' },
    { id: '6b', name: 'B', gradeId: '6', capacity: 42, buildingId: 'b2' },
    { id: '7a', name: 'A', gradeId: '7', capacity: 45, buildingId: 'b2' },
    { id: '7b', name: 'B', gradeId: '7', capacity: 42, buildingId: 'b2' },
    { id: '8a', name: 'A', gradeId: '8', capacity: 40, buildingId: 'b2' },
    { id: '8b', name: 'B', gradeId: '8', capacity: 38, buildingId: 'b2' },
    { id: '9a', name: 'A', gradeId: '9', capacity: 40, buildingId: 'b2' },
    { id: '9b', name: 'B', gradeId: '9', capacity: 38, buildingId: 'b2' },
    { id: '10ga', name: 'A', gradeId: '10g', capacity: 35, buildingId: 'b2' },
    { id: '10gb', name: 'B', gradeId: '10g', capacity: 35, buildingId: 'b2' },
    { id: '11ga', name: 'A', gradeId: '11g', capacity: 35, buildingId: 'b2' },
    { id: '10ta', name: 'A', gradeId: '10t', capacity: 35, buildingId: 'b3' },
    { id: '10tb', name: 'B', gradeId: '10t', capacity: 35, buildingId: 'b3' },
    { id: '11ta', name: 'A', gradeId: '11t', capacity: 35, buildingId: 'b3' },
    { id: '12ta', name: 'A', gradeId: '12t', capacity: 30, buildingId: 'b3' }
  ];
  for (const s of sections) await db.collection('sections').doc(s.id).set(s);
  console.log(`Created ${sections.length} sections`);

  // Subjects
  const subjects = [
    { id: 'mat', name: 'Matemáticas' },
    { id: 'fis', name: 'Física' },
    { id: 'qui', name: 'Química' },
    { id: 'bio', name: 'Biología' },
    { id: 'esp', name: 'Español' },
    { id: 'lit', name: 'Literatura' },
    { id: 'ing', name: 'Inglés' },
    { id: 'his', name: 'Historia' },
    { id: 'geo', name: 'Geografía' },
    { id: 'civ', name: 'Cívica' },
    { id: 'inf', name: 'Informática' },
    { id: 'ef', name: 'Educación Física' },
    { id: 'mus', name: 'Música' },
    { id: 'art', name: 'Arte' },
    { id: 'rel', name: 'Religión' },
    { id: 'fil', name: 'Filosofía' }
  ];
  for (const s of subjects) await db.collection('subjects').doc(s.id).set(s);
  console.log(`Created ${subjects.length} subjects`);

  // Teachers
  const teachers = [
    { id: 't1', name: 'Prof. Roberto Henríquez', email: 'docente1@salesianosanjose.edu.sv', phone: '7012-3456', specialty: 'Matemáticas y Física', subjects: ['mat', 'fis'], schedule: '06:40 - 12:00', guideGradeId: '9', guideSectionId: '9a' },
    { id: 't2', name: 'Profra. Andrea Melara', email: 'docente2@salesianosanjose.edu.sv', phone: '7012-3457', specialty: 'Español y Literatura', subjects: ['esp', 'lit'], schedule: '06:40 - 12:00', guideGradeId: '10g', guideSectionId: '10ga' },
    { id: 't3', name: 'Prof. Carlos Martínez', email: 'docente3@salesianosanjose.edu.sv', phone: '7012-3458', specialty: 'Ciencias Naturales', subjects: ['bio', 'qui'], schedule: '06:40 - 12:00', guideGradeId: '8', guideSectionId: '8a' },
    { id: 't4', name: 'Profra. María López', email: 'docente4@salesianosanjose.edu.sv', phone: '7012-3459', specialty: 'Ciencias Sociales', subjects: ['his', 'geo', 'civ'], schedule: '06:40 - 12:00', guideGradeId: '7', guideSectionId: '7a' },
    { id: 't5', name: 'Prof. Jesús Ramírez', email: 'docente5@salesianosanjose.edu.sv', phone: '7012-3460', specialty: 'Idiomas', subjects: ['ing'], schedule: '06:40 - 12:00', guideGradeId: '2', guideSectionId: '2a' },
    { id: 't6', name: 'Profra. Ana García', email: 'docente6@salesianosanjose.edu.sv', phone: '7012-3461', specialty: 'Tecnología', subjects: ['inf'], schedule: '06:40 - 12:00', guideGradeId: '4', guideSectionId: '4a' },
    { id: 't7', name: 'Prof. Miguel Hernández', email: 'docente7@salesianosanjose.edu.sv', phone: '7012-3462', specialty: 'Educación Física', subjects: ['ef'], schedule: '06:40 - 12:00', guideGradeId: '9', guideSectionId: '9b' },
    { id: 't8', name: 'Profra. Patricia Vásquez', email: 'docente8@salesianosanjose.edu.sv', phone: '7012-3463', specialty: 'Arte y Música', subjects: ['mus', 'art'], schedule: '06:40 - 12:00', guideGradeId: '7', guideSectionId: '7b' },
    { id: 't9', name: 'Prof. Fernando Díaz', email: 'docente9@salesianosanjose.edu.sv', phone: '7012-3464', specialty: 'Orientación', subjects: ['rel', 'fil'], schedule: '06:40 - 12:00', guideGradeId: '11g', guideSectionId: '11ga' },
    { id: 't10', name: 'Profra. Claudia Reyes', email: 'docente10@salesianosanjose.edu.sv', phone: '7012-3465', specialty: 'Filosofía', subjects: ['fil'], schedule: '06:40 - 12:00' }
  ];
  for (const t of teachers) await db.collection('teachers').doc(t.id).set(t);
  console.log(`Created ${teachers.length} teachers`);

  // Students
  const students = [
    { id: 's01', name: 'Carlos Daniel Henríquez', gender: 'M', gradeId: '1', sectionId: '1a' },
    { id: 's02', name: 'Gabriela María Melara', gender: 'F', gradeId: '1', sectionId: '1a' },
    { id: 's03', name: 'Diego Alejandro Solís', gender: 'M', gradeId: '1', sectionId: '1a' },
    { id: 's04', name: 'Valeria Sofía Paz', gender: 'F', gradeId: '1', sectionId: '1a' },
    { id: 's05', name: 'Mateo Sebastián Castro', gender: 'M', gradeId: '1', sectionId: '1a' },
    { id: 's06', name: 'Camila Fernanda Ortiz', gender: 'F', gradeId: '1', sectionId: '1b' },
    { id: 's07', name: 'Nicolás Alberto Durán', gender: 'M', gradeId: '1', sectionId: '1b' },
    { id: 's08', name: 'Elena Beatriz Rivas', gender: 'F', gradeId: '1', sectionId: '1b' },
    { id: 's09', name: 'José Manuel Amaya', gender: 'M', gradeId: '2', sectionId: '2a' },
    { id: 's10', name: 'Daniela Alejandra Gómez', gender: 'F', gradeId: '2', sectionId: '2a' },
    { id: 's11', name: 'Andrés Felipe Martínez', gender: 'M', gradeId: '2', sectionId: '2a' },
    { id: 's12', name: 'Sofía Gabriela Rosa', gender: 'F', gradeId: '2', sectionId: '2b' },
    { id: 's13', name: 'Emilio José Contreras', gender: 'M', gradeId: '2', sectionId: '2b' },
    { id: 's14', name: 'Isabella María Guerrero', gender: 'F', gradeId: '2', sectionId: '2b' },
    { id: 's15', name: 'Roberto Carlos Méndez', gender: 'M', gradeId: '7', sectionId: '7a' },
    { id: 's16', name: 'Ana Lucía Ponce', gender: 'F', gradeId: '7', sectionId: '7a' },
    { id: 's17', name: 'Fernando Antonio Salazar', gender: 'M', gradeId: '7', sectionId: '7a' },
    { id: 's18', name: 'Gabriela Estefanía Rivas', gender: 'F', gradeId: '7', sectionId: '7a' },
    { id: 's19', name: 'Carlos Eduardo Peña', gender: 'M', gradeId: '7', sectionId: '7b' },
    { id: 's20', name: 'Daniela Mishell Avilés', gender: 'F', gradeId: '7', sectionId: '7b' },
    { id: 's21', name: 'Rodrigo Andrés Flores', gender: 'M', gradeId: '10g', sectionId: '10ga' },
    { id: 's22', name: 'Mariana Isabel Chicas', gender: 'F', gradeId: '10g', sectionId: '10ga' },
    { id: 's23', name: 'Fernando José Palacios', gender: 'M', gradeId: '10g', sectionId: '10ga' },
    { id: 's24', name: 'Sofía Alejandra Quintanilla', gender: 'F', gradeId: '10g', sectionId: '10ga' },
    { id: 's25', name: 'Daniel Eduardo Portillo', gender: 'M', gradeId: '10g', sectionId: '10gb' },
    { id: 's26', name: 'Lucía Valentina Merino', gender: 'F', gradeId: '10g', sectionId: '10gb' },
    { id: 's27', name: 'Gerardo Ernesto Alvarado', gender: 'M', gradeId: '10t', sectionId: '10ta' },
    { id: 's28', name: 'Natalia Estefanía Guardado', gender: 'F', gradeId: '10t', sectionId: '10ta' },
    { id: 's29', name: 'Josué Daniel Escalante', gender: 'M', gradeId: '10t', sectionId: '10ta' },
    { id: 's30', name: 'Carolina Michelle García', gender: 'F', gradeId: '10t', sectionId: '10ta' },
    { id: 's31', name: 'David Alejandro Umaña', gender: 'M', gradeId: '11t', sectionId: '11ta' },
    { id: 's32', name: 'Jessica Tatiana Martínez', gender: 'F', gradeId: '11t', sectionId: '11ta' },
    { id: 's33', name: 'Erick Adalberto Cruz', gender: 'M', gradeId: '11t', sectionId: '11ta' },
    { id: 's34', name: 'Ana Gabriela Ochoa', gender: 'F', gradeId: '11t', sectionId: '11ta' },
    { id: 's35', name: 'Bryan Alexander Interiano', gender: 'M', gradeId: '12t', sectionId: '12ta' },
    { id: 's36', name: 'Jennifer Vanessa Guzmán', gender: 'F', gradeId: '12t', sectionId: '12ta' }
  ];
  for (const s of students) await db.collection('students').doc(s.id).set(s);
  console.log(`Created ${students.length} students`);

  console.log('\nAll data seeded successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
