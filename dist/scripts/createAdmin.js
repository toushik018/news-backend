"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_1 = __importDefault(require("../models/Admin"));
const dotenv_1 = __importDefault(require("dotenv"));
const readline_1 = __importDefault(require("readline"));
dotenv_1.default.config();
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
const promptQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};
const createAdmin = async () => {
    try {
        // Connect to database
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        // Check for environment variables first
        let username = process.env.ADMIN_USERNAME;
        let password = process.env.ADMIN_PASSWORD;
        // If not found in environment, prompt the user
        if (!username) {
            username = await promptQuestion('Enter admin username: ');
        }
        else {
            console.log(`Using username from environment: ${username}`);
        }
        if (!password) {
            password = await promptQuestion('Enter admin password: ');
        }
        else {
            console.log('Using password from environment');
        }
        // Check if admin already exists
        const existingAdmin = await Admin_1.default.findOne({ username });
        if (existingAdmin) {
            console.log('An admin with that username already exists');
            process.exit(0);
        }
        // Hash the password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Create the admin user
        const admin = await Admin_1.default.create({
            username,
            password: hashedPassword
        });
        console.log(`Admin user ${username} created successfully`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
    finally {
        rl.close();
    }
};
createAdmin();
