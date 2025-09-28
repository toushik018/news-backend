"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNewsTranslation = exports.getNewsAnalytics = exports.getNewsById = exports.testI18n = exports.deleteNews = exports.updateNews = exports.createNews = exports.getAllNews = void 0;
const News_1 = __importDefault(require("../models/News"));
const date_fns_1 = require("date-fns");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsdom_1 = require("jsdom");
const googleTranslate_1 = require("../utils/googleTranslate");
const LANGS = ['en', 'de', 'es', 'fr', 'it', 'ru', 'ar', 'tr'];
/**
 * Translate text using Google Translate API
 * @param text Text to translate
 * @param targetLang Target language code
 * @param sourceLang Source language code
 * @returns Translated text or original text if translation fails
 */
const translateText = async (text, targetLang, sourceLang) => {
    // Check if the text is empty or if source and target languages are the same
    if (!text.trim() || sourceLang === targetLang) {
        return text;
    }
    try {
        const primaryText = await (0, googleTranslate_1.translateWithGoogle)({
            text,
            target: targetLang,
            source: sourceLang,
            format: 'text'
        });
        if (primaryText && primaryText.trim() !== text.trim()) {
            return primaryText;
        }
        console.warn(`Translate returned identical text (${sourceLang} -> ${targetLang}). Retrying with auto-detect...`);
        // Retry with auto-detection of source language
        const secondaryText = await (0, googleTranslate_1.translateWithGoogle)({
            text,
            target: targetLang,
            format: 'text'
        });
        if (secondaryText && secondaryText.trim() !== text.trim()) {
            return secondaryText;
        }
        console.warn(`Translate still identical after retry (${sourceLang} -> ${targetLang}). Using fallback.`);
        return fallbackTranslate(text, targetLang, sourceLang);
    }
    catch (error) {
        console.error(`Google Translate API error (${sourceLang} -> ${targetLang}):`, error?.message || error);
        return fallbackTranslate(text, targetLang, sourceLang);
    }
};
/**
 * Fallback translation function that creates a simulated translation
 * This is used when the external API is unavailable
 */
const fallbackTranslate = (text, targetLang, sourceLang) => {
    console.log(`Using fallback translation for ${targetLang}`);
    // If the text is HTML, try to preserve its structure
    if (text.includes('<') && text.includes('>')) {
        try {
            // Create a simple DOM parser
            const dom = new jsdom_1.JSDOM(`<div id="content">${text}</div>`);
            const contentElement = dom.window.document.getElementById('content');
            if (contentElement) {
                // Function to add language prefix to text nodes
                const processTextNodes = (node) => {
                    // Skip script and style tags
                    if (node.nodeType === node.ELEMENT_NODE) {
                        const element = node;
                        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
                            return;
                        }
                    }
                    // Process text nodes
                    if (node.nodeType === node.TEXT_NODE && node.textContent) {
                        const trimmed = node.textContent.trim();
                        if (trimmed.length > 0) {
                            // Add language prefix only to non-empty text
                            node.textContent = node.textContent.replace(trimmed, `[${targetLang}] ${trimmed}`);
                        }
                    }
                    // Process children
                    const childNodes = [...node.childNodes];
                    for (const child of childNodes) {
                        processTextNodes(child);
                    }
                };
                // Process the content
                processTextNodes(contentElement);
                // Return the modified HTML
                return contentElement.innerHTML;
            }
        }
        catch (error) {
            console.error('Error in HTML fallback translation:', error);
            // If HTML processing fails, fall back to simple text prefixing
        }
    }
    // For plain text, just add a language prefix
    // Get the first sentence or limit to reasonable length
    const maxLength = 100;
    let displayText = text;
    // If it's a long text, try to get just the first sentence
    const sentenceEnd = text.search(/[.!?]/);
    if (sentenceEnd > 0 && sentenceEnd < maxLength) {
        displayText = text.substring(0, sentenceEnd + 1);
    }
    else if (text.length > maxLength) {
        displayText = text.substring(0, maxLength) + '...';
    }
    return `[${targetLang}] ${displayText}`;
};
/**
 * Handles HTML content by preserving HTML tags while translating the text content
 * Uses JSDOM to properly parse and preserve HTML structure
 * @param htmlContent HTML content to translate
 * @param targetLang Target language code
 * @param sourceLang Source language code
 */
