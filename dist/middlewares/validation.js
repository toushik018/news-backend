"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLogin = exports.validateNewsTranslation = exports.validateNews = void 0;
const express_validator_1 = require("express-validator");
// Only require the original language for title and content
exports.validateNews = [
    (0, express_validator_1.body)('title').custom((value, { req }) => {
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
    (0, express_validator_1.body)('content').custom((value, { req }) => {
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
    (0, express_validator_1.body)('originalLang')
        .isString().withMessage('Original language must be a string')
        .notEmpty().withMessage('Original language is required')
        .isIn(['en', 'de', 'es', 'fr', 'it', 'ru', 'ar', 'tr']).withMessage('Invalid language code')
];
// For translation update endpoint
exports.validateNewsTranslation = [
    (0, express_validator_1.body)('title').optional().isString().withMessage('Title must be a string'),
    (0, express_validator_1.body)('content').optional().isString().withMessage('Content must be a string')
];
exports.validateLogin = [
    (0, express_validator_1.body)('username').isString().notEmpty(),
    (0, express_validator_1.body)('password').isString().notEmpty(),
];
