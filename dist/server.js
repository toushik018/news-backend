"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const seed_1 = require("./config/seed");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
(async () => {
    await (0, db_1.default)();
    // Seed admin user if environment variables are set
    await (0, seed_1.seedAdmin)();
    app_1.default.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})();