const translateHtmlContent = async (htmlContent, targetLang, sourceLang) => {
    if (!htmlContent.trim() || sourceLang === targetLang) {
        return htmlContent;
    }
    try {
        // Check if the content is actually HTML
        if (!htmlContent.includes('<') || !htmlContent.includes('>')) {
            // If it's not HTML, just translate it as plain text
            return await (0, googleTranslate_1.translateWithGoogle)({
                text: htmlContent,
                target: targetLang,
                source: sourceLang,
                format: 'html'
            });
        }
        // Method 1: Try to use the translateText function with HTML format
        // This is more efficient if the LibreTranslate API supports HTML format correctly
        try {
            // First try using the HTML format directly through the API
            // Our translateText function now detects HTML and sets format appropriately
            return await translateText(htmlContent, targetLang, sourceLang);
        }
        catch (directError) {
            console.warn('Direct HTML translation failed, falling back to node-by-node translation');
            // If direct HTML translation failed, continue with the node-by-node approach
        }
        // Method 2: Parse HTML and translate text nodes individually
        // Create a valid HTML document for parsing
        const dom = new jsdom_1.JSDOM(`<div id="content">${htmlContent}</div>`);
        const contentElement = dom.window.document.getElementById('content');
        if (!contentElement) {
            throw new Error('Failed to parse HTML content');
        }
        // Function to recursively translate text nodes
        async function translateNode(node) {
            // Skip script and style tags entirely
            if (node.nodeType === node.ELEMENT_NODE) {
                const element = node;
                if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
                    return;
                }
            }
            // If this is a text node with content
            if (node.nodeType === node.TEXT_NODE && node.textContent) {
                const text = node.textContent.trim();
                if (text.length > 0) {
                    // Translate the text
                    node.textContent = await (0, googleTranslate_1.translateWithGoogle)({
                        text,
                        target: targetLang,
                        source: sourceLang,
                        format: 'text'
                    });
                }
            }
            // Process child nodes recursively
            const childNodes = [...node.childNodes];
            for (const child of childNodes) {
                await translateNode(child);
            }
        }
        // Start the translation process from the content root
        await translateNode(contentElement);
        // Return the translated HTML
        return contentElement.innerHTML;
    }
    catch (error) {
        console.error('HTML translation error:', error);
        // Fallback to simple translation if HTML parsing fails
        return fallbackTranslate(htmlContent, targetLang, sourceLang);
    }
};
/**
 * Generate translations for all languages
 * @param originalText Original text content
 * @param originalLang Original language code
 * @returns Object with translations for all languages
 */
const generateAllTranslations = async (originalText, originalLang) => {
    const translations = {
        [originalLang]: originalText // Include the original text
    };
    // Get target languages (excluding original language)
    const targetLanguages = LANGS.filter(lang => lang !== originalLang);
    // Translate to each target language
    for (const lang of targetLanguages) {
        try {
            translations[lang] = await translateText(originalText, lang, originalLang);
        }
        catch (error) {
            console.error(`Failed to translate to ${lang}:`, error);
            translations[lang] = fallbackTranslate(originalText, lang, originalLang);
        }
    }
    return translations;
};
const getAllNews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Set fixed limit to 5 items per page
        const skip = (page - 1) * limit;
        const total = await News_1.default.countDocuments();
        const totalPages = Math.ceil(total / limit);
        const news = await News_1.default.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        res.json({ data: news, totalPages });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllNews = getAllNews;
const createNews = async (req, res) => {
    try {
        console.log('=== CREATE NEWS REQUEST ===');
        console.log('Headers:', req.headers);
        console.log('Request body:', req.body);
        console.log('File received:', req.file);
        // Check if there was a Cloudinary upload error
        if (req.body.cloudinaryError) {
            console.error('Cloudinary upload failed:', req.body.cloudinaryError);
            return res.status(500).json({
                message: 'Image upload failed',
                error: req.body.cloudinaryError
            });
        }
        let { title, content, originalLang } = req.body;
        // Validate required fields
        if (!originalLang) {
            return res.status(400).json({ message: 'originalLang is required' });
        }
        // Parse title/content if sent as JSON strings (from FormData)
        if (typeof title === 'string') {
            try {
                console.log('Parsing title from string:', title);
                title = JSON.parse(title);
                console.log('Parsed title:', title);
            }
            catch (error) {
                console.error('Error parsing title JSON:', error);
                return res.status(400).json({ message: 'Invalid title format - could not parse JSON' });
            }
        }
        if (typeof content === 'string') {
            try {
                console.log('Parsing content from string:', content);
                content = JSON.parse(content);
                console.log('Parsed content:', content);
            }
            catch (error) {
                console.error('Error parsing content JSON:', error);
                return res.status(400).json({ message: 'Invalid content format - could not parse JSON' });
            }
        }
        // Validate the structure
        if (!title || typeof title !== 'object') {
            return res.status(400).json({ message: 'title must be an object with language keys' });
        }
        if (!content || typeof content !== 'object') {
            return res.status(400).json({ message: 'content must be an object with language keys' });
        }
        // Check if the original language exists in title and content
        if (!title[originalLang]) {
            return res.status(400).json({ message: `Title in ${originalLang} is required` });
        }
        if (!content[originalLang]) {
            return res.status(400).json({ message: `Content in ${originalLang} is required` });
        }
        console.log('Validated data:', { title, content, originalLang });
        // Generate translations for all languages
        console.log('Generating translations for all languages...');
        // Generate translations for title (plain text) and content (HTML)
        const translatedTitles = {
            [originalLang]: title[originalLang]
        };
        const translatedContents = {
            [originalLang]: content[originalLang]
        };
        // Get target languages (excluding original language)
        const targetLanguages = LANGS.filter(lang => lang !== originalLang);
        // Translate titles and content for each language
        for (const lang of targetLanguages) {
            try {
                console.log(`Translating title to ${lang}...`);
                // Translate title (plain text)
                translatedTitles[lang] = await translateText(title[originalLang], lang, originalLang);
                console.log(`Translating content to ${lang}...`);
                // Translate content (HTML) - use our improved translateHtmlContent function
                translatedContents[lang] = await translateHtmlContent(content[originalLang], lang, originalLang);
                // Verify the translations worked properly
                if (!translatedTitles[lang] || translatedTitles[lang] === title[originalLang]) {
                    console.warn(`Title translation to ${lang} might have failed, falling back`);
                    translatedTitles[lang] = fallbackTranslate(title[originalLang], lang, originalLang);
                }
                if (!translatedContents[lang] || translatedContents[lang] === content[originalLang]) {
                    console.warn(`Content translation to ${lang} might have failed, falling back`);
                    translatedContents[lang] = fallbackTranslate(content[originalLang], lang, originalLang);
                }
            }
            catch (error) {
                console.error(`Failed to translate to ${lang}:`, error);
                // Use fallback if translation fails
                translatedTitles[lang] = fallbackTranslate(title[originalLang], lang, originalLang);
                translatedContents[lang] = fallbackTranslate(content[originalLang], lang, originalLang);
            }
        }
        console.log('Translations generated successfully');
        // Create news data object with translations
        const newsData = {
            title: translatedTitles,
            content: translatedContents,
            originalLang,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        // Handle cover image - in production, cloudinaryUpload middleware adds coverImage to req.body
        // In dev, we need to construct the path from the file
        if (req.body.coverImage) {
            // Use the Cloudinary URL directly from the middleware
            newsData.coverImage = req.body.coverImage;
            console.log('Setting coverImage from Cloudinary URL:', req.body.coverImage);
        }
        else if (req.file) {
            // Local file storage as fallback
            newsData.coverImage = `/uploads/${req.file.filename}`;
            console.log('Setting coverImage from local file:', newsData.coverImage);
        }
        else {
            console.log('No cover image provided');
        }
        console.log('Creating news with data:', newsData);
        // Create and save the news
        const news = new News_1.default(newsData);
        const savedNews = await news.save();
        console.log('News saved successfully:', savedNews._id);
        res.status(201).json(savedNews);
    }
    catch (err) {
        console.error('Create news error:', err);
        res.status(500).json({
            message: 'Error creating news',
            error: err instanceof Error ? err.message : 'Unknown error'
        });
    }
};
exports.createNews = createNews;
const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if there was a Cloudinary upload error
        if (req.body.cloudinaryError) {
            console.error('Cloudinary upload failed:', req.body.cloudinaryError);
            return res.status(500).json({
                message: 'Image upload failed',
                error: req.body.cloudinaryError
            });
        }
        let { title, content, originalLang } = req.body;
        // Parse title/content if sent as JSON strings (from FormData)
        if (typeof title === 'string')
            title = JSON.parse(title);
        if (typeof content === 'string')
            content = JSON.parse(content);
        // Get existing news item
        const existingNews = await News_1.default.findById(id);
        if (!existingNews) {
            return res.status(404).json({ message: 'News not found' });
        }
        // Prepare update data
        const updateData = {};
        // Merge existing translations with updates for title
        if (title) {
            updateData.title = {
                ...existingNews.title,
                ...title
            };
        }
        // Merge existing translations with updates for content
        if (content) {
            updateData.content = {
                ...existingNews.content,
                ...content
            };
        }
        // Update original language if provided
        if (originalLang) {
            updateData.originalLang = originalLang;
        }
        // Handle cover image - in production, cloudinaryUpload middleware adds coverImage to req.body
        // In dev, we need to construct the path from the file
        if (req.body.coverImage) {
            // Cloudinary URL is already set in req.body.coverImage by the middleware
            updateData.coverImage = req.body.coverImage;
            console.log('Setting coverImage from Cloudinary URL:', req.body.coverImage);
            // If replacing an existing Cloudinary image, delete the old one
            if (existingNews.coverImage && existingNews.coverImage.includes('cloudinary.com')) {
                try {
                    const urlParts = existingNews.coverImage.split('/');
                    const filenamePart = urlParts[urlParts.length - 1];
                    const publicId = `uploads/${filenamePart.split('.')[0]}`;
                    const cloudinary = require('../config/cloudinary').default;
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`Deleted old image from Cloudinary: ${publicId}`);
                }
                catch (cloudinaryError) {
                    console.error('Error deleting old image from Cloudinary:', cloudinaryError);
                    // Continue with update even if image deletion fails
                }
            }
        }
        else if (req.file) {
            // Local file storage as fallback
            updateData.coverImage = `/uploads/${req.file.filename}`;
            console.log('Setting coverImage from local file:', updateData.coverImage);
            // Delete old image file if it exists
            if (existingNews.coverImage) {
                const oldImagePath = path_1.default.join(__dirname, '../../', existingNews.coverImage);
                if (fs_1.default.existsSync(oldImagePath)) {
                    try {
                        fs_1.default.unlinkSync(oldImagePath);
                    }
                    catch (fsError) {
                        console.error('Error deleting old local file:', fsError);
                    }
                }
            }
        }
        // Update the news item
        const news = await News_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
        res.json(news);
    }
    catch (err) {
        console.error('Update error:', err);
        res.status(400).json({ message: 'Invalid data', error: err });
    }
};
exports.updateNews = updateNews;
const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News_1.default.findById(id);
        if (!news) {
            return res.status(404).json({ message: 'News not found' });
        }
        // Handle image deletion based on environment
        if (news.coverImage) {
            // Check if it's a Cloudinary URL (starts with https://res.cloudinary.com/)
            if (news.coverImage.includes('cloudinary.com')) {
                try {
                    // Extract the public_id from the URL
                    // Cloudinary URLs typically look like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/uploads/image-name
                    const urlParts = news.coverImage.split('/');
                    const filenamePart = urlParts[urlParts.length - 1];
                    const publicId = `uploads/${filenamePart.split('.')[0]}`;
                    // Import Cloudinary
                    const cloudinary = require('../config/cloudinary').default;
                    // Delete the image from Cloudinary
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`Deleted image from Cloudinary: ${publicId}`);
                }
                catch (cloudinaryError) {
                    console.error('Error deleting image from Cloudinary:', cloudinaryError);
                    // Continue with news deletion even if image deletion fails
                }
            }
            else {
                // Handle local file system deletion (development)
                const imagePath = path_1.default.join(__dirname, '../../', news.coverImage);
                if (fs_1.default.existsSync(imagePath)) {
                    try {
                        fs_1.default.unlinkSync(imagePath);
                    }
                    catch (fsError) {
                        console.error('Error deleting local file:', fsError);
                        // Continue with news deletion even if image deletion fails
                    }
                }
            }
        }
        // Delete the news document
        await news.deleteOne();
        res.json({ message: 'News deleted successfully' });
    }
    catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ message: 'Failed to delete news', error: err });
    }
};
exports.deleteNews = deleteNews;
const testI18n = (req, res) => {
    if (!req.t) {
        return res.status(500).json({ error: 'Translation function not available' });
    }
    const t = req.t;
    res.json({
        greeting: t('greeting'),
        news: t('news')
    });
};
exports.testI18n = testI18n;
const getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News_1.default.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
        if (!news)
            return res.status(404).json({ message: 'News not found' });
        res.json(news);
    }
    catch (err) {
        console.error('Get news error:', err);
        res.status(400).json({ message: 'Invalid data', error: err });
    }
};
exports.getNewsById = getNewsById;
const getNewsAnalytics = async (req, res) => {
    try {
        const news = await News_1.default.find().sort({ createdAt: -1 });
        const total = news.length;
        const totalViews = news.reduce((sum, item) => sum + (item.views || 0), 0);
        const avgViews = total > 0 ? Math.round(totalViews / total) : 0;
        const topNews = [...news]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5)
            .map(item => ({
            title: item.title,
            views: item.views,
        }));
        const today = new Date();
        const todayStart = (0, date_fns_1.startOfDay)(today);
        const todayEnd = (0, date_fns_1.endOfDay)(today);
        const totalViewsToday = news
            .filter(item => item.updatedAt >= todayStart && item.updatedAt <= todayEnd)
            .reduce((sum, item) => sum + (item.views || 0), 0);
        const newArticlesToday = news.filter(item => item.createdAt >= todayStart && item.createdAt <= todayEnd).length;
        const dailyViews = [];
        for (let i = 6; i >= 0; i--) {
            const day = (0, date_fns_1.subDays)(today, i);
            const dayStart = (0, date_fns_1.startOfDay)(day);
            const dayEnd = (0, date_fns_1.endOfDay)(day);
            const views = news
                .filter(item => item.updatedAt >= dayStart && item.updatedAt <= dayEnd)
                .reduce((sum, item) => sum + (item.views || 0), 0);
            dailyViews.push({
                date: dayStart.toISOString().slice(0, 10),
                views,
            });
        }
        res.json({
            total,
            totalViews,
            avgViews,
            topNews,
            totalViewsToday,
            newArticlesToday,
            dailyViews,
        });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getNewsAnalytics = getNewsAnalytics;
const updateNewsTranslation = async (req, res) => {
    try {
        const { id, lang } = req.params;
        const { title, content } = req.body;
        if (!LANGS.includes(lang)) {
            return res.status(400).json({ message: 'Invalid language code' });
        }
        const updateData = {};
        if (title)
            updateData[`title.${lang}`] = title;
        if (content)
            updateData[`content.${lang}`] = content;
        const news = await News_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });
        if (!news)
            return res.status(404).json({ message: 'News not found' });
        res.json(news);
    }
    catch (err) {
        res.status(400).json({ message: 'Invalid data', error: err });
    }
};
exports.updateNewsTranslation = updateNewsTranslation;
