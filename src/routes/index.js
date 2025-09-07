const express = require('express');
const authRoutes = require('./auth');

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
// router.use('/users', userRoutes);           // TODO: Implement
// router.use('/teachers', teacherRoutes);     // TODO: Implement
// router.use('/students', studentRoutes);     // TODO: Implement
// router.use('/classes', classRoutes);        // TODO: Implement
// router.use('/subjects', subjectRoutes);     // TODO: Implement
// router.use('/schedules', scheduleRoutes);   // TODO: Implement
// router.use('/attendance', attendanceRoutes); // TODO: Implement
// router.use('/journals', journalRoutes);     // TODO: Implement
// router.use('/internships', internshipRoutes); // TODO: Implement
// router.use('/exams', examRoutes);           // TODO: Implement
// router.use('/queue', queueRoutes);          // TODO: Implement
// router.use('/ramadan', ramadanRoutes);      // TODO: Implement

module.exports = router;
