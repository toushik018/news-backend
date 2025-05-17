"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_1 = __importDefault(require("../models/Admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seedAdmin = async () => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminUsername || !adminPassword) {
            console.warn('Admin credentials not found in environment variables. Admin user not created.');
            return;
        }
        // Check if admin already exists
        const existingAdmin = await Admin_1.default.findOne({ username: adminUsername });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            return;
        }
        // Hash the password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, salt);
        // Create the admin user
        const admin = await Admin_1.default.create({
            username: adminUsername,
            password: hashedPassword
        });
        console.log(`Admin user ${adminUsername} created successfully.`);
        return admin;
    }
    catch (error) {
        console.error('Error seeding admin user:', error);
        throw error;
    }
};
exports.seedAdmin = seedAdmin;
