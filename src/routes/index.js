const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const subjectRoutes = require('./subjects');
const classRoutes = require('./classes');
const teacherRoutes = require('./teachers');
const studentRoutes = require('./students');
const scheduleRoutes = require('./schedules');
const attendanceRoutes = require('./attendance');
const journalRoutes = require('./journals');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'STMADB Portal Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Documentation endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to STM ADB Portal Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      teachers: '/api/teachers',
      students: '/api/students',
      classes: '/api/classes',
      subjects: '/api/subjects',
      schedules: '/api/schedules',
      attendance: '/api/attendance',
      journals: '/api/journals',
      internships: '/api/internships',
      exams: '/api/exams',
      queue: '/api/queue',
      ramadhan: '/api/ramadhan',
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);
router.use('/classes', classRoutes);
router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/journals', journalRoutes);
// router.use('/internships', internshipRoutes); // TODO: Implement
// router.use('/exams', examRoutes);           // TODO: Implement
// router.use('/queue', queueRoutes);          // TODO: Implement
// router.use('/ramadan', ramadanRoutes);      // TODO: Implement

module.exports = router;
