const jwt = require('jsonwebtoken');

// JWT secret from .env
const JWT_SECRET = 'stmadb_super_secret_jwt_key_2024_development';

// Create a token for admin
const adminPayload = {
  userId: "1",
  role: "admin"
};

const adminToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '1h' });

console.log('Generated Admin Token:');
console.log(adminToken);

// Also create teacher token
const teacherPayload = {
  userId: "2", 
  role: "teacher"
};

const teacherToken = jwt.sign(teacherPayload, JWT_SECRET, { expiresIn: '1h' });

console.log('\nGenerated Teacher Token:');
console.log(teacherToken);
