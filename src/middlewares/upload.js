const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { ApiResponse } = require('../utils/helpers');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = config.upload.uploadPath;
    
    // Create subdirectories based on file type
    if (file.fieldname === 'photo' || file.fieldname === 'signature') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'attachment' || file.fieldname === 'document') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'misc/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    ...config.upload.allowedImageTypes,
    ...config.upload.allowedDocTypes,
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 5, // Maximum 5 files
  },
  fileFilter: fileFilter,
});

// Upload middlewares for different scenarios
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${config.upload.maxFileSize / (1024 * 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name in form';
        break;
    }
    
    return res.status(400).json(ApiResponse.error(message));
  }
  
  if (err) {
    return res.status(400).json(ApiResponse.error(err.message));
  }
  
  next();
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
};
