const Category = require('../models/Category');
const Product = require('../models/Product');
const { uploadImage, deleteImage, extractPublicId } = require('../services/cloudinary');

exports.getAllCategories = async (req, res) => {
  try {
    const { all } = req.query;
    const filter = all ? {} : { status: 'active' };

    const categories = await Category.find(filter).sort({ order: 1 });
    return res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving categories list'
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, status, order } = req.body;

    const slugExists = await Category.findOne({ slug: slug.toLowerCase() });
    if (slugExists) {
      return res.status(400).json({
        success: false,
        message: `Category with slug '${slug}' already exists.`
      });
    }

    let imageUrl = '';

    // Handle File upload
    if (req.file) {
      const uploadRes = await uploadImage(req.file.buffer, req.file.mimetype);
      imageUrl = uploadRes.url;
    } else if (req.body.image) {
      // Handle Base64 or URL
      const img = req.body.image;
      if (img.startsWith('data:image')) {
        const uploadRes = await uploadImage(img);
        imageUrl = uploadRes.url;
      } else {
        imageUrl = img;
      }
    }

    const newCategory = new Category({
      name,
      slug: slug.toLowerCase(),
      image: imageUrl,
      description: description || '',
      status: status || 'active',
      order: Number(order) || 0
    });

    await newCategory.save();

    return res.status(201).json({
      success: true,
      message: 'Category added successfully',
      category: newCategory
    });

  } catch (err) {
    console.error('[CATEGORY CREATE ERROR]', err.stack || err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the category. Please try again.'
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, slug, description, status, order, image } = req.body;

    if (slug && slug !== category.slug) {
      const slugCollision = await Category.findOne({ slug: slug.toLowerCase() });
      if (slugCollision) {
        return res.status(400).json({
          success: false,
          message: `Category with slug '${slug}' already exists.`
        });
      }
    }

    let imageUrl = category.image;

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

    category.name = name || category.name;
    category.slug = slug ? slug.toLowerCase() : category.slug;
    category.image = imageUrl;
    category.description = description !== undefined ? description : category.description;
    category.status = status || category.status;
    category.order = order !== undefined ? Number(order) : category.order;

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category
    });

  } catch (err) {
    console.error('[CATEGORY UPDATE ERROR]', err.stack || err);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating the category. Please try again.'
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if products exist in this category
    const productsCount = await Product.countDocuments({ categorySlug: category.slug });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It contains ${productsCount} products. Move products first.`
      });
    }

    // Delete associated image from Cloudinary to save storage
    if (category.image) {
      const publicId = extractPublicId(category.image);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Category and associated image deleted permanently'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting category'
    });
  }
};
