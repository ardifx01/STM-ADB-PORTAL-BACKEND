const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { studentSchemas, commonValidations } = require('../validators');

// Validation schemas for params
const paramsValidation = {
  id: require('joi').object({
    id: commonValidations.id
  }),
  classId: require('joi').object({
    classId: commonValidations.id
  })
};

const queryValidation = {
  list: require('joi').object({
    page: require('joi').number().integer().min(1).default(1),
    limit: require('joi').number().integer().min(1).max(100).default(10),
    search: require('joi').string().min(1).max(255).optional(),
    status: require('joi').string().valid('AKTIF', 'LULUS', 'PINDAH', 'DO').optional(),
    class_id: require('joi').string().pattern(/^\d+$/).optional(),
    gender: require('joi').string().valid('L', 'P').optional(),
    sort_by: require('joi').string().valid('full_name', 'nis', 'status', 'username', 'class_name').default('full_name'),
    sort_order: require('joi').string().valid('asc', 'desc').default('asc')
  }),
  search: require('joi').object({
    q: require('joi').string().min(2).max(255).required()
  })
};

const bodyValidation = {
  assignToClass: require('joi').object({
    class_id: commonValidations.id
  })
};

/**
 * @route GET /api/students
 * @desc Get all students with pagination and filtering
 * @access Private (Admin, Teacher)
 */
router.get('/',
  authenticate,
  authorize('admin', 'teacher'),
  validate(queryValidation.list, 'query'),
  studentController.getAllStudents
);

/**
 * @route GET /api/students/stats
 * @desc Get student statistics
 * @access Private (Admin, Teacher)
 */
router.get('/stats',
  authenticate,
  authorize('admin', 'teacher'),
  studentController.getStudentStats
);

/**
 * @route GET /api/students/available-users
 * @desc Get available users for student profile creation
 * @access Private (Admin only)
 */
router.get('/available-users',
  authenticate,
  authorize('admin'),
  studentController.getAvailableUsers
);

/**
 * @route GET /api/students/search
 * @desc Search students by various criteria
 * @access Private (Admin, Teacher, Student - own profile)
 */
router.get('/search',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validate(queryValidation.search, 'query'),
  studentController.searchStudents
);

/**
 * @route GET /api/students/class/:classId
 * @desc Get students by class
 * @access Private (Admin, Teacher)
 */
router.get('/class/:classId',
  authenticate,
  authorize('admin', 'teacher'),
  validate(paramsValidation.classId, 'params'),
  studentController.getStudentsByClass
);

/**
 * @route GET /api/students/:id
 * @desc Get student by ID
 * @access Private (Admin, Teacher, Student - own profile)
 */
router.get('/:id',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validate(paramsValidation.id, 'params'),
  studentController.getStudentById
);

/**
 * @route POST /api/students
 * @desc Create new student
 * @access Private (Admin only)
 */
router.post('/',
  authenticate,
  authorize('admin'),
  validate(studentSchemas.create, 'body'),
  studentController.createStudent
);

/**
 * @route PUT /api/students/:id
 * @desc Update student
 * @access Private (Admin, Student - own profile)
 */
router.put('/:id',
  authenticate,
  authorize('admin', 'student'),
  validate(paramsValidation.id, 'params'),
  validate(studentSchemas.update, 'body'),
  studentController.updateStudent
);

/**
 * @route DELETE /api/students/:id
 * @desc Delete student
 * @access Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  validate(paramsValidation.id, 'params'),
  studentController.deleteStudent
);

/**
 * @route POST /api/students/:id/assign-class
 * @desc Assign student to class
 * @access Private (Admin only)
 */
router.post('/:id/assign-class',
  authenticate,
  authorize('admin'),
  validate(paramsValidation.id, 'params'),
  validate(bodyValidation.assignToClass, 'body'),
  studentController.assignToClass
);

/**
 * @route DELETE /api/students/:id/remove-class
 * @desc Remove student from class
 * @access Private (Admin only)
 */
router.delete('/:id/remove-class',
  authenticate,
  authorize('admin'),
  validate(paramsValidation.id, 'params'),
  studentController.removeFromClass
);

module.exports = router;
