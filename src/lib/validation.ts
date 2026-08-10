// Validation utilities for Firestore documents

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// String validation
export function isValidString(value: string, minLength: number = 1, maxLength: number = 255): boolean {
  return typeof value === 'string' && value.trim().length >= minLength && value.trim().length <= maxLength;
}

// UID validation (Firebase UIDs are 28 characters, but internal IDs can be shorter)
export function isValidUID(uid: string): boolean {
  return typeof uid === 'string' && uid.length >= 2 && uid.length <= 36;
}

// Validate User data
export function validateUser(data: { uid: string; email: string; displayName: string; role: string | null }): ValidationResult {
  const errors: string[] = [];

  if (!isValidUID(data.uid)) {
    errors.push('Invalid UID format');
  }

  if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!isValidString(data.displayName, 2, 100)) {
    errors.push('Display name must be 2-100 characters');
  }

  if (data.role !== null) {
    const validRoles = [
      'admin', 'docente', 'alumno',
      'coordinacion', 'coordinacion_academica', 'coordinacion_convivencia',
      'coordinacion_primaria', 'coordinacion_parvularia',
      'registro_academico', 'enfermeria', 'psicopedagogico'
    ];
    if (!validRoles.includes(data.role)) {
      errors.push(`Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// Validate Grade data
export function validateGrade(data: { name: string; cycle: string; baccalaureateType?: string }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.name, 1, 50)) {
    errors.push('Grade name must be 1-50 characters');
  }

  const validCycles = ['parvularia', '1', '2', '3', '4'];
  if (!validCycles.includes(data.cycle)) {
    errors.push(`Invalid cycle. Must be one of: ${validCycles.join(', ')}`);
  }

  if (data.baccalaureateType && !['general', 'tecnico'].includes(data.baccalaureateType)) {
    errors.push('Invalid baccalaureate type');
  }

  return { valid: errors.length === 0, errors };
}

// Validate Section data
export function validateSection(data: { name: string; gradeId: string; capacity?: number }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.name, 1, 10)) {
    errors.push('Section name must be 1-10 characters');
  }

  if (!isValidString(data.gradeId, 1, 50)) {
    errors.push('Grade ID is required');
  }

  if (data.capacity !== undefined && (typeof data.capacity !== 'number' || data.capacity < 0 || data.capacity > 100)) {
    errors.push('Capacity must be a number between 0 and 100');
  }

  return { valid: errors.length === 0, errors };
}

// Validate Teacher data
export function validateTeacher(data: { name: string; email: string; phone?: string; specialty?: string; subjects?: string[]; status?: string }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.name, 2, 100)) {
    errors.push('El nombre del docente debe tener 2-100 caracteres');
  }

  if (!isValidEmail(data.email)) {
    errors.push('Formato de email inválido');
  }

  if (data.phone && !/^[\d\s\-\+\(\)]{7,20}$/.test(data.phone)) {
    errors.push('Formato de teléfono inválido');
  }

  if (data.subjects && !Array.isArray(data.subjects)) {
    errors.push('Las materias deben ser un array');
  }

  if (data.status && !['ACTIVO', 'INACTIVO'].includes(data.status)) {
    errors.push('Estado inválido. Debe ser ACTIVO o INACTIVO');
  }

  return { valid: errors.length === 0, errors };
}

// Validate Student data
export function validateStudent(data: { firstName: string; lastName: string; gradeId: string; sectionId: string }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.firstName, 2, 50)) {
    errors.push('First name must be 2-50 characters');
  }

  if (!isValidString(data.lastName, 2, 50)) {
    errors.push('Last name must be 2-50 characters');
  }

  if (!isValidString(data.gradeId, 1, 50)) {
    errors.push('Grade ID is required');
  }

  if (!isValidString(data.sectionId, 1, 50)) {
    errors.push('Section ID is required');
  }

  return { valid: errors.length === 0, errors };
}

// Validate Building data
export function validateBuilding(data: { name: string; code: string; color?: string }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.name, 2, 100)) {
    errors.push('Building name must be 2-100 characters');
  }

  if (!isValidString(data.code, 1, 10)) {
    errors.push('Building code must be 1-10 characters');
  }

  if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    errors.push('Invalid color format (must be hex color)');
  }

  return { valid: errors.length === 0, errors };
}

// Validate Subject data
export function validateSubject(data: { name: string; description?: string; cycle?: string; status?: string; weeklyHours?: number }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.name, 2, 100)) {
    errors.push('El nombre de la materia debe tener 2-100 caracteres');
  }

  if (data.description && data.description.length > 500) {
    errors.push('La descripción no puede exceder 500 caracteres');
  }

  const validCycles = ['parvularia', '1', '2', '3', '4'];
  if (data.cycle && !validCycles.includes(data.cycle)) {
    errors.push(`Ciclo inválido. Debe ser uno de: ${validCycles.join(', ')}`);
  }

  if (data.status && !['ACTIVO', 'INACTIVO'].includes(data.status)) {
    errors.push('Estado inválido. Debe ser ACTIVO o INACTIVO');
  }

  if (data.weeklyHours !== undefined && (typeof data.weeklyHours !== 'number' || data.weeklyHours < 1 || data.weeklyHours > 40)) {
    errors.push('Las horas semanales deben ser un número entre 1 y 40');
  }

  return { valid: errors.length === 0, errors };
}

// Validate Baccalaureate Type data
export function validateBaccalaureateType(data: { name: string; maxGrade: number }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.name, 2, 100)) {
    errors.push('El nombre del tipo de bachillerato debe tener 2-100 caracteres');
  }

  if (typeof data.maxGrade !== 'number' || data.maxGrade < 1 || data.maxGrade > 11) {
    errors.push('El grado máximo debe ser un número entre 1 y 11');
  }

  return { valid: errors.length === 0, errors };
}

// Validate Computer Lab data
export function validateComputerLab(data: { name: string; buildingId?: string; capacity?: number; devices?: number }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.name, 2, 100)) {
    errors.push('Lab name must be 2-100 characters');
  }

  if (data.buildingId && !isValidString(data.buildingId, 1, 50)) {
    errors.push('Invalid building ID');
  }

  if (data.capacity !== undefined && (typeof data.capacity !== 'number' || data.capacity < 0 || data.capacity > 100)) {
    errors.push('Capacity must be a number between 0 and 100');
  }

  if (data.devices !== undefined && (typeof data.devices !== 'number' || data.devices < 0 || data.devices > 100)) {
    errors.push('Devices must be a number between 0 and 100');
  }

  return { valid: errors.length === 0, errors };
}

// Validate Role Config data
export function validateRoleConfig(data: { id: string; name: string; permissions: string[] }): ValidationResult {
  const errors: string[] = [];

  if (!isValidString(data.id, 1, 50)) {
    errors.push('Role ID must be 1-50 characters');
  }

  if (!isValidString(data.name, 2, 100)) {
    errors.push('Role name must be 2-100 characters');
  }

  if (!Array.isArray(data.permissions)) {
    errors.push('Permissions must be an array');
  } else {
    const validModules = ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'];
    const invalidModules = data.permissions.filter(p => !validModules.includes(p));
    if (invalidModules.length > 0) {
      errors.push(`Invalid modules: ${invalidModules.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// Generic validation helper
export function validate(data: unknown, validator: (data: any) => ValidationResult): void {
  const result = validator(data);
  if (!result.valid) {
    throw new Error(`Validation failed: ${result.errors.join('; ')}`);
  }
}