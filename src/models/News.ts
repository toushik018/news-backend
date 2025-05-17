import mongoose, { Schema, Document } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     News:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           $ref: '#/components/schemas/NewsLang'
 *         content:
 *           $ref: '#/components/schemas/NewsLang'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     NewsInput:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           $ref: '#/components/schemas/NewsLang'
 *         content:
 *           $ref: '#/components/schemas/NewsLang'
 *     NewsLang:
 *       type: object
 *       properties:
 *         en:
 *           type: string
 *         de:
 *           type: string
 *         es:
 *           type: string
 *         fr:
 *           type: string
 *         it:
 *           type: string
 *         ru:
 *           type: string
 *         ar:
 *           type: string
 *         tr:
 *           type: string
 */

export interface INews extends Document {
  title: {
    en?: string;
    de?: string;
    es?: string;
    fr?: string;
    it?: string;
    ru?: string;
    ar?: string;
    tr?: string;
  };
  content: {
    en?: string;
    de?: string;
    es?: string;
    fr?: string;
    it?: string;
    ru?: string;
    ar?: string;
    tr?: string;
  };
  originalLang: string;
  coverImage?: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema: Schema = new Schema(
  {
    title: {
      en: { type: String },
      de: { type: String },
      es: { type: String },
      fr: { type: String },
      it: { type: String },
      ru: { type: String },
      ar: { type: String },
      tr: { type: String },
    },
    content: {
      en: { type: String },
      de: { type: String },
      es: { type: String },
      fr: { type: String },
      it: { type: String },
      ru: { type: String },
      ar: { type: String },
      tr: { type: String },
    },
    originalLang: { type: String, required: true },
    coverImage: { type: String },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<INews>('News', NewsSchema); 