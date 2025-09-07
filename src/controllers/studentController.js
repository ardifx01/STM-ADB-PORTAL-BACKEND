const studentService = require('../services/studentService');
const { ApiResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class StudentController {
  /**
   * Get all students with pagination and filtering
   */
  async getAllStudents(req, res) {
    try {
      const {
        page,
        limit,
        search,
        status,
        class_id,
        gender,
        sort_by,
        sort_order
      } = req.query;

      const result = await studentService.getAllStudents({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        status,
        class_id,
        gender,
        sort_by,
        sort_order
      });

      res.json(ApiResponse.success(
        'Students retrieved successfully',
        result.students,
        result.pagination
      ));
    } catch (error) {
      logger.error('Error in getAllStudents:', error);
      res.status(500).json(ApiResponse.error('Failed to retrieve students'));
    }
  }

  /**
   * Get student by ID
   */
  async getStudentById(req, res) {
    try {
      const { id } = req.params;
      const student = await studentService.getStudentById(id);

      res.json(ApiResponse.success('Student retrieved successfully', student));
    } catch (error) {
      logger.error('Error in getStudentById:', error);
      if (error.message === 'Student not found') {
        res.status(404).json(ApiResponse.error('Student not found'));
      } else {
        res.status(500).json(ApiResponse.error('Failed to retrieve student'));
      }
    }
  }

  /**
   * Create new student
   */
  async createStudent(req, res) {
    try {
      const studentData = req.body;
      const student = await studentService.createStudent(studentData);

      res.status(201).json(ApiResponse.success('Student created successfully', student));
    } catch (error) {
      logger.error('Error in createStudent:', error);
      if (error.message.includes('already exists') || 
          error.message.includes('not found') ||
          error.message.includes('already has')) {
        res.status(400).json(ApiResponse.error(error.message));
      } else {
        res.status(500).json(ApiResponse.error('Failed to create student'));
      }
    }
  }

  /**
   * Update student
   */
  async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const studentData = req.body;
      
      const student = await studentService.updateStudent(id, studentData);

      res.json(ApiResponse.success('Student updated successfully', student));
    } catch (error) {
      logger.error('Error in updateStudent:', error);
      if (error.message === 'Student not found') {
        res.status(404).json(ApiResponse.error('Student not found'));
      } else if (error.message.includes('already exists')) {
        res.status(400).json(ApiResponse.error(error.message));
      } else {
        res.status(500).json(ApiResponse.error('Failed to update student'));
      }
    }
  }

  /**
   * Delete student
   */
  async deleteStudent(req, res) {
    try {
      const { id } = req.params;
      await studentService.deleteStudent(id);

      res.json(ApiResponse.success('Student deleted successfully', null));
    } catch (error) {
      logger.error('Error in deleteStudent:', error);
      if (error.message === 'Student not found') {
        res.status(404).json(ApiResponse.error('Student not found'));
      } else if (error.message.includes('Cannot delete')) {
        res.status(400).json(ApiResponse.error(error.message));
      } else {
        res.status(500).json(ApiResponse.error('Failed to delete student'));
      }
    }
  }

  /**
   * Get student statistics
   */
  async getStudentStats(req, res) {
    try {
      const stats = await studentService.getStudentStats();

      res.json(ApiResponse.success('Student statistics retrieved successfully', stats));
    } catch (error) {
      logger.error('Error in getStudentStats:', error);
      res.status(500).json(ApiResponse.error('Failed to retrieve student statistics'));
    }
  }

  /**
   * Get available users for student profile creation
   */
  async getAvailableUsers(req, res) {
    try {
      const users = await studentService.getAvailableUsers();

      res.json(ApiResponse.success('Available users retrieved successfully', users));
    } catch (error) {
      logger.error('Error in getAvailableUsers:', error);
      res.status(500).json(ApiResponse.error('Failed to retrieve available users'));
    }
  }

  /**
   * Search students
   */
  async searchStudents(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json(ApiResponse.error('Search query must be at least 2 characters'));
      }

      const students = await studentService.searchStudents(q.trim());

      res.json(ApiResponse.success('Students search completed', students));
    } catch (error) {
      logger.error('Error in searchStudents:', error);
      res.status(500).json(ApiResponse.error('Failed to search students'));
    }
  }

  /**
   * Get students by class
   */
  async getStudentsByClass(req, res) {
    try {
      const { classId } = req.params;
      const students = await studentService.getStudentsByClass(classId);

      res.json(ApiResponse.success('Students retrieved successfully', students));
    } catch (error) {
      logger.error('Error in getStudentsByClass:', error);
      res.status(500).json(ApiResponse.error('Failed to retrieve students by class'));
    }
  }

  /**
   * Assign student to class
   */
  async assignToClass(req, res) {
    try {
      const { id } = req.params;
      const { class_id } = req.body;

      if (!class_id) {
        return res.status(400).json(ApiResponse.error('Class ID is required'));
      }

      const student = await studentService.assignToClass(id, class_id);

      res.json(ApiResponse.success('Student assigned to class successfully', student));
    } catch (error) {
      logger.error('Error in assignToClass:', error);
      if (error.message.includes('not found')) {
        res.status(404).json(ApiResponse.error(error.message));
      } else {
        res.status(500).json(ApiResponse.error('Failed to assign student to class'));
      }
    }
  }

  /**
   * Remove student from class
   */
  async removeFromClass(req, res) {
    try {
      const { id } = req.params;
      const student = await studentService.removeFromClass(id);

      res.json(ApiResponse.success('Student removed from class successfully', student));
    } catch (error) {
      logger.error('Error in removeFromClass:', error);
      if (error.message === 'Student not found') {
        res.status(404).json(ApiResponse.error('Student not found'));
      } else {
        res.status(500).json(ApiResponse.error('Failed to remove student from class'));
      }
    }
  }
}

module.exports = new StudentController();
