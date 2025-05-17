import { body } from 'express-validator';

// Only require the original language for title and content
export const validateNews = [
  body('title').custom((value, { req }) => {
    console.log('Validating title:', value);
    const lang = req.body.originalLang;

    if (!lang) {
      throw new Error('Original language is required');
    }

    if (!value) {
      throw new Error('Title is required');
    }

    if (!value[lang]) {
      throw new Error(`Title in language ${lang} is required`);
    }

    return true;
  }),
  body('content').custom((value, { req }) => {
    console.log('Validating content:', value);
    const lang = req.body.originalLang;

    if (!lang) {
      throw new Error('Original language is required');
    }

    if (!value) {
      throw new Error('Content is required');
    }

    if (!value[lang]) {
      throw new Error(`Content in language ${lang} is required`);
    }

    return true;
  }),
  body('originalLang')
    .isString().withMessage('Original language must be a string')
    .notEmpty().withMessage('Original language is required')
    .isIn(['en', 'de', 'es', 'fr', 'it', 'ru', 'ar', 'tr']).withMessage('Invalid language code')
];

// For translation update endpoint
export const validateNewsTranslation = [
  body('title').optional().isString().withMessage('Title must be a string'),
  body('content').optional().isString().withMessage('Content must be a string')
];

export const validateLogin = [
  body('username').isString().notEmpty(),
  body('password').isString().notEmpty(),
]; 