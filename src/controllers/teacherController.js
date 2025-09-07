const teacherService = require('../services/teacherService');
const { ApiResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class TeacherController {
  /**
   * Get all teachers with pagination and filtering
   */
  async getAllTeachers(req, res) {
    try {
      const {
        page,
        limit,
        search,
        employment_status,
        sort_by,
        sort_order
      } = req.query;

      const result = await teacherService.getAllTeachers({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        employment_status,
        sort_by,
        sort_order
      });

      res.json(ApiResponse.success(
        'Teachers retrieved successfully',
        result.teachers,
        result.pagination
      ));
    } catch (error) {
      logger.error('Error in getAllTeachers:', error);
      res.status(500).json(ApiResponse.error('Failed to retrieve teachers'));
    }
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(req, res) {
    try {
      const { id } = req.params;
      const teacher = await teacherService.getTeacherById(id);

      res.json(ApiResponse.success('Teacher retrieved successfully', teacher));
    } catch (error) {
      logger.error('Error in getTeacherById:', error);
      if (error.message === 'Teacher not found') {
        res.status(404).json(ApiResponse.error('Teacher not found'));
      } else {
        res.status(500).json(ApiResponse.error('Failed to retrieve teacher'));
      }
    }
  }

  /**
   * Create new teacher
   */
  async createTeacher(req, res) {
    try {
      const teacherData = req.body;
      const teacher = await teacherService.createTeacher(teacherData);

      res.status(201).json(ApiResponse.success('Teacher created successfully', teacher));
    } catch (error) {
      logger.error('Error in createTeacher:', error);
      if (error.message.includes('already exists') || 
          error.message.includes('not found') ||
          error.message.includes('already has')) {
        res.status(400).json(ApiResponse.error(error.message));
      } else {
        res.status(500).json(ApiResponse.error('Failed to create teacher'));
      }
    }
  }

  /**
   * Update teacher
   */
  async updateTeacher(req, res) {
    try {
      const { id } = req.params;
      const teacherData = req.body;
      
      const teacher = await teacherService.updateTeacher(id, teacherData);

      res.json(ApiResponse.success('Teacher updated successfully', teacher));
    } catch (error) {
      logger.error('Error in updateTeacher:', error);
      if (error.message === 'Teacher not found') {
        res.status(404).json(ApiResponse.error('Teacher not found'));
      } else if (error.message.includes('already exists')) {
        res.status(400).json(ApiResponse.error(error.message));
      } else {
        res.status(500).json(ApiResponse.error('Failed to update teacher'));
      }
    }
  }

  /**
   * Delete teacher
   */
  async deleteTeacher(req, res) {
    try {
      const { id } = req.params;
      await teacherService.deleteTeacher(id);

      res.json(ApiResponse.success('Teacher deleted successfully', null));
    } catch (error) {
      logger.error('Error in deleteTeacher:', error);
      if (error.message === 'Teacher not found') {
        res.status(404).json(ApiResponse.error('Teacher not found'));
      } else if (error.message.includes('Cannot delete')) {
        res.status(400).json(ApiResponse.error(error.message));
      } else {
        res.status(500).json(ApiResponse.error('Failed to delete teacher'));
      }
    }
  }

  /**
   * Get teacher statistics
   */
  async getTeacherStats(req, res) {
    try {
      const stats = await teacherService.getTeacherStats();

      res.json(ApiResponse.success('Teacher statistics retrieved successfully', stats));
    } catch (error) {
      logger.error('Error in getTeacherStats:', error);
      res.status(500).json(ApiResponse.error('Failed to retrieve teacher statistics'));
    }
  }

  /**
   * Get available users for teacher profile creation
   */
  async getAvailableUsers(req, res) {
    try {
      const users = await teacherService.getAvailableUsers();

      res.json(ApiResponse.success('Available users retrieved successfully', users));
    } catch (error) {
      logger.error('Error in getAvailableUsers:', error);
      res.status(500).json(ApiResponse.error('Failed to retrieve available users'));
    }
  }

  /**
   * Search teachers
   */
  async searchTeachers(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json(ApiResponse.error('Search query must be at least 2 characters'));
      }

      const teachers = await teacherService.searchTeachers(q.trim());

      res.json(ApiResponse.success('Teachers search completed', teachers));
    } catch (error) {
      logger.error('Error in searchTeachers:', error);
      res.status(500).json(ApiResponse.error('Failed to search teachers'));
    }
  }

  /**
   * Upload teacher signature
   */
  async uploadSignature(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json(ApiResponse.error('No signature file uploaded'));
      }

      const signature_image_path = req.file.path;
      const teacher = await teacherService.updateTeacher(id, { signature_image_path });

      res.json(ApiResponse.success('Signature uploaded successfully', teacher));
    } catch (error) {
      logger.error('Error in uploadSignature:', error);
      if (error.message === 'Teacher not found') {
        res.status(404).json(ApiResponse.error('Teacher not found'));
      } else {
        res.status(500).json(ApiResponse.error('Failed to upload signature'));
      }
    }
  }
}

module.exports = new TeacherController();
