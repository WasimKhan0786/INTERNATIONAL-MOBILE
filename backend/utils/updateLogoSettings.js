const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Settings = require('../models/Settings');

dotenv.config();

const updateLogoSettings = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected successfully.");

    const settings = await Settings.findOne();
    if (!settings) {
      console.log("No settings document found to update.");
      process.exit(0);
    }

    settings.logo = "images/logo.png";
    settings.favicon = "images/favicon.png";

    await settings.save();
    console.log("Settings document successfully updated with custom favicon and logo!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating settings database:", err);
    process.exit(1);
  }
};

updateLogoSettings();
