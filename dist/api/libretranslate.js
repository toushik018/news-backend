"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateText = translateText;
const node_fetch_1 = __importDefault(require("node-fetch"));
// Use environment variable if available, otherwise fall back to the deployed URL
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'https://newz-livid-nine.vercel.app/translate';
async function translateText(text, source, target) {
    try {
        const response = await (0, node_fetch_1.default)(LIBRETRANSLATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                source,
                target,
                format: 'text'
            })
        });
        const data = await response.json();
        return data.translatedText;
    }
    catch (error) {
        console.error('LibreTranslate error:', error.message);
        throw new Error('Translation failed');
    }
}
