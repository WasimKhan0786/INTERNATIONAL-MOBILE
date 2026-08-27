const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../services/cloudinary');

exports.getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      all // flag if called from admin side (loads inactive/out-of-stock items)
    } = req.query;

    const query = {};

    // 1. Status Filter (Only active on customer side)
    if (!all) {
      query.status = 'active';
    }

    // 2. Search Keyword
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // 3. Category Slug
    if (category && category !== 'accessories') {
      query.categorySlug = category;
    }

    // 4. Brand
    if (brand) {
      query.brand = brand;
    }

    // 5. In Stock availability
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // 6. Price Boundaries (check against discountPrice or price)
    if (minPrice || maxPrice) {
      const min = Number(minPrice) || 0;
      const max = Number(maxPrice) || 9999999;
      
      query.$or = [
        {
          discountPrice: { $ne: null },
          $expr: {
            $and: [
              { $gte: ["$discountPrice", min] },
              { $lte: ["$discountPrice", max] }
            ]
          }
        },
        {
          discountPrice: null,
          price: { $gte: min, $lte: max }
        }
      ];
    }

    // 7. Sort Settings
    let sort = { createdAt: -1 }; // default newest
    if (sortBy === 'price-asc') {
      sort = { price: 1 };
    } else if (sortBy === 'price-desc') {
      sort = { price: -1 };
    } else if (sortBy === 'popular') {
      sort = { rating: -1, reviewsCount: -1 };
    }

    const products = await Product.find(query).sort(sort);
    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving products listing'
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product accessory not found'
      });
    }

    return res.status(200).json({
      success: true,
      product
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching product details'
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      categorySlug,
      brand,
      sku,
      price,
      discountPrice,
      stock,
      specifications,
      tags,
      featured,
      bestseller,
      newArrival,
      status
    } = req.body;

    // Check if SKU already exists (only if provided)
    if (sku && sku.trim() !== '') {
      const skuExists = await Product.findOne({ sku: sku.trim() });
      if (skuExists) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU '${sku}' already exists.`
        });
      }
    }

    const uploadedImages = [];

    // 1. Process File Uploads (Multer)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadRes = await uploadImage(file.buffer, file.mimetype);
        uploadedImages.push(uploadRes);
      }
    }

    // 2. Process Base64 or URL Uploads
    let bodyImages = req.body.images;
    if (bodyImages) {
      if (typeof bodyImages === 'string') {
        bodyImages = [bodyImages];
      }
      for (const img of bodyImages) {
        if (!img) continue;
        if (img.startsWith('data:image')) {
          const uploadRes = await uploadImage(img);
          uploadedImages.push(uploadRes);
        } else if (img.startsWith('http')) {
          // Store external link directly
          uploadedImages.push({
            url: img,
            public_id: 'external_url_' + Date.now()
          });
        }
      }
    }

    // Parse specifications array
    let parsedSpecs = [];
    if (specifications) {
      parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
    }

    // Parse tags array
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    const newProduct = new Product({
      name,
      description: description || '',
      categorySlug,
      brand: brand || '',
      sku: (sku && sku.trim() !== '') ? sku.trim() : undefined,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock),
      images: uploadedImages,
      specifications: parsedSpecs,
      tags: parsedTags,
      featured: featured === 'true' || featured === true,
      bestseller: bestseller === 'true' || bestseller === true,
      newArrival: newArrival === 'true' || newArrival === true,
      status: status || 'active'
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      message: 'Product accessory added successfully',
      product: newProduct
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error creating product record'
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product accessory not found'
      });
    }

    const {
      name,
      description,
      categorySlug,
      brand,
      sku,
      price,
      discountPrice,
      stock,
      specifications,
      tags,
      featured,
      bestseller,
      newArrival,
      status,
      existingImages // keep tracking of images not deleted
    } = req.body;

    // Check SKU collisions
    if (sku && sku.trim() !== '' && sku.trim() !== product.sku) {
      const skuCollision = await Product.findOne({ sku: sku.trim() });
      if (skuCollision) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU '${sku}' already exists.`
        });
      }
    }

    // Only process images if image modifications are requested (full edit vs partial status toggling)
    if (existingImages !== undefined || req.body.images !== undefined || (req.files && req.files.length > 0)) {
      let remainingImages = [];
      let parsedExisting = [];
      if (existingImages) {
        parsedExisting = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      }

      // Remove deleted images from Cloudinary
      for (const oldImg of product.images) {
        const isKept = parsedExisting.some(e => e.url === oldImg.url);
        if (!isKept && oldImg.public_id && !oldImg.public_id.startsWith('external_url')) {
          await deleteImage(oldImg.public_id);
        } else if (isKept) {
          remainingImages.push(oldImg);
        }
      }

      // Process new file uploads
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadRes = await uploadImage(file.buffer, file.mimetype);
          remainingImages.push(uploadRes);
        }
      }

      // Process new Base64 or URL uploads
      let bodyImages = req.body.images;
      if (bodyImages) {
        if (typeof bodyImages === 'string') {
          bodyImages = [bodyImages];
        }
        for (const img of bodyImages) {
          if (!img) continue;
          if (typeof img === 'object' && img.url) {
            // Keep existing image object properties
            remainingImages.push(img);
          } else if (typeof img === 'string') {
            if (img.startsWith('data:image')) {
              const uploadRes = await uploadImage(img);
              remainingImages.push(uploadRes);
            } else if (img.startsWith('http')) {
              remainingImages.push({
                url: img,
                public_id: 'external_url_' + Date.now()
              });
            }
          }
        }
      }
      product.images = remainingImages;
    }
    let parsedSpecs = product.specifications;
    if (specifications) {
      parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
    }

    let parsedTags = product.tags;
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    // Update fields
    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.categorySlug = categorySlug || product.categorySlug;
    product.brand = brand !== undefined ? brand : product.brand;
    product.sku = sku !== undefined ? ((sku && sku.trim() !== '') ? sku.trim() : undefined) : product.sku;
    product.price = price !== undefined ? Number(price) : product.price;
    product.discountPrice = discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : null) : product.discountPrice;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.specifications = parsedSpecs;
    product.tags = parsedTags;
    product.status = status || product.status;
    
    if (featured !== undefined) product.featured = featured === 'true' || featured === true;
    if (bestseller !== undefined) product.bestseller = bestseller === 'true' || bestseller === true;
    if (newArrival !== undefined) product.newArrival = newArrival === 'true' || newArrival === true;

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error updating product record'
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated images on Cloudinary
    for (const img of product.images) {
      if (img.public_id && !img.public_id.startsWith('external_url')) {
        await deleteImage(img.public_id);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Product and associated Cloudinary assets deleted successfully'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting product accessory'
    });
  }
};
