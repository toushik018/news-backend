"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateWithGoogle = void 0;
const axios_1 = __importDefault(require("axios"));
const jsdom_1 = require("jsdom");
const API_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const decodeDom = new jsdom_1.JSDOM('<!DOCTYPE html><body></body>');
const decodeTranslatedText = (value, format) => {
    if (!value) {
        return value;
    }
    const body = decodeDom.window.document.body;
    body.innerHTML = value;
    if (format === 'html') {
        return body.innerHTML;
    }
    return body.textContent ?? value;
};
const translateWithGoogle = async ({ text, target, source, format = 'text', }) => {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_TRANSLATE_API_KEY is not set');
    }
    try {
        const response = await axios_1.default.post(`${API_ENDPOINT}?key=${apiKey}`, {
            q: text,
            target,
            format,
            ...(source ? { source } : {}),
        }, {
            timeout: 15000,
        });
        const translatedText = response.data?.data?.translations?.[0]?.translatedText ?? '';
        return decodeTranslatedText(translatedText, format);
    }
    catch (error) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;
        console.error('Google Translate API request failed:', status ? `${status} ${statusText ?? ''}`.trim() : error?.message ?? error);
        throw error;
    }
};
exports.translateWithGoogle = translateWithGoogle;
