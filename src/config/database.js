const { PrismaClient } = require('@prisma/client');
const config = require('./index');

class Database {
  constructor() {
    this.prisma = new PrismaClient({
      log: config.app.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('🗄️  Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log('🗄️  Database disconnected');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
    }
  }

  getClient() {
    return this.prisma;
  }
}

const database = new Database();

module.exports = database;
