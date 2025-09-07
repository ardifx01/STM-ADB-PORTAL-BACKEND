const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { scheduleSchemas, commonValidations } = require('../validators');

// Validation schemas for params
const paramsValidation = {
  id: require('joi').object({
    id: commonValidations.id
  }),
  classId: require('joi').object({
    classId: commonValidations.id
  }),
  teacherId: require('joi').object({
    teacherId: commonValidations.id
  })
};

const queryValidation = {
  list: require('joi').object({
    page: require('joi').number().integer().min(1).default(1),
    limit: require('joi').number().integer().min(1).max(100).default(10),
    class_id: require('joi').string().pattern(/^\d+$/).optional(),
    teacher_id: require('joi').string().pattern(/^\d+$/).optional(),
    subject_id: require('joi').string().pattern(/^\d+$/).optional(),
    day_of_week: require('joi').string().valid('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu').optional(),
    room: require('joi').string().max(50).optional(),
    sort_by: require('joi').string().valid('day_of_week', 'time', 'class_name', 'subject_name', 'teacher_name').default('day_of_week'),
    sort_order: require('joi').string().valid('asc', 'desc').default('asc')
  }),
  weekly: require('joi').object({
    class_id: require('joi').string().pattern(/^\d+$/).optional(),
    teacher_id: require('joi').string().pattern(/^\d+$/).optional()
  }),
  conflictCheck: require('joi').object({
    exclude_id: require('joi').string().pattern(/^\d+$/).optional()
  })
};

/**
 * @route GET /api/schedules
 * @desc Get all schedules with pagination and filtering
 * @access Private (Admin, Teacher)
 */
router.get('/',
  authenticate,
  authorize('admin', 'teacher'),
  validate(queryValidation.list, 'query'),
  scheduleController.getSchedules
);

/**
 * @route GET /api/schedules/stats
 * @desc Get schedule statistics
 * @access Private (Admin, Teacher)
 */
router.get('/stats',
  authenticate,
  authorize('admin', 'teacher'),
  scheduleController.getScheduleStatistics
);

/**
 * @route GET /api/schedules/weekly
 * @desc Get weekly schedule view
 * @access Private (Admin, Teacher, Student)
 */
router.get('/weekly',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validate(queryValidation.weekly, 'query'),
  scheduleController.getWeeklySchedule
);

/**
 * @route POST /api/schedules/check-conflicts
 * @desc Check for schedule conflicts
 * @access Private (Admin, Teacher)
 */
router.post('/check-conflicts',
  authenticate,
  authorize('admin', 'teacher'),
  validate(scheduleSchemas.conflictCheck, 'body'),
  validate(queryValidation.conflictCheck, 'query'),
  scheduleController.checkScheduleConflicts
);

/**
 * @route GET /api/schedules/class/:classId
 * @desc Get schedules by class
 * @access Private (Admin, Teacher)
 */
router.get('/class/:classId',
  authenticate,
  authorize('admin', 'teacher'),
  validate(paramsValidation.classId, 'params'),
  scheduleController.getSchedulesByClass
);

/**
 * @route GET /api/schedules/teacher/:teacherId
 * @desc Get schedules by teacher
 * @access Private (Admin, Teacher - own schedules)
 */
router.get('/teacher/:teacherId',
  authenticate,
  authorize('admin', 'teacher'),
  validate(paramsValidation.teacherId, 'params'),
  scheduleController.getSchedulesByTeacher
);

/**
 * @route GET /api/schedules/:id
 * @desc Get schedule by ID
 * @access Private (Admin, Teacher)
 */
router.get('/:id',
  authenticate,
  authorize('admin', 'teacher'),
  validate(paramsValidation.id, 'params'),
  scheduleController.getScheduleById
);

/**
 * @route POST /api/schedules
 * @desc Create new schedule
 * @access Private (Admin only)
 */
router.post('/',
  authenticate,
  authorize('admin'),
  validate(scheduleSchemas.create, 'body'),
  scheduleController.createSchedule
);

/**
 * @route PUT /api/schedules/:id
 * @desc Update schedule
 * @access Private (Admin only)
 */
router.put('/:id',
  authenticate,
  authorize('admin'),
  validate(paramsValidation.id, 'params'),
  validate(scheduleSchemas.update, 'body'),
  scheduleController.updateSchedule
);

/**
 * @route DELETE /api/schedules/:id
 * @desc Delete schedule
 * @access Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  validate(paramsValidation.id, 'params'),
  scheduleController.deleteSchedule
);

module.exports = router;
