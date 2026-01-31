/**
 * Script to create admin users in the database
 * Run with: node src/scripts/createAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Admin = require("../models/Admin");
const connectDB = require("../config/db");

// Connect to database
connectDB();

/**
 * Create an admin user
 */
const createAdmin = async (name, email, password, adminType = "general") => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.userType === "admin") {
        console.log(`✅ Admin user already exists: ${email}`);
        return existingUser;
      } else {
        // Update existing user to admin
        existingUser.userType = "admin";
        await existingUser.save();
        console.log(`✅ Updated user to admin: ${email}`);
        
        // Create Admin record
        const adminRecord = await Admin.findOne({ userId: existingUser._id });
        if (!adminRecord) {
          await Admin.create({
            userId: existingUser._id,
            adminType: adminType,
          });
          console.log(`✅ Created Admin record for: ${email}`);
        }
        return existingUser;
      }
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      userType: "admin",
    });

    await newUser.save();
    console.log(`✅ Created admin user: ${email}`);

    // Create Admin record
    await Admin.create({
      userId: newUser._id,
      adminType: adminType,
    });
    console.log(`✅ Created Admin record for: ${email}`);

    return newUser;
  } catch (error) {
    console.error(`❌ Error creating admin ${email}:`, error.message);
    throw error;
  }
};

/**
 * Main function
 */
const main = async () => {
  try {
    // Wait for database connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once("connected", resolve);
      }
    });

    console.log("🚀 Creating admin users...\n");

    // Create General Admin (Content Moderator)
    await createAdmin(
      "Content Moderator",
      "admin@byteflow.com",
      "admin123",
      "general"
    );

    // Create Payment Admin
    await createAdmin(
      "Payment Administrator",
      "payment@byteflow.com",
      "payment123",
      "payment"
    );

    console.log("\n✅ Admin users created successfully!");
    console.log("\n📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("General Admin (Content Moderator):");
    console.log("  Email: admin@byteflow.com");
    console.log("  Password: admin123");
    console.log("\nPayment Admin:");
    console.log("  Email: payment@byteflow.com");
    console.log("  Password: payment123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

// Run the script
main();

