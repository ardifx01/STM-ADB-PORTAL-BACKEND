const express = require('express');
const Joi = require('joi');
const subjectController = require('../controllers/subjectController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { subjectSchemas, commonValidations } = require('../validators');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/subjects/stats
 * @desc    Get subject statistics
 * @access  Private (Admin/Teacher)
 */
router.get('/stats', authorize('admin', 'teacher'), subjectController.getSubjectStats);

/**
 * @route   GET /api/subjects
 * @desc    Get all subjects with pagination and filters
 * @access  Private (Admin/Teacher)
 */
router.get('/', authorize('admin', 'teacher'), validateQuery(subjectSchemas.list), subjectController.getSubjects);

/**
 * @route   POST /api/subjects
 * @desc    Create new subject
 * @access  Private (Admin only)
 */
router.post('/', authorize('admin'), validateBody(subjectSchemas.create), subjectController.createSubject);

/**
 * @route   GET /api/subjects/:id
 * @desc    Get subject by ID
 * @access  Private (Admin/Teacher)
 */
router.get('/:id', authorize('admin', 'teacher'), validateParams(Joi.object({ id: commonValidations.id })), subjectController.getSubjectById);

/**
 * @route   PUT /api/subjects/:id
 * @desc    Update subject
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authorize('admin'),
  validateParams(Joi.object({ id: commonValidations.id })),
  validateBody(subjectSchemas.update),
  subjectController.updateSubject
);

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete subject
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('admin'), validateParams(Joi.object({ id: commonValidations.id })), subjectController.deleteSubject);

module.exports = router;
