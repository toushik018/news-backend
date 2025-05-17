"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const newsController_1 = require("../controllers/newsController");
const auth_1 = __importDefault(require("../middlewares/auth"));
const validation_1 = require("../middlewares/validation");
const validationResult_1 = __importDefault(require("../middlewares/validationResult"));
const cloudinaryUpload_1 = __importDefault(require("../middlewares/cloudinaryUpload"));
const parseJsonFields_1 = require("../middlewares/parseJsonFields");
const router = (0, express_1.Router)();
// Always use Cloudinary for image uploads regardless of environment
const uploadMiddleware = cloudinaryUpload_1.default.uploadToCloudinary('coverImage');
/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news
 *     tags: [News]
 *     responses:
 *       200:
 *         description: List of news
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/News'
 */
router.get('/', newsController_1.getAllNews);
/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Create news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsInput'
 *     responses:
 *       201:
 *         description: News created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/News'
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/', auth_1.default, ...uploadMiddleware, parseJsonFields_1.parseJsonFields, validation_1.validateNews, validationResult_1.default, newsController_1.createNews);
/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: Update news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: News ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsInput'
 *     responses:
 *       200:
 *         description: News updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/News'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: News not found
 *       422:
 *         description: Validation error
 */
router.put('/:id', auth_1.default, ...uploadMiddleware, parseJsonFields_1.parseJsonFields, validation_1.validateNews, validationResult_1.default, newsController_1.updateNews);
/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Delete news
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: News ID
 *     responses:
 *       200:
 *         description: News deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: News not found
 */
router.delete('/:id', auth_1.default, newsController_1.deleteNews);
/**
 * @swagger
 * /api/news/test-i18n:
 *   get:
 *     summary: Test i18n
 *     tags: [News]
 *     responses:
 *       200:
 *         description: Test i18n
 */
router.get('/test-i18n', newsController_1.testI18n);
/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get a single news item
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: News ID
 *     responses:
 *       200:
 *         description: News item
 *       404:
 *         description: News not found
 */
router.get('/:id', newsController_1.getNewsById);
/**
 * @swagger
 * /api/news/admin/analytics:
 *   get:
 *     summary: Get news analytics
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: News analytics
 *       401:
 *         description: Unauthorized
 */
router.get('/admin/analytics', auth_1.default, newsController_1.getNewsAnalytics);
/**
 * @swagger
 * /api/news/{id}/translation/{lang}:
 *   put:
 *     summary: Update news translation
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: News ID
 *       - in: path
 *         name: lang
 *         schema:
 *           type: string
 *         required: true
 *         description: Language code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewsTranslationInput'
 *     responses:
 *       200:
 *         description: News translation updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: News not found
 *       422:
 *         description: Validation error
 */
router.put('/:id/translation/:lang', auth_1.default, validation_1.validateNewsTranslation, validationResult_1.default, newsController_1.updateNewsTranslation);
exports.default = router;
