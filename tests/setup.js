// Jest setup file
process.env.NODE_ENV = 'test';

// Mock database for testing
jest.mock('../src/config/database', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  getClient: jest.fn(() => ({
    // Mock Prisma client methods as needed
  })),
}));
