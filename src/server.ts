import app from './app';
import connectDB from './config/db';
import { seedAdmin } from './config/seed';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5001;

(async () => {
  await connectDB();

  // Seed admin user if environment variables are set
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})(); 