import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const promptQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const createAdmin = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Check for environment variables first
        let username = process.env.ADMIN_USERNAME;
        let password = process.env.ADMIN_PASSWORD;

        // If not found in environment, prompt the user
        if (!username) {
            username = await promptQuestion('Enter admin username: ');
        } else {
            console.log(`Using username from environment: ${username}`);
        }

        if (!password) {
            password = await promptQuestion('Enter admin password: ');
        } else {
            console.log('Using password from environment');
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            console.log('An admin with that username already exists');
            process.exit(0);
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the admin user
        const admin = await Admin.create({
            username,
            password: hashedPassword
        });

        console.log(`Admin user ${username} created successfully`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    } finally {
        rl.close();
    }
};

createAdmin(); 