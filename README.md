# Multilingual News Management API

This project is a secure, well-architected Express.js server using TypeScript, following the MVC pattern, with Mongoose for MongoDB, and JWT authentication. It allows an admin to manage news posts in 8 languages (English, German, Spanish, French, Italian, Russian, Arabic, Turkish).

## Features
- Admin authentication (JWT)
- CRUD operations for news posts in 8 languages
- Follows MVC pattern and software engineering best practices
- Input validation and sanitization
- Security best practices (Helmet, rate limiting, etc.)

## Project Structure
```
/src
  /config         # Configuration (DB, JWT, etc.)
  /controllers    # Business logic for news, auth, etc.
  /models         # Mongoose schemas/models
  /routes         # Express routers
  /middlewares    # Auth, error handling, validation, etc.
  /services       # (Optional) Business logic helpers
  /utils          # Utility functions
  /types          # TypeScript types/interfaces
  app.ts          # Express app setup
  server.ts       # Entry point
```

## Setup
1. Install dependencies: `npm install`
2. Set up your `.env` file (see `.env.example`)
3. Run the server: `npm run dev`

## Endpoints
- `POST /api/auth/login` (admin login)
- `GET /api/news` (list news, public)
- `POST /api/news` (create news, admin)
- `PUT /api/news/:id` (update news, admin)
- `DELETE /api/news/:id` (delete news, admin)

## Load Balancing & Clustering
For production, you should run multiple instances of this server and use a process manager (like PM2) or a reverse proxy (like Nginx) for load balancing. Example with PM2:

```
pm install -g pm2
pm run build
pm start
pm2 start dist/server.js -i max # Runs as many instances as CPU cores
```

You can also use the Node.js cluster module for basic clustering.

## License
MIT 

## Multilingual News Workflow

This backend supports posting news in 8 languages: English, German, Spanish, French, Italian, Russian, Arabic, and Turkish.

### How it works
- When an admin posts news, they specify the original language.
- The backend auto-translates the title and content to the other 7 languages using LibreTranslate (or another free API).
- All 8 versions are saved in the database.
- Admins can later edit any translation manually.

### Environment Variables
See `.env.example` for required variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT authentication
- `PORT`: Server port
- `TRANSLATE_API_KEY`: (Optional) If using a paid translation API

### API Endpoints

#### Create News (auto-translate)
```
POST /api/news
Headers: Authorization: Bearer <token>
Body (JSON):
{
  "title": "Original title",
  "content": "Original content",
  "originalLang": "en" // or de, es, fr, it, ru, ar, tr
}
```

#### Update a Translation
```
PUT /api/news/:id/translation/:lang
Headers: Authorization: Bearer <token>
Body (JSON):
{
  "title": "Manual translation title",
  "content": "Manual translation content"
}
```

### Notes
- The backend uses LibreTranslate for free translation. You can swap to another provider if needed.
- Only the original language is required when posting news; others are filled automatically.
- Admins can edit any translation at any time. 