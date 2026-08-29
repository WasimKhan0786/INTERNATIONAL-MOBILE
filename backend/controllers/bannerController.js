const Banner = require('../models/Banner');
const { uploadImage } = require('../services/cloudinary');

exports.getAllBanners = async (req, res) => {
  try {
    const { all } = req.query;
    const filter = all ? {} : { status: 'active' };

    const banners = await Banner.find(filter).sort({ order: 1 });
    return res.status(200).json({
      success: true,
      count: banners.length,
      banners
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error loading home banners'
    });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, buttonText, buttonUrl, discountBadge, status, order } = req.body;

    let imageUrl = '';

    // Handle File upload
    if (req.file) {
      const uploadRes = await uploadImage(req.file.buffer, req.file.mimetype);
      imageUrl = uploadRes.url;
    } else if (req.body.image) {
      // Handle Base64
      const img = req.body.image;
      if (img.startsWith('data:image')) {
        const uploadRes = await uploadImage(img);
        imageUrl = uploadRes.url;
      } else {
        imageUrl = img;
      }
    }

    const newBanner = new Banner({
      title,
      subtitle,
      buttonText: buttonText || 'Shop Now',
      buttonUrl: buttonUrl || 'shop.html',
      image: imageUrl,
      discountBadge: discountBadge || '',
      status: status || 'active',
      order: Number(order) || 1
    });

    await newBanner.save();

    return res.status(201).json({
      success: true,
      message: 'Banner added successfully',
      banner: newBanner
    });

  } catch (err) {
    console.error('[BANNER CREATE ERROR]', err.stack || err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the banner slide. Please try again.'
    });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const { title, subtitle, buttonText, buttonUrl, discountBadge, status, order, image } = req.body;

    let imageUrl = banner.image;

    // Handle File upload
    if (req.file) {
      const uploadRes = await uploadImage(req.file.buffer, req.file.mimetype);
      imageUrl = uploadRes.url;
    } else if (image) {
      // Handle Base64
      if (image.startsWith('data:image')) {
        const uploadRes = await uploadImage(image);
        imageUrl = uploadRes.url;
      } else {
        imageUrl = image;
      }
    }

    banner.title = title || banner.title;
    banner.subtitle = subtitle || banner.subtitle;
    banner.buttonText = buttonText !== undefined ? buttonText : banner.buttonText;
    banner.buttonUrl = buttonUrl !== undefined ? buttonUrl : banner.buttonUrl;
    banner.image = imageUrl;
    banner.discountBadge = discountBadge !== undefined ? discountBadge : banner.discountBadge;
    banner.status = status || banner.status;
    banner.order = order !== undefined ? Number(order) : banner.order;

    await banner.save();

    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      banner
    });

  } catch (err) {
    console.error('[BANNER UPDATE ERROR]', err.stack || err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the banner slide. Please try again.'
    });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    await Banner.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Banner slide deleted successfully'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting banner'
    });
  }
};
