"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Multilingual News Management API',
            version: '1.0.0',
            description: 'API for managing news in 8 languages with JWT authentication.'
        },
        servers: [
            { url: 'https://newz-livid-nine.vercel.app' },
            { url: 'http://localhost:5000' }
        ],
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
