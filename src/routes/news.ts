import { Router } from 'express';
import { getAllNews, createNews, updateNews, deleteNews, testI18n, getNewsById, getNewsAnalytics, updateNewsTranslation } from '../controllers/newsController';
import auth from '../middlewares/auth';
import { validateNews, validateNewsTranslation } from '../middlewares/validation';
import handleValidation from '../middlewares/validationResult';
import upload from '../middlewares/upload';
import cloudinaryUpload from '../middlewares/cloudinaryUpload';
import { parseJsonFields } from '../middlewares/parseJsonFields';

const router = Router();

// Always use Cloudinary for image uploads regardless of environment
const uploadMiddleware = cloudinaryUpload.uploadToCloudinary('coverImage');

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
router.get('/', getAllNews);

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
router.post('/', auth, ...uploadMiddleware, parseJsonFields, validateNews, handleValidation, createNews);

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
router.put('/:id', auth, ...uploadMiddleware, parseJsonFields, validateNews, handleValidation, updateNews);

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
router.delete('/:id', auth, deleteNews);

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
router.get('/test-i18n', testI18n);

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
router.get('/:id', getNewsById);

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
router.get('/admin/analytics', auth, getNewsAnalytics);

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
router.put('/:id/translation/:lang', auth, validateNewsTranslation, handleValidation, updateNewsTranslation);

export default router; 