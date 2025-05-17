import { Request, Response } from 'express';
import News from '../models/News';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { JSDOM } from 'jsdom';

const LANGS = ['en', 'de', 'es', 'fr', 'it', 'ru', 'ar', 'tr'];

// Public LibreTranslate instance - replace with a different one if this becomes unavailable
const LIBRETRANSLATE_URLS = [
  'https://libretranslate.de/translate',
  'https://translate.argosopentech.com/translate',
  'https://lt.vern.cc/translate'
];

// Flag to control whether to use the external translation API or fallback
const USE_EXTERNAL_TRANSLATION_API = true;

/**
 * Translate text using LibreTranslate API
 * @param text Text to translate
 * @param targetLang Target language code
 * @param sourceLang Source language code
 * @returns Translated text or original text if translation fails
 */
const translateText = async (text: string, targetLang: string, sourceLang: string): Promise<string> => {
  // If external API is disabled, use the fallback
  if (!USE_EXTERNAL_TRANSLATION_API) {
    return fallbackTranslate(text, targetLang, sourceLang);
  }

  // Check if the text is empty or if source and target languages are the same
  if (!text.trim() || sourceLang === targetLang) {
    return text;
  }

  console.log(`Translating from ${sourceLang} to ${targetLang}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

  // Try each API URL in order
  for (let i = 0; i < LIBRETRANSLATE_URLS.length; i++) {
    const apiUrl = LIBRETRANSLATE_URLS[i];
    try {
      // Determine if the text might be HTML based on a simple check
      const isHtml = text.includes('<') && text.includes('>');
      const format = isHtml ? 'html' : 'text';

      const response = await axios.post(apiUrl, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: format // Using HTML format when HTML is detected
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 seconds timeout
      });

      if (response.data && response.data.translatedText) {
        console.log(`Translation successful from ${sourceLang} to ${targetLang} (${apiUrl.split('/')[2]})`);
        return response.data.translatedText;
      } else {
        console.warn(`Unexpected response format from ${apiUrl}:`, response.data);
        // Try the next API if available
        continue;
      }
    } catch (error: any) {
      console.error(`Translation error from ${apiUrl}:`, error.message);

      // If this is the last API in our list, use the fallback
      if (i === LIBRETRANSLATE_URLS.length - 1) {
        console.log('All LibreTranslate APIs failed, using fallback');
        return fallbackTranslate(text, targetLang, sourceLang);
      }

      // Otherwise continue to the next API
      console.log(`Trying next LibreTranslate API: ${LIBRETRANSLATE_URLS[i + 1]}`);
    }
  }

  // Fallback if all API attempts failed
  return fallbackTranslate(text, targetLang, sourceLang);
};

/**
 * Fallback translation function that creates a simulated translation
 * This is used when the external API is unavailable
 */
const fallbackTranslate = (text: string, targetLang: string, sourceLang: string): string => {
  console.log(`Using fallback translation for ${targetLang}`);

  // If the text is HTML, try to preserve its structure
  if (text.includes('<') && text.includes('>')) {
    try {
      // Create a simple DOM parser
      const dom = new JSDOM(`<div id="content">${text}</div>`);
      const contentElement = dom.window.document.getElementById('content');

      if (contentElement) {
        // Function to add language prefix to text nodes
        const processTextNodes = (node: Node) => {
          // Skip script and style tags
          if (node.nodeType === node.ELEMENT_NODE) {
            const element = node as Element;
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
    } catch (error) {
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
  } else if (text.length > maxLength) {
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
const translateHtmlContent = async (htmlContent: string, targetLang: string, sourceLang: string): Promise<string> => {
  if (!htmlContent.trim() || sourceLang === targetLang) {
    return htmlContent;
  }

  try {
    // Check if the content is actually HTML
    if (!htmlContent.includes('<') || !htmlContent.includes('>')) {
      // If it's not HTML, just translate it as plain text
      return await translateText(htmlContent, targetLang, sourceLang);
    }

    // Method 1: Try to use the translateText function with HTML format
    // This is more efficient if the LibreTranslate API supports HTML format correctly
    try {
      // First try using the HTML format directly through the API
      // Our translateText function now detects HTML and sets format appropriately
      return await translateText(htmlContent, targetLang, sourceLang);
    } catch (directError) {
      console.warn('Direct HTML translation failed, falling back to node-by-node translation');
      // If direct HTML translation failed, continue with the node-by-node approach
    }

    // Method 2: Parse HTML and translate text nodes individually
    // Create a valid HTML document for parsing
    const dom = new JSDOM(`<div id="content">${htmlContent}</div>`);
    const contentElement = dom.window.document.getElementById('content');

    if (!contentElement) {
      throw new Error('Failed to parse HTML content');
    }

    // Function to recursively translate text nodes
    async function translateNode(node: Node) {
      // Skip script and style tags entirely
      if (node.nodeType === node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
          return;
        }
      }

      // If this is a text node with content
      if (node.nodeType === node.TEXT_NODE && node.textContent) {
        const text = node.textContent.trim();
        if (text.length > 0) {
          // Translate the text
          node.textContent = await translateText(text, targetLang, sourceLang);
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
  } catch (error) {
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
const generateAllTranslations = async (originalText: string, originalLang: string): Promise<Record<string, string>> => {
  const translations: Record<string, string> = {
    [originalLang]: originalText // Include the original text
  };

  // Get target languages (excluding original language)
  const targetLanguages = LANGS.filter(lang => lang !== originalLang);

  // Translate to each target language
  for (const lang of targetLanguages) {
    try {
      translations[lang] = await translateText(originalText, lang, originalLang);
    } catch (error) {
      console.error(`Failed to translate to ${lang}:`, error);
      translations[lang] = fallbackTranslate(originalText, lang, originalLang);
    }
  }

  return translations;
};

export const getAllNews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 5; // Set fixed limit to 5 items per page
    const skip = (page - 1) * limit;
    const total = await News.countDocuments();
    const totalPages = Math.ceil(total / limit);
    const news = await News.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
    res.json({ data: news, totalPages });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNews = async (req: Request, res: Response) => {
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
      } catch (error) {
        console.error('Error parsing title JSON:', error);
        return res.status(400).json({ message: 'Invalid title format - could not parse JSON' });
      }
    }

    if (typeof content === 'string') {
      try {
        console.log('Parsing content from string:', content);
        content = JSON.parse(content);
        console.log('Parsed content:', content);
      } catch (error) {
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
    const translatedTitles: Record<string, string> = {
      [originalLang]: title[originalLang] as string
    };

    const translatedContents: Record<string, string> = {
      [originalLang]: content[originalLang] as string
    };

    // Get target languages (excluding original language)
    const targetLanguages = LANGS.filter(lang => lang !== originalLang);

    // Translate titles and content for each language
    for (const lang of targetLanguages) {
      try {
        console.log(`Translating title to ${lang}...`);
        // Translate title (plain text)
        translatedTitles[lang] = await translateText(
          title[originalLang] as string,
          lang,
          originalLang
        );

        console.log(`Translating content to ${lang}...`);
        // Translate content (HTML) - use our improved translateHtmlContent function
        translatedContents[lang] = await translateHtmlContent(
          content[originalLang] as string,
          lang,
          originalLang
        );

        // Verify the translations worked properly
        if (!translatedTitles[lang] || translatedTitles[lang] === title[originalLang]) {
          console.warn(`Title translation to ${lang} might have failed, falling back`);
          translatedTitles[lang] = fallbackTranslate(
            title[originalLang] as string,
            lang,
            originalLang
          );
        }

        if (!translatedContents[lang] || translatedContents[lang] === content[originalLang]) {
          console.warn(`Content translation to ${lang} might have failed, falling back`);
          translatedContents[lang] = fallbackTranslate(
            content[originalLang] as string,
            lang,
            originalLang
          );
        }
      } catch (error) {
        console.error(`Failed to translate to ${lang}:`, error);
        // Use fallback if translation fails
        translatedTitles[lang] = fallbackTranslate(
          title[originalLang] as string,
          lang,
          originalLang
        );

        translatedContents[lang] = fallbackTranslate(
          content[originalLang] as string,
          lang,
          originalLang
        );
      }
    }

    console.log('Translations generated successfully');

    // Create news data object with translations
    const newsData: any = {
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
    } else if (req.file) {
      // Local file storage as fallback
      newsData.coverImage = `/uploads/${req.file.filename}`;
      console.log('Setting coverImage from local file:', newsData.coverImage);
    } else {
      console.log('No cover image provided');
    }

    console.log('Creating news with data:', newsData);

    // Create and save the news
    const news = new News(newsData);
    const savedNews = await news.save();
    console.log('News saved successfully:', savedNews._id);

    res.status(201).json(savedNews);
  } catch (err) {
    console.error('Create news error:', err);
    res.status(500).json({
      message: 'Error creating news',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};

export const updateNews = async (req: Request, res: Response) => {
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
    if (typeof title === 'string') title = JSON.parse(title);
    if (typeof content === 'string') content = JSON.parse(content);

    // Get existing news item
    const existingNews = await News.findById(id);
    if (!existingNews) {
      return res.status(404).json({ message: 'News not found' });
    }

    // Prepare update data
    const updateData: any = {};

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
        } catch (cloudinaryError) {
          console.error('Error deleting old image from Cloudinary:', cloudinaryError);
          // Continue with update even if image deletion fails
        }
      }
    } else if (req.file) {
      // Local file storage as fallback
      updateData.coverImage = `/uploads/${req.file.filename}`;
      console.log('Setting coverImage from local file:', updateData.coverImage);

      // Delete old image file if it exists
      if (existingNews.coverImage) {
        const oldImagePath = path.join(__dirname, '../../', existingNews.coverImage);
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (fsError) {
            console.error('Error deleting old local file:', fsError);
          }
        }
      }
    }

    // Update the news item
    const news = await News.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(news);
  } catch (err) {
    console.error('Update error:', err);
    res.status(400).json({ message: 'Invalid data', error: err });
  }
};

export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

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
        } catch (cloudinaryError) {
          console.error('Error deleting image from Cloudinary:', cloudinaryError);
          // Continue with news deletion even if image deletion fails
        }
      } else {
        // Handle local file system deletion (development)
        const imagePath = path.join(__dirname, '../../', news.coverImage);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (fsError) {
            console.error('Error deleting local file:', fsError);
            // Continue with news deletion even if image deletion fails
          }
        }
      }
    }

    // Delete the news document
    await news.deleteOne();

    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Failed to delete news', error: err });
  }
};

export const testI18n = (req: Request & { t?: any }, res: Response) => {
  if (!req.t) {
    return res.status(500).json({ error: 'Translation function not available' });
  }

  const t = req.t;
  res.json({
    greeting: t('greeting'),
    news: t('news')
  });
};

export const getNewsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const news = await News.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json(news);
  } catch (err) {
    console.error('Get news error:', err);
    res.status(400).json({ message: 'Invalid data', error: err });
  }
};

export const getNewsAnalytics = async (req: Request, res: Response) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
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
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const totalViewsToday = news
      .filter(item => item.updatedAt >= todayStart && item.updatedAt <= todayEnd)
      .reduce((sum, item) => sum + (item.views || 0), 0);
    const newArticlesToday = news.filter(item => item.createdAt >= todayStart && item.createdAt <= todayEnd).length;

    const dailyViews = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
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
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateNewsTranslation = async (req: Request, res: Response) => {
  try {
    const { id, lang } = req.params;
    const { title, content } = req.body;
    if (!LANGS.includes(lang)) {
      return res.status(400).json({ message: 'Invalid language code' });
    }
    const updateData: any = {};
    if (title) updateData[`title.${lang}`] = title;
    if (content) updateData[`content.${lang}`] = content;
    const news = await News.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!news) return res.status(404).json({ message: 'News not found' });
    res.json(news);
  } catch (err) {
    res.status(400).json({ message: 'Invalid data', error: err });
  }
}; 