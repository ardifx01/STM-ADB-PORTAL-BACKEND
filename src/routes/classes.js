const express = require('express');
const { classController } = require('../controllers');
const { classSchemas } = require('../validators');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validation');

const router = express.Router();

// Authentication required for all class routes
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Class ID
 *         class_name:
 *           type: string
 *           description: Name of the class
 *         grade_level:
 *           type: integer
 *           description: Grade level (1-12)
 *         academic_year:
 *           type: string
 *           description: Academic year in format YYYY/YYYY
 *         homeroom_teacher_id:
 *           type: string
 *           description: ID of the homeroom teacher
 *         counselor_teacher_id:
 *           type: string
 *           description: ID of the counselor teacher
 *         max_students:
 *           type: integer
 *           description: Maximum number of students allowed
 *         description:
 *           type: string
 *           description: Class description
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: grade_level
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: academic_year
 *         schema:
 *           type: string
 *           pattern: '^\d{4}\/\d{4}$'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of classes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', 
  authorize('admin', 'teacher', 'staff'), 
  classController.getClasses
);

/**
 * @swagger
 * /api/classes/stats:
 *   get:
 *     summary: Get class statistics
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Class statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stats', 
  authorize('admin', 'teacher', 'staff'), 
  classController.getClassStats
);

/**
 * @swagger
 * /api/classes/available-teachers:
 *   get:
 *     summary: Get available teachers for class assignment
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available teachers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/available-teachers', 
  authorize('admin', 'staff'), 
  classController.getAvailableTeachers
);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class details retrieved successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', 
  authorize('admin', 'teacher', 'staff'), 
  classController.getClassById
);

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class_name
 *               - grade_level
 *               - academic_year
 *             properties:
 *               class_name:
 *                 type: string
 *                 description: Name of the class
 *               grade_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               academic_year:
 *                 type: string
 *                 pattern: '^\d{4}\/\d{4}$'
 *               homeroom_teacher_id:
 *                 type: string
 *               counselor_teacher_id:
 *                 type: string
 *               max_students:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', 
  validateBody(classSchemas.create), 
  authorize('admin', 'staff'), 
  classController.createClass
);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               class_name:
 *                 type: string
 *               grade_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *               academic_year:
 *                 type: string
 *                 pattern: '^\d{4}\/\d{4}$'
 *               homeroom_teacher_id:
 *                 type: string
 *               counselor_teacher_id:
 *                 type: string
 *               max_students:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       404:
 *         description: Class not found
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/:id', 
  validateBody(classSchemas.update), 
  authorize('admin', 'staff'), 
  classController.updateClass
);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', 
  authorize('admin'), 
  classController.deleteClass
);

/**
 * @swagger
 * /api/classes/{id}/assign-student:
 *   post:
 *     summary: Assign a student to a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *             properties:
 *               student_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student assigned to class successfully
 *       404:
 *         description: Class or student not found
 *       400:
 *         description: Invalid request or class is full
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/:id/assign-student', 
  validateBody(classSchemas.assignStudent), 
  authorize('admin', 'staff'), 
  classController.assignStudent
);

/**
 * @swagger
 * /api/classes/{id}/remove-student:
 *   post:
 *     summary: Remove a student from a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *             properties:
 *               student_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student removed from class successfully
 *       404:
 *         description: Class or student not found
 *       400:
 *         description: Student not enrolled in this class
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/:id/remove-student', 
  validateBody(classSchemas.removeStudent), 
  authorize('admin', 'staff'), 
  classController.removeStudent
);

module.exports = router;
