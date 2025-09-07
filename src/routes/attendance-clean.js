const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/attendanceController');
const { validate } = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');
const { attendanceSchemas } = require('../validators');

// ===== SPECIFIC ROUTES (must come before parametric routes) =====

/**
 * @route GET /api/attendance/my-status
 * @desc Get today's attendance status for current user
 * @access Private - Admin, Teacher, Student
 */
router.get('/my-status',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  attendanceController.getTodayAttendanceStatus
);

/**
 * @route GET /api/attendance/my-attendance
 * @desc Get attendance records for current user
 * @access Private - Admin, Teacher, Student
 */
router.get('/my-attendance',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validate(attendanceSchemas.getAttendance, 'query'),
  attendanceController.getMyAttendance
);

/**
 * @route POST /api/attendance/my-attendance
 * @desc Record attendance for current user (simplified endpoint)
 * @access Private - Admin, Teacher, Student
 */
router.post('/my-attendance',
  authenticate,
  authorize('admin', 'teacher', 'student'),
  validate(attendanceSchemas.recordAttendance),
  attendanceController.recordMyAttendance
);

/**
 * @route GET /api/attendance/summary
 * @desc Get attendance summary statistics
 * @access Private - Admin, Teacher
 */
router.get('/summary',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.getAttendanceReport, 'query'),
  attendanceController.getAttendanceSummary
);

/**
 * @route GET /api/attendance/report
 * @desc Get detailed attendance report
 * @access Private - Admin, Teacher
 */
router.get('/report',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.getAttendanceReport, 'query'),
  attendanceController.getAttendanceReport
);

/**
 * @route GET /api/attendance/teachers
 * @desc Get all teacher attendance records
 * @access Private - Admin, Teacher
 */
router.get('/teachers',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.getAttendance, 'query'),
  attendanceController.getAllTeacherAttendance
);

/**
 * @route GET /api/attendance/students
 * @desc Get all student attendance records
 * @access Private - Admin, Teacher
 */
router.get('/students',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.getAttendance, 'query'),
  attendanceController.getAllStudentAttendance
);

/**
 * @route GET /api/attendance/stats
 * @desc Get attendance statistics
 * @access Private - Admin, Teacher
 */
router.get('/stats',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.getAttendanceReport, 'query'),
  attendanceController.getAttendanceStats
);

/**
 * @route GET /api/attendance/daily-report/:date
 * @desc Get daily attendance report for specific date
 * @access Private - Admin, Teacher
 */
router.get('/daily-report/:date',
  authenticate,
  authorize('admin', 'teacher'),
  attendanceController.getDailyReport
);

// ===== PARAMETRIC ROUTES (must come after specific routes) =====

/**
 * @route GET /api/attendance/teachers/:teacherId
 * @desc Get attendance records for specific teacher
 * @access Private - Admin, Teacher
 */
router.get('/teachers/:teacherId',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.getAttendance, 'query'),
  attendanceController.getTeacherAttendance
);

/**
 * @route GET /api/attendance/students/:studentId
 * @desc Get attendance records for specific student
 * @access Private - Admin, Teacher
 */
router.get('/students/:studentId',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.getAttendance, 'query'),
  attendanceController.getStudentAttendance
);

/**
 * @route POST /api/attendance/bulk-record
 * @desc Record multiple attendance records at once
 * @access Private - Admin, Teacher
 */
router.post('/bulk-record',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.bulkRecordAttendance),
  attendanceController.bulkRecordAttendance
);

/**
 * @route POST /api/attendance/record/teacher/:teacherId
 * @desc Record attendance for specific teacher
 * @access Private - Admin, Teacher
 */
router.post('/record/teacher/:teacherId',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.recordAttendance),
  attendanceController.recordTeacherAttendance
);

/**
 * @route POST /api/attendance/record/student/:studentId
 * @desc Record attendance for specific student
 * @access Private - Admin, Teacher
 */
router.post('/record/student/:studentId',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.recordAttendance),
  attendanceController.recordStudentAttendance
);

/**
 * @route PUT /api/attendance/:attendanceId
 * @desc Update attendance record
 * @access Private - Admin, Teacher (own records)
 */
router.put('/:attendanceId',
  authenticate,
  authorize('admin', 'teacher'),
  validate(attendanceSchemas.updateAttendance),
  attendanceController.updateAttendanceRecord
);

/**
 * @route DELETE /api/attendance/:attendanceId
 * @desc Delete attendance record
 * @access Private - Admin
 */
router.delete('/:attendanceId',
  authenticate,
  authorize('admin'),
  attendanceController.deleteAttendanceRecord
);

module.exports = router;
