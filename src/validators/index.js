const Joi = require('joi');

// Common validation patterns
const commonValidations = {
  id: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'ID must be a valid number',
    'any.required': 'ID is required'
  }),
  
  optionalId: Joi.string().pattern(/^\d+$/).optional().messages({
    'string.pattern.base': 'ID must be a valid number'
  }),
  
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  },
  
  search: Joi.string().min(1).max(255).optional(),
  
  date: Joi.date().iso().messages({
    'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
  }),
  
  phone: Joi.string().pattern(/^(\+62|62|0)8[1-9][0-9]{6,9}$/).optional().messages({
    'string.pattern.base': 'Phone number must be a valid Indonesian phone number'
  }),
  
  enum: (values) => Joi.string().valid(...values).messages({
    'any.only': `Value must be one of: ${values.join(', ')}`
  }),
};

// Auth validation schemas
const authSchemas = {
  login: Joi.object({
    username: Joi.string().min(3).max(100).required(),
    password: Joi.string().min(6).required(),
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Confirm password must match new password'
    }),
  }),
  
  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

// User validation schemas
const userSchemas = {
  create: Joi.object({
    username: Joi.string().min(3).max(100).required(),
    password: Joi.string().min(6).required(),
    role: commonValidations.enum(['admin', 'teacher', 'student', 'staff']).required(),
    is_active: Joi.boolean().default(true),
  }),
  
  update: Joi.object({
    username: Joi.string().min(3).max(100).optional(),
    role: commonValidations.enum(['admin', 'teacher', 'student', 'staff']).optional(),
    is_active: Joi.boolean().optional(),
  }),
  
  list: Joi.object({
    ...commonValidations.pagination,
    search: commonValidations.search,
    role: commonValidations.enum(['admin', 'teacher', 'student', 'staff']).optional(),
    is_active: Joi.boolean().optional(),
  }),
};

// Teacher validation schemas
const teacherSchemas = {
  create: Joi.object({
    user_id: commonValidations.id,
    nip: Joi.string().length(18).optional().allow(null),
    nik: Joi.string().length(16).optional().allow(null),
    full_name: Joi.string().min(2).max(255).required(),
    phone_number: commonValidations.phone,
    employment_status: commonValidations.enum(['ASN', 'GTT', 'PTT', 'Tetap']).required(),
  }),
  
  update: Joi.object({
    nip: Joi.string().length(18).optional().allow(null),
    nik: Joi.string().length(16).optional().allow(null),
    full_name: Joi.string().min(2).max(255).optional(),
    phone_number: commonValidations.phone,
    employment_status: commonValidations.enum(['ASN', 'GTT', 'PTT', 'Tetap']).optional(),
  }),
  
  list: Joi.object({
    ...commonValidations.pagination,
    search: commonValidations.search,
    employment_status: commonValidations.enum(['ASN', 'GTT', 'PTT', 'Tetap']).optional(),
  }),
};

// Student validation schemas
const studentSchemas = {
  create: Joi.object({
    user_id: commonValidations.id,
    current_class_id: commonValidations.optionalId,
    nis: Joi.string().max(16).required(),
    nisn: Joi.string().length(10).optional().allow(null),
    full_name: Joi.string().min(2).max(255).required(),
    gender: commonValidations.enum(['L', 'P']).required(),
    address: Joi.string().max(1000).optional().allow(null),
    phone_number: commonValidations.phone,
    status: commonValidations.enum(['AKTIF', 'LULUS', 'PINDAH', 'DO']).default('AKTIF'),
    rfid_uid: Joi.string().max(100).optional().allow(null),
  }),
  
  update: Joi.object({
    current_class_id: commonValidations.optionalId,
    nis: Joi.string().max(16).optional(),
    nisn: Joi.string().length(10).optional().allow(null),
    full_name: Joi.string().min(2).max(255).optional(),
    gender: commonValidations.enum(['L', 'P']).optional(),
    address: Joi.string().max(1000).optional().allow(null),
    phone_number: commonValidations.phone,
    status: commonValidations.enum(['AKTIF', 'LULUS', 'PINDAH', 'DO']).optional(),
    rfid_uid: Joi.string().max(100).optional().allow(null),
  }),
  
  list: Joi.object({
    ...commonValidations.pagination,
    search: commonValidations.search,
    class_id: commonValidations.optionalId,
    status: commonValidations.enum(['AKTIF', 'LULUS', 'PINDAH', 'DO']).optional(),
    gender: commonValidations.enum(['L', 'P']).optional(),
  }),
};

// Class validation schemas
const classSchemas = {
  create: Joi.object({
    class_name: Joi.string().min(1).max(100).required(),
    grade_level: Joi.number().integer().min(1).max(12).required(),
    major: Joi.string().max(100).optional().allow(null),
    homeroom_teacher_id: commonValidations.optionalId,
    counselor_id: commonValidations.optionalId,
  }),
  
  update: Joi.object({
    class_name: Joi.string().min(1).max(100).optional(),
    grade_level: Joi.number().integer().min(1).max(12).optional(),
    major: Joi.string().max(100).optional().allow(null),
    homeroom_teacher_id: commonValidations.optionalId,
    counselor_id: commonValidations.optionalId,
  }),
  
  list: Joi.object({
    ...commonValidations.pagination,
    search: commonValidations.search,
    grade_level: Joi.number().integer().min(1).max(12).optional(),
  }),
};

// Subject validation schemas
const subjectSchemas = {
  create: Joi.object({
    subject_code: Joi.string().min(1).max(20).required(),
    subject_name: Joi.string().min(1).max(255).required(),
  }),
  
  update: Joi.object({
    subject_code: Joi.string().min(1).max(20).optional(),
    subject_name: Joi.string().min(1).max(255).optional(),
  }),
  
  list: Joi.object({
    ...commonValidations.pagination,
    search: commonValidations.search,
  }),
};

// Attendance validation schemas
const attendanceSchemas = {
  create: Joi.object({
    student_id: commonValidations.id.optional(),
    teacher_id: commonValidations.id.optional(),
    timestamp: Joi.date().iso().default(() => new Date()),
    status: commonValidations.enum(['Masuk', 'Pulang']).required(),
    location_coordinates: Joi.string().max(100).optional().allow(null),
    photo_path: Joi.string().max(255).optional().allow(null),
  }).xor('student_id', 'teacher_id'), // Either student_id or teacher_id, not both
  
  list: Joi.object({
    ...commonValidations.pagination,
    student_id: commonValidations.optionalId,
    teacher_id: commonValidations.optionalId,
    date_from: commonValidations.date.optional(),
    date_to: commonValidations.date.optional(),
    status: commonValidations.enum(['Masuk', 'Pulang']).optional(),
  }),
};

module.exports = {
  commonValidations,
  authSchemas,
  userSchemas,
  teacherSchemas,
  studentSchemas,
  classSchemas,
  subjectSchemas,
  attendanceSchemas,
};
