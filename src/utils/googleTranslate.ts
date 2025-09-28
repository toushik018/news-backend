import axios from 'axios';
import { JSDOM } from 'jsdom';

type TranslateFormat = 'text' | 'html';

interface TranslateParams {
    text: string;
    target: string;
    source?: string;
    format?: TranslateFormat;
}

const API_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const decodeDom = new JSDOM('<!DOCTYPE html><body></body>');

const decodeTranslatedText = (value: string, format: TranslateFormat): string => {
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

export const translateWithGoogle = async ({
    text,
    target,
    source,
    format = 'text',
}: TranslateParams): Promise<string> => {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
        throw new Error('GOOGLE_TRANSLATE_API_KEY is not set');
    }

    try {
        const response = await axios.post(
            `${API_ENDPOINT}?key=${apiKey}`,
            {
                q: text,
                target,
                format,
                ...(source ? { source } : {}),
            },
            {
                timeout: 15000,
            }
        );

        const translatedText: string =
            response.data?.data?.translations?.[0]?.translatedText ?? '';

        return decodeTranslatedText(translatedText, format);
    } catch (error: any) {
        const status = error?.response?.status;
        const statusText = error?.response?.statusText;

        console.error(
            'Google Translate API request failed:',
            status ? `${status} ${statusText ?? ''}`.trim() : error?.message ?? error
        );
        throw error;
    }
};
