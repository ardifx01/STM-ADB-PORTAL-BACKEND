const { ApiResponse } = require('../utils/helpers');

/**
 * Joi validation middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message.replace(/"/g, ''))
        .join(', ');
      
      return res.status(400).json(
        ApiResponse.error(`Validation error: ${errorMessage}`)
      );
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Validate request parameters
 */
const validateParams = (schema) => validate(schema, 'params');

/**
 * Validate request query
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate request body
 */
const validateBody = (schema) => validate(schema, 'body');

module.exports = {
  validate,
  validateParams,
  validateQuery,
  validateBody,
};
