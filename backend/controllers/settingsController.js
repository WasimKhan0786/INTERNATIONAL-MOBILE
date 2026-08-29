const Settings = require('../models/Settings');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { uploadImage } = require('../services/cloudinary');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Create default settings row if none exists
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    // Convert mongoose object to plain JSON to delete fields safely
    const settingsObj = settings.toObject();

    // Check if requester is authenticated admin
    let isAdmin = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const jwtSecret = process.env.JWT_SECRET || 'techzone_default_jwt_secret';
        const decoded = jwt.verify(token, jwtSecret);
        const admin = await User.findById(decoded.id);
        if (admin) {
          isAdmin = true;
        }
      } catch (e) {
        // Token verification failed, remain public client
      }
    }

    // Hide admin credentials from public storefront queries
    if (!isAdmin) {
      delete settingsObj.adminEmail;
      delete settingsObj.adminPassword;
    }

    return res.status(200).json({
      success: true,
      settings: settingsObj
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving website settings'
    });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const {
      shopName,
      tagline,
      logo,
      favicon,
      phone,
      whatsapp,
      email,
      address,
      openingHours,
      socialInstagram,
      socialFacebook,
      socialYoutube,
      socialTelegram,
      deliveryCharge,
      freeDeliveryThreshold,
      currency,
      themeColor,
      secondaryColor,
      adminEmail,
      adminPassword,
      adminAvatar,
      festivalModeActive,
      festivalTitle,
      festivalSubtitle,
      festivalDiscountBadge,
      festivalBannerBg,
      flashSaleActive,
      flashSaleTitle,
      flashSaleSubtitle,
      flashSaleEndTime,
      flashSaleDiscountBadge
    } = req.body;

    // Handle files upload
    let logoUrl = logo || settings.logo;
    let faviconUrl = favicon || settings.favicon;
    let avatarUrl = adminAvatar !== undefined ? adminAvatar : (settings.adminAvatar || '');

    // Process files if sent via multipart form
    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        const uploadRes = await uploadImage(req.files.logo[0].buffer, req.files.logo[0].mimetype);
        logoUrl = uploadRes.url;
      }
      if (req.files.favicon && req.files.favicon[0]) {
        const uploadRes = await uploadImage(req.files.favicon[0].buffer, req.files.favicon[0].mimetype);
        faviconUrl = uploadRes.url;
      }
      if (req.files.avatar && req.files.avatar[0]) {
        const uploadRes = await uploadImage(req.files.avatar[0].buffer, req.files.avatar[0].mimetype);
        avatarUrl = uploadRes.url;
      }
    }

    // Process base64 strings if sent via json
    if (logo && logo.startsWith('data:image')) {
      const uploadRes = await uploadImage(logo);
      logoUrl = uploadRes.url;
    }
    if (favicon && favicon.startsWith('data:image')) {
      const uploadRes = await uploadImage(favicon);
      faviconUrl = uploadRes.url;
    }
    if (adminAvatar && adminAvatar.startsWith('data:image')) {
      const uploadRes = await uploadImage(adminAvatar);
      avatarUrl = uploadRes.url;
    }

    // Update settings schema fields
    settings.shopName = shopName || settings.shopName;
    settings.tagline = tagline || settings.tagline;
    settings.logo = logoUrl;
    settings.favicon = faviconUrl;
    settings.adminAvatar = avatarUrl;
    settings.phone = phone || settings.phone;
    settings.whatsapp = whatsapp || settings.whatsapp;
    settings.email = email || settings.email;
    settings.address = address || settings.address;
    settings.openingHours = openingHours || settings.openingHours;
    settings.socialInstagram = socialInstagram !== undefined ? socialInstagram : settings.socialInstagram;
    settings.socialFacebook = socialFacebook !== undefined ? socialFacebook : settings.socialFacebook;
    settings.socialYoutube = socialYoutube !== undefined ? socialYoutube : settings.socialYoutube;
    settings.socialTelegram = socialTelegram !== undefined ? socialTelegram : settings.socialTelegram;
    settings.deliveryCharge = deliveryCharge !== undefined ? Number(deliveryCharge) : settings.deliveryCharge;
    settings.freeDeliveryThreshold = freeDeliveryThreshold !== undefined ? Number(freeDeliveryThreshold) : settings.freeDeliveryThreshold;
    settings.currency = currency || settings.currency;
    settings.themeColor = themeColor || settings.themeColor;
    settings.secondaryColor = secondaryColor || settings.secondaryColor;

    if (festivalModeActive !== undefined) {
      settings.festivalModeActive = festivalModeActive === true || festivalModeActive === 'true';
    }
    if (festivalTitle !== undefined) settings.festivalTitle = festivalTitle;
    if (festivalSubtitle !== undefined) settings.festivalSubtitle = festivalSubtitle;
    if (festivalDiscountBadge !== undefined) settings.festivalDiscountBadge = festivalDiscountBadge;
    if (festivalBannerBg !== undefined) settings.festivalBannerBg = festivalBannerBg;

    if (flashSaleActive !== undefined) {
      settings.flashSaleActive = flashSaleActive === true || flashSaleActive === 'true';
    }
    if (flashSaleTitle !== undefined) settings.flashSaleTitle = flashSaleTitle;
    if (flashSaleSubtitle !== undefined) settings.flashSaleSubtitle = flashSaleSubtitle;
    if (flashSaleEndTime !== undefined) settings.flashSaleEndTime = flashSaleEndTime;
    if (flashSaleDiscountBadge !== undefined) settings.flashSaleDiscountBadge = flashSaleDiscountBadge;
    
    if (adminEmail && typeof adminEmail === 'string' && adminEmail.trim() !== '') {
      settings.adminEmail = adminEmail.trim().toLowerCase();
    }
    if (adminPassword && typeof adminPassword === 'string' && adminPassword.trim() !== '') {
      settings.adminPassword = adminPassword;
    }

    await settings.save();

    // Synchronize administrative credentials in User collection if updated
    if ((adminEmail && adminEmail.trim() !== '') || (adminPassword && adminPassword.trim() !== '')) {
      let mainAdmin = await User.findOne({ role: 'admin' });
      if (mainAdmin) {
        if (adminEmail && adminEmail.trim() !== '') {
          mainAdmin.email = adminEmail.trim().toLowerCase();
        }
        if (adminPassword && adminPassword.trim() !== '') {
          mainAdmin.password = adminPassword; // Pre-save hook hashes password
        }
        await mainAdmin.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Website settings saved and updated successfully',
      settings
    });

  } catch (err) {
    console.error('[SETTINGS SAVE ERROR]', err.stack || err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while saving website settings. Please try again.'
    });
  }
};
