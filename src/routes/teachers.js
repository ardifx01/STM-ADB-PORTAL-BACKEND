const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const teacherController = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { teacherSchemas, commonValidations } = require('../validators');

// Configure multer for signature image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/signatures/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
  }
});

// Validation schemas for params
const paramsValidation = {
  id: require('joi').object({
    id: commonValidations.id
  })
};

const queryValidation = {
  list: require('joi').object({
    page: require('joi').number().integer().min(1).default(1),
    limit: require('joi').number().integer().min(1).max(100).default(10),
    search: require('joi').string().min(1).max(255).optional(),
    employment_status: require('joi').string().valid('ASN', 'GTT', 'PTT', 'Tetap').optional(),
    sort_by: require('joi').string().valid('full_name', 'nip', 'employment_status', 'username').default('full_name'),
    sort_order: require('joi').string().valid('asc', 'desc').default('asc')
  }),
  search: require('joi').object({
    q: require('joi').string().min(2).max(255).required()
  })
};

/**
 * @route GET /api/teachers
 * @desc Get all teachers with pagination and filtering
 * @access Private (Admin only)
 */
router.get('/',
  authenticate,
  authorize('admin'),
  validate(queryValidation.list, 'query'),
  teacherController.getAllTeachers
);

/**
 * @route GET /api/teachers/stats
 * @desc Get teacher statistics
 * @access Private (Admin only)
 */
router.get('/stats',
  authenticate,
  authorize('admin'),
  teacherController.getTeacherStats
);

/**
 * @route GET /api/teachers/available-users
 * @desc Get available users for teacher profile creation
 * @access Private (Admin only)
 */
router.get('/available-users',
  authenticate,
  authorize('admin'),
  teacherController.getAvailableUsers
);

/**
 * @route GET /api/teachers/search
 * @desc Search teachers by various criteria
 * @access Private (Admin, Teacher)
 */
router.get('/search',
  authenticate,
  authorize('admin', 'teacher'),
  validate(queryValidation.search, 'query'),
  teacherController.searchTeachers
);

/**
 * @route GET /api/teachers/:id
 * @desc Get teacher by ID
 * @access Private (Admin, Teacher - own profile)
 */
router.get('/:id',
  authenticate,
  authorize('admin', 'teacher'),
  validate(paramsValidation.id, 'params'),
  teacherController.getTeacherById
);

/**
 * @route POST /api/teachers
 * @desc Create new teacher
 * @access Private (Admin only)
 */
router.post('/',
  authenticate,
  authorize('admin'),
  validate(teacherSchemas.create, 'body'),
  teacherController.createTeacher
);

/**
 * @route PUT /api/teachers/:id
 * @desc Update teacher
 * @access Private (Admin, Teacher - own profile)
 */
router.put('/:id',
  authenticate,
  authorize('admin', 'teacher'),
  validate(paramsValidation.id, 'params'),
  validate(teacherSchemas.update, 'body'),
  teacherController.updateTeacher
);

/**
 * @route DELETE /api/teachers/:id
 * @desc Delete teacher
 * @access Private (Admin only)
 */
router.delete('/:id',
  authenticate,
  authorize('admin'),
  validate(paramsValidation.id, 'params'),
  teacherController.deleteTeacher
);

/**
 * @route POST /api/teachers/:id/signature
 * @desc Upload teacher signature
 * @access Private (Admin, Teacher - own profile)
 */
router.post('/:id/signature',
  authenticate,
  authorize('admin', 'teacher'),
  validate(paramsValidation.id, 'params'),
  upload.single('signature'),
  teacherController.uploadSignature
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 2MB',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
  
  next(error);
});

module.exports = router;
