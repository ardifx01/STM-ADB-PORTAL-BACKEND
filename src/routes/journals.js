const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { journalSchemas, commonValidations } = require('../validators');

// Validation schemas for params
const paramsValidation = {
  id: require('joi').object({
    id: commonValidations.id
  }),
  teacherId: require('joi').object({
    teacherId: commonValidations.id
  }),
  classId: require('joi').object({
    classId: commonValidations.id
  }),
  subjectId: require('joi').object({
    subjectId: commonValidations.id
  })
};

// Authentication required for all journal routes
router.use(authenticate);

// ===== SPECIFIC ROUTES (must come before parametric routes) =====

/**
 * @route   GET /api/journals/my-journals
 * @desc    Get current teacher's journals
 * @access  Private (Teacher only)
 */
router.get('/my-journals',
  authorize('teacher'),
  validate(journalSchemas.list, 'query'),
  journalController.getMyJournals
);

/**
 * @route   GET /api/journals/stats
 * @desc    Get journal statistics
 * @access  Private (Admin/Teacher)
 */
router.get('/stats',
  authorize('admin', 'teacher'),
  validate(journalSchemas.stats, 'query'),
  journalController.getJournalStats
);

/**
 * @route   GET /api/journals
 * @desc    Get all teaching journals with filtering
 * @access  Private (Admin/Teacher)
 */
router.get('/',
  authorize('admin', 'teacher'),
  validate(journalSchemas.list, 'query'),
  journalController.getAllJournals
);

/**
 * @route   POST /api/journals
 * @desc    Create new teaching journal
 * @access  Private (Teacher only)
 */
router.post('/',
  authorize('teacher'),
  validate(journalSchemas.create),
  journalController.createJournal
);

// ===== PARAMETRIC ROUTES (must come after specific routes) =====

/**
 * @route   GET /api/journals/teacher/:teacherId
 * @desc    Get journals for specific teacher
 * @access  Private (Admin/Teacher)
 */
router.get('/teacher/:teacherId',
  authorize('admin', 'teacher'),
  validate(paramsValidation.teacherId, 'params'),
  validate(journalSchemas.list, 'query'),
  journalController.getJournalsByTeacher
);

/**
 * @route   GET /api/journals/class/:classId
 * @desc    Get journals for specific class
 * @access  Private (Admin/Teacher)
 */
router.get('/class/:classId',
  authorize('admin', 'teacher'),
  validate(paramsValidation.classId, 'params'),
  validate(journalSchemas.list, 'query'),
  journalController.getJournalsByClass
);

/**
 * @route   GET /api/journals/subject/:subjectId
 * @desc    Get journals for specific subject
 * @access  Private (Admin/Teacher)
 */
router.get('/subject/:subjectId',
  authorize('admin', 'teacher'),
  validate(paramsValidation.subjectId, 'params'),
  validate(journalSchemas.list, 'query'),
  journalController.getJournalsBySubject
);

/**
 * @route   GET /api/journals/:id
 * @desc    Get journal by ID
 * @access  Private (Admin/Teacher)
 */
router.get('/:id',
  authorize('admin', 'teacher'),
  validate(paramsValidation.id, 'params'),
  journalController.getJournalById
);

/**
 * @route   PUT /api/journals/:id
 * @desc    Update teaching journal
 * @access  Private (Teacher only - own journals or Admin)
 */
router.put('/:id',
  authorize('admin', 'teacher'),
  validate(paramsValidation.id, 'params'),
  validate(journalSchemas.update),
  journalController.updateJournal
);

/**
 * @route   DELETE /api/journals/:id
 * @desc    Delete teaching journal
 * @access  Private (Teacher only - own journals or Admin)
 */
router.delete('/:id',
  authorize('admin', 'teacher'),
  validate(paramsValidation.id, 'params'),
  journalController.deleteJournal
);

module.exports = router;
