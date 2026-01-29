import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
import connectDB from "../configs/db.js";

dotenv.config();

const createAdminUser = async () => {
  try {
    await connectDB();

    const adminData = {
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
      phone: "1234567890",
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log("Admin user already exists with email:", adminData.email);
      console.log("Admin ID:", existingAdmin._id);
      
      // Generate admin token for existing user
      const token = jwt.sign(
        { id: existingAdmin._id.toString(), role: existingAdmin.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      console.log("Admin Token:", token);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const admin = new User({
      name: adminData.name,
      email: adminData.email,
      phone: adminData.phone,
      role: adminData.role,
      password_hash: hashedPassword,
    });

    await admin.save();

    console.log("Admin user created successfully!");
    console.log("Email:", adminData.email);
    console.log("Password:", adminData.password);
    console.log("Admin ID:", admin._id);
    
    // Generate admin token
    const token = jwt.sign(
      { id: admin._id.toString(), role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("Admin Token:", token);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser();