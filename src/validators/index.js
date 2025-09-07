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

// Subject validation schemas
const subjectSchemas = {
  create: Joi.object({
    subject_name: Joi.string().min(2).max(255).required(),
    subject_code: Joi.string().min(2).max(20).required(),
  }),
  
  update: Joi.object({
    subject_name: Joi.string().min(2).max(255).optional(),
    subject_code: Joi.string().min(2).max(20).optional(),
  }),
  
  list: Joi.object({
    ...commonValidations.pagination,
    search: commonValidations.search,
    sortBy: Joi.string().valid('subject_name', 'subject_code', 'id').default('subject_name'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
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
    grade_level: Joi.number().integer().min(1).max(12).optional(),
    major: Joi.string().max(100).optional(),
    homeroom_teacher_id: commonValidations.optionalId,
    has_homeroom_teacher: Joi.boolean().optional(),
    search: Joi.string().max(100).optional(),
  }),
  
  assignStudent: Joi.object({
    student_id: commonValidations.id.required(),
  }),
  
  removeStudent: Joi.object({
    student_id: commonValidations.id.required(),
  }),
};

// Attendance validation schemas
const attendanceSchemas = {
  recordTeacherAttendance: Joi.object({
    status: commonValidations.enum(['Masuk', 'Pulang']).required(),
    location_coordinates: Joi.string().max(100).optional().allow(null),
    photo_path: Joi.string().max(255).optional().allow(null),
  }),

  recordStudentAttendance: Joi.object({
    scheduleId: commonValidations.id,
    status: commonValidations.enum(['Masuk', 'Pulang']).required(),
    location_coordinates: Joi.string().max(100).optional().allow(null),
  }),

  getAttendance: Joi.object({
    teacher_id: commonValidations.optionalId,
    student_id: commonValidations.optionalId,
    class_id: commonValidations.optionalId,
    status: commonValidations.enum(['Masuk', 'Pulang']).optional(),
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
    page: commonValidations.pagination.page,
    limit: commonValidations.pagination.limit,
  }),

  getAttendanceSummary: Joi.object({
    date: Joi.date().iso().required(),
    type: commonValidations.enum(['all', 'teacher', 'student']).default('all'),
  }),

  getAttendanceReport: Joi.object({
    type: commonValidations.enum(['teacher', 'student']).default('student'),
    class_id: commonValidations.optionalId,
    teacher_id: commonValidations.optionalId,
    student_id: commonValidations.optionalId,
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
    group_by: commonValidations.enum(['day', 'week', 'month']).default('day'),
  }),

  recordAttendance: Joi.object({
    status: commonValidations.enum(['Masuk', 'Pulang']).required(),
    location_coordinates: Joi.string().max(100).optional().allow(null),
    photo_path: Joi.string().max(255).optional().allow(null),
    scheduleId: commonValidations.optionalId, // Required for students, optional for teachers
  }),

  recordMyAttendance: Joi.object({
    status: commonValidations.enum(['Masuk', 'Pulang']).required(),
    location_coordinates: Joi.string().max(100).optional().allow(null),
    photo_path: Joi.string().max(255).optional().allow(null),
    scheduleId: commonValidations.optionalId, // Required for students, optional for teachers
  }),

  bulkRecordAttendance: Joi.object({
    records: Joi.array().items(
      Joi.object({
        type: commonValidations.enum(['teacher', 'student']).required(),
        teacher_id: Joi.when('type', {
          is: 'teacher',
          then: commonValidations.id.required(),
          otherwise: Joi.forbidden()
        }),
        student_id: Joi.when('type', {
          is: 'student',
          then: commonValidations.id.required(),
          otherwise: Joi.forbidden()
        }),
        schedule_id: Joi.when('type', {
          is: 'student',
          then: commonValidations.id.required(),
          otherwise: Joi.forbidden()
        }),
        status: commonValidations.enum(['Masuk', 'Pulang']).required(),
        location_coordinates: Joi.string().max(100).optional().allow(null),
        photo_path: Joi.string().max(255).optional().allow(null),
      })
    ).min(1).required()
  }),

  updateAttendance: Joi.object({
    status: commonValidations.enum(['Masuk', 'Pulang']).optional(),
    location_coordinates: Joi.string().max(100).optional().allow(null),
    photo_path: Joi.string().max(255).optional().allow(null),
  }),
};

// Schedule validation schemas
const scheduleSchemas = {
  create: Joi.object({
    class_id: commonValidations.id,
    subject_id: commonValidations.id,
    teacher_id: commonValidations.id,
    day_of_week: commonValidations.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']).required(),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'Start time must be in HH:MM:SS format'
    }),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'End time must be in HH:MM:SS format'
    }),
    room: Joi.string().max(50).optional().allow(null),
  }),
  
  update: Joi.object({
    class_id: commonValidations.optionalId,
    subject_id: commonValidations.optionalId,
    teacher_id: commonValidations.optionalId,
    day_of_week: commonValidations.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']).optional(),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages({
      'string.pattern.base': 'Start time must be in HH:MM:SS format'
    }),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages({
      'string.pattern.base': 'End time must be in HH:MM:SS format'
    }),
    room: Joi.string().max(50).optional().allow(null),
  }),
  
  list: Joi.object({
    ...commonValidations.pagination,
    class_id: commonValidations.optionalId,
    teacher_id: commonValidations.optionalId,
    subject_id: commonValidations.optionalId,
    day_of_week: commonValidations.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']).optional(),
    room: Joi.string().max(50).optional(),
    sort_by: commonValidations.enum(['day_of_week', 'time', 'class_name', 'subject_name', 'teacher_name']).default('day_of_week'),
    sort_order: commonValidations.enum(['asc', 'desc']).default('asc'),
  }),
  
  conflictCheck: Joi.object({
    class_id: commonValidations.id,
    teacher_id: commonValidations.id,
    day_of_week: commonValidations.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']).required(),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
    room: Joi.string().max(50).optional().allow(null),
  }),
};

// Journal validation schemas
const journalSchemas = {
  create: Joi.object({
    schedule_id: commonValidations.id.required(),
    teaching_date: Joi.date().iso().required().messages({
      'date.format': 'Teaching date must be in ISO format (YYYY-MM-DD)',
    }),
    topic: Joi.string().min(5).max(1000).required().messages({
      'string.min': 'Topic must be at least 5 characters long',
      'string.max': 'Topic must not exceed 1000 characters'
    }),
    student_attendance_summary: Joi.string().max(255).optional().allow(null),
    notes: Joi.string().max(2000).optional().allow(null),
  }),

  update: Joi.object({
    teaching_date: Joi.date().iso().optional().messages({
      'date.format': 'Teaching date must be in ISO format (YYYY-MM-DD)',
    }),
    topic: Joi.string().min(5).max(1000).optional().messages({
      'string.min': 'Topic must be at least 5 characters long',
      'string.max': 'Topic must not exceed 1000 characters'
    }),
    student_attendance_summary: Joi.string().max(255).optional().allow(null),
    notes: Joi.string().max(2000).optional().allow(null),
  }),

  list: Joi.object({
    ...commonValidations.pagination,
    teacher_id: commonValidations.optionalId,
    class_id: commonValidations.optionalId,
    subject_id: commonValidations.optionalId,
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
    search: commonValidations.search,
    sort_by: commonValidations.enum(['teaching_date', 'topic', 'created_at']).default('teaching_date'),
    sort_order: commonValidations.enum(['asc', 'desc']).default('desc'),
  }),

  stats: Joi.object({
    teacher_id: commonValidations.optionalId,
    class_id: commonValidations.optionalId,
    subject_id: commonValidations.optionalId,
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
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
  scheduleSchemas,
  journalSchemas,
};
