import { Request, Response, NextFunction } from 'express';

export function parseJsonFields(req: Request, res: Response, next: NextFunction) {
  console.log('Parse JSON Fields - Request Body:', req.body);

  if (typeof req.body.title === 'string') {
    try {
      console.log('Parsing title string:', req.body.title);
      req.body.title = JSON.parse(req.body.title);
      console.log('Parsed title object:', req.body.title);
    } catch (error) {
      console.error('Error parsing title JSON:', error);
      return res.status(400).json({ message: 'Invalid title format', error: 'Failed to parse title JSON' });
    }
  }

  if (typeof req.body.content === 'string') {
    try {
      console.log('Parsing content string:', req.body.content);
      req.body.content = JSON.parse(req.body.content);
      console.log('Parsed content object:', req.body.content);
    } catch (error) {
      console.error('Error parsing content JSON:', error);
      return res.status(400).json({ message: 'Invalid content format', error: 'Failed to parse content JSON' });
    }
  }

  next();
} 