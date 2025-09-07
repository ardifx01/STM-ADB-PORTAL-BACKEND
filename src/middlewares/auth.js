const { verifyToken, extractTokenFromHeader } = require('../utils/auth');
const { ApiResponse } = require('../utils/helpers');
const database = require('../config/database');

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json(
        ApiResponse.error('Access token is required')
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const prisma = database.getClient();
    const user = await prisma.user.findUnique({
      where: { 
        id: BigInt(decoded.userId),
        is_active: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        is_active: true,
        teacher: {
          select: {
            id: true,
            full_name: true,
            nip: true,
          }
        },
        student: {
          select: {
            id: true,
            full_name: true,
            nis: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json(
        ApiResponse.error('User not found or inactive')
      );
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(
      ApiResponse.error('Invalid or expired token')
    );
  }
};

/**
 * Authorization middleware - check user roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        ApiResponse.error('Access denied - authentication required')
      );
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        ApiResponse.error('Access denied - insufficient permissions')
      );
    }

    next();
  };
};

/**
 * Optional authentication - don't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      const prisma = database.getClient();
      const user = await prisma.user.findUnique({
        where: { 
          id: BigInt(decoded.userId),
          is_active: true,
        },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
        }
      });

      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
