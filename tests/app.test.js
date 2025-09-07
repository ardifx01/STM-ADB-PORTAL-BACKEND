const request = require('supertest');
const App = require('../src/app');

describe('API Health Check', () => {
  let app;

  beforeAll(async () => {
    const appInstance = new App();
    app = appInstance.getApp();
  });

  test('GET /api/health should return OK', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.message).toBe('STMADB Portal Backend is running');
  });

  test('GET /api should return API info', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body.message).toBe('Welcome to STMADB Portal Backend API');
    expect(response.body.version).toBe('1.0.0');
  });

  test('GET / should return root info', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.message).toBe('STMADB Portal Backend API');
    expect(response.body.status).toBe('Running');
  });
});
