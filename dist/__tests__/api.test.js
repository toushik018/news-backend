"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const mongoose_1 = __importDefault(require("mongoose"));
const Admin_1 = __importDefault(require("../models/Admin"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
let token;
beforeAll(async () => {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    await mongoose_1.default.connection.collection('admins').deleteMany({});
    await mongoose_1.default.connection.collection('news').deleteMany({});
    const password = await bcryptjs_1.default.hash('testpassword', 10);
    const admin = await Admin_1.default.create({ username: 'testadmin', password });
    console.log('Test admin created:', admin);
});
afterAll(async () => {
    await mongoose_1.default.connection.collection('admins').deleteMany({});
    await mongoose_1.default.connection.collection('news').deleteMany({});
    await mongoose_1.default.disconnect();
});
describe('API Endpoints', () => {
    it('Health check', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('API is running');
    });
    it('Login with valid credentials', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ username: 'testadmin', password: 'testpassword' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        token = res.body.token;
    });
    it('Login with invalid credentials', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ username: 'testadmin', password: 'wrong' });
        expect(res.status).toBe(401);
    });
    let newsId;
    it('Create news (valid)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        const res = await (0, supertest_1.default)(app_1.default).get('/api/news');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    it('Update news', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        const res = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/news/${newsId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('deleted');
    });
});
