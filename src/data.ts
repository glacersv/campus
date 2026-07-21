import { Grade, Teacher, Student } from './types';

export const GRADES: Grade[] = [
  { id: '9a', name: '9° Grado "A"', teacherId: 't1' },
  { id: '1ba', name: '1° Año Bachillerato "A"', teacherId: 't2' }
];

export const TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'Prof. Roberto Henríquez',
    email: 'docente1@salesianosanjose.edu.sv',
    gradeId: '9a',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 't2',
    name: 'Profra. Andrea Melara',
    email: 'docente2@salesianosanjose.edu.sv',
    gradeId: '1ba',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  }
];

export const STUDENTS: Student[] = [
  // 9° Grado "A"
  { id: 's01', name: 'Carlos Daniel Henríquez', gender: 'M', gradeId: '9a' },
  { id: 's02', name: 'Gabriela María Melara', gender: 'F', gradeId: '9a' },
  { id: 's03', name: 'Diego Alejandro Solís', gender: 'M', gradeId: '9a' },
  { id: 's04', name: 'Valeria Sofía Paz', gender: 'F', gradeId: '9a' },
  { id: 's05', name: 'Mateo Sebastián Castro', gender: 'M', gradeId: '9a' },
  { id: 's06', name: 'Camila Fernanda Ortiz', gender: 'F', gradeId: '9a' },
  { id: 's07', name: 'Nicolás Alberto Durán', gender: 'M', gradeId: '9a' },
  { id: 's08', name: 'Elena Beatriz Rivas', gender: 'F', gradeId: '9a' },
  { id: 's09', name: 'José Manuel Amaya', gender: 'M', gradeId: '9a' },
  { id: 's10', name: 'Daniela Alejandra Gómez', gender: 'F', gradeId: '9a' },

  // 1° Año Bachillerato "A"
  { id: 's21', name: 'Rodrigo Andrés Flores', gender: 'M', gradeId: '1ba' },
  { id: 's22', name: 'Mariana Isabel Chicas', gender: 'F', gradeId: '1ba' },
  { id: 's23', name: 'Fernando José Palacios', gender: 'M', gradeId: '1ba' },
  { id: 's24', name: 'Sofía Alejandra Quintanilla', gender: 'F', gradeId: '1ba' },
  { id: 's25', name: 'Daniel Eduardo Portillo', gender: 'M', gradeId: '1ba' },
  { id: 's26', name: 'Lucía Valentina Merino', gender: 'F', gradeId: '1ba' },
  { id: 's27', name: 'Gerardo Ernesto Alvarado', gender: 'M', gradeId: '1ba' },
  { id: 's28', name: 'Natalia Estefanía Guardado', gender: 'F', gradeId: '1ba' },
  { id: 's29', name: 'William Alexánder Ramos', gender: 'M', gradeId: '1ba' },
  { id: 's30', name: 'Adriana Gisselle Vásquez', gender: 'F', gradeId: '1ba' }
];
