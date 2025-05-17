import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import dotenv from 'dotenv';

dotenv.config();

export const seedAdmin = async () => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
            console.warn('Admin credentials not found in environment variables. Admin user not created.');
            return;
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username: adminUsername });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            return;
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create the admin user
        const admin = await Admin.create({
            username: adminUsername,
            password: hashedPassword
        });

        console.log(`Admin user ${adminUsername} created successfully.`);
        return admin;
    } catch (error) {
        console.error('Error seeding admin user:', error);
        throw error;
    }
}; 