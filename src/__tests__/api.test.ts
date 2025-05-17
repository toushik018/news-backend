import dotenv from 'dotenv';
dotenv.config();
import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import Admin from '../models/Admin';
import bcrypt from 'bcryptjs';

let token: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  await mongoose.connection.collection('admins').deleteMany({});
  await mongoose.connection.collection('news').deleteMany({});
  const password = await bcrypt.hash('testpassword', 10);
  const admin = await Admin.create({ username: 'testadmin', password });
  console.log('Test admin created:', admin);
});

afterAll(async () => {
  await mongoose.connection.collection('admins').deleteMany({});
  await mongoose.connection.collection('news').deleteMany({});
  await mongoose.disconnect();
});

describe('API Endpoints', () => {
  it('Health check', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('API is running');
  });

  it('Login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'testpassword' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('Login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  let newsId: string;

  it('Create news (valid)', async () => {
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: { en: 'Test', de: 'Test', es: 'Test', fr: 'Test', it: 'Test', ru: 'Test', ar: 'Test', tr: 'Test' },
        content: { en: 'Content', de: 'Content', es: 'Content', fr: 'Content', it: 'Content', ru: 'Content', ar: 'Content', tr: 'Content' }
      });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    newsId = res.body._id;
  });

  it('Get all news', async () => {
    const res = await request(app).get('/api/news');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Update news', async () => {
    const res = await request(app)
      .put(`/api/news/${newsId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: { en: 'Updated', de: 'Updated', es: 'Updated', fr: 'Updated', it: 'Updated', ru: 'Updated', ar: 'Updated', tr: 'Updated' },
        content: { en: 'Updated', de: 'Updated', es: 'Updated', fr: 'Updated', it: 'Updated', ru: 'Updated', ar: 'Updated', tr: 'Updated' }
      });
    expect(res.status).toBe(200);
    expect(res.body.title.en).toBe('Updated');
  });

  it('Delete news', async () => {
    const res = await request(app)
      .delete(`/api/news/${newsId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });
}); 