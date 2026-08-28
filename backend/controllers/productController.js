const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
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
      status,
      all // flag if called from admin side (loads inactive/out-of-stock items)
    } = req.query;

    const andConditions = [];

    // 1. Status Filter (Only active on customer side unless explicitly filtered)
    if (!all || all === 'false') {
      andConditions.push({ status: 'active' });
    } else if (status) {
      andConditions.push({ status: status });
    }

    // 2. Search Keyword
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // 3. Category Slug
    if (category) {
      andConditions.push({ categorySlug: category });
    }

    // 4. Brand
    if (brand) {
      andConditions.push({ brand: brand });
    }

    // 5. In Stock availability
    if (inStock === 'true') {
      andConditions.push({ stock: { $gt: 0 } });
    }

    // 6. Price Boundaries (check against discountPrice or price)
    if (minPrice || maxPrice) {
      const min = Number(minPrice) || 0;
      const max = Number(maxPrice) || 9999999;
      
      andConditions.push({
        $or: [
          {
            discountPrice: { $gte: min, $lte: max, $ne: null }
          },
          {
            discountPrice: null,
            price: { $gte: min, $lte: max }
          }
        ]
      });
    }

    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    // 7. Sort Settings
    let sort = { createdAt: -1 }; // default newest
    if (sortBy === 'price-asc') {
      sort = { price: 1 };
    } else if (sortBy === 'price-desc') {
      sort = { price: -1 };
    } else if (sortBy === 'popular' || sortBy === 'bestselling') {
      sort = { rating: -1, reviewsCount: -1 };
    } else if (sortBy === 'oldest') {
      sort = { createdAt: 1 };
    } else if (sortBy === 'stock-asc') {
      sort = { stock: 1 };
    } else if (sortBy === 'stock-desc') {
      sort = { stock: -1 };
    }

    const products = await Product.find(query).select('-description -specifications').sort(sort);

    // Fetch orders to calculate dynamic bestsellers based on sales volume
    let salesMap = {};
    try {
      const orders = await Order.find({ status: { $ne: 'Cancelled' } });
      orders.forEach(order => {
        (order.products || []).forEach(p => {
          if (p.id) {
            salesMap[p.id.toString()] = (salesMap[p.id.toString()] || 0) + (p.quantity || 0);
          }
        });
      });
    } catch (err) {
      console.error("Bestseller sales map calculation error", err);
    }

    const mappedProducts = products.map(prod => {
      const productObj = prod.toObject();
      productObj.id = productObj._id ? productObj._id.toString() : (productObj.id ? productObj.id.toString() : '');
      const salesCount = salesMap[productObj.id] || 0;
      if (salesCount > 0) {
        productObj.bestseller = true;
      }
      return productObj;
    });

    return res.status(200).json({
      success: true,
      count: mappedProducts.length,
      products: mappedProducts
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

    const productObj = product.toObject();
    let salesCount = 0;
    try {
      const orders = await Order.find({ 
        status: { $ne: 'Cancelled' },
        'products.id': productObj._id.toString() 
      });
      orders.forEach(order => {
        (order.products || []).forEach(p => {
          if (p.id === productObj._id.toString() || p.id === productObj.id) {
            salesCount += (p.quantity || 0);
          }
        });
      });
    } catch (err) {
      console.error("Single product bestseller calculation error", err);
    }

    if (salesCount > 0) {
      productObj.bestseller = true;
    }

    return res.status(200).json({
      success: true,
      product: productObj
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
      pricePerPiece,
      stock,
      specifications,
      tags,
      featured,
      bestseller,
      newArrival,
      status
    } = req.body;

    // Sanitize and check SKU to prevent duplicate key errors (empty, null, "null", "undefined")
    let cleanSku = undefined;
    if (sku && sku.trim() !== '') {
      const ts = sku.trim();
      if (ts.toLowerCase() !== 'undefined' && ts.toLowerCase() !== 'null') {
        cleanSku = ts;
      }
    }

    if (cleanSku) {
      const skuExists = await Product.findOne({ sku: cleanSku });
      if (skuExists) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU '${cleanSku}' already exists.`
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
      sku: cleanSku,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      pricePerPiece: pricePerPiece ? Number(pricePerPiece) : null,
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
      pricePerPiece,
      stock,
      specifications,
      tags,
      featured,
      bestseller,
      newArrival,
      status,
      existingImages // keep tracking of images not deleted
    } = req.body;

    // Sanitize and check SKU collisions to prevent duplicate key errors
    let cleanSku = undefined;
    const isSkuProvided = sku !== undefined;
    if (isSkuProvided) {
      if (sku && sku.trim() !== '') {
        const ts = sku.trim();
        if (ts.toLowerCase() !== 'undefined' && ts.toLowerCase() !== 'null') {
          cleanSku = ts;
        }
      }
    }

    if (isSkuProvided && cleanSku && cleanSku !== product.sku) {
      const skuCollision = await Product.findOne({ sku: cleanSku });
      if (skuCollision) {
        return res.status(400).json({
          success: false,
          message: `Product with SKU '${cleanSku}' already exists.`
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
    if (isSkuProvided) {
      product.sku = cleanSku;
    }
    product.price = price !== undefined ? Number(price) : product.price;
    product.discountPrice = discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : null) : product.discountPrice;
    product.pricePerPiece = pricePerPiece !== undefined ? (pricePerPiece ? Number(pricePerPiece) : null) : product.pricePerPiece;
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

exports.bulkUploadProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload. Expected an array of products.'
      });
    }

    const ops = [];
    let processedCount = 0;

    for (const p of products) {
      if (!p.name || !p.categorySlug || p.price === undefined || p.stock === undefined) {
        continue; // skip invalid records
      }

      const categorySlug = p.categorySlug.toString().toLowerCase().trim().replace(/\s+/g, '-');

      const updateFields = {
        name: p.name.toString().trim(),
        description: p.description ? p.description.toString().trim() : '',
        categorySlug: categorySlug,
        brand: p.brand ? p.brand.toString().trim() : '',
        price: Number(p.price),
        discountPrice: p.discountPrice !== undefined && p.discountPrice !== null && p.discountPrice !== '' ? Number(p.discountPrice) : null,
        stock: Number(p.stock),
        tags: Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.toString().split(',').map(t => t.trim()).filter(Boolean) : []),
        status: p.status || 'active',
        featured: p.featured === 'true' || p.featured === true,
        bestseller: p.bestseller === 'true' || p.bestseller === true,
        newArrival: p.newArrival !== undefined ? (p.newArrival === 'true' || p.newArrival === true) : true
      };

      if (p.images) {
        let imgArray = [];
        if (Array.isArray(p.images)) {
          imgArray = p.images.map(img => {
            if (typeof img === 'string') {
              return {
                url: img.trim(),
                public_id: 'external_url_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
              };
            }
            return img;
          });
        } else if (typeof p.images === 'string' && p.images.trim()) {
          imgArray = p.images.split(';').map(url => ({
            url: url.trim(),
            public_id: 'external_url_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
          }));
        }
        if (imgArray.length > 0) {
          updateFields.images = imgArray;
        }
      }

      processedCount++;

      if (p.sku && p.sku.toString().trim()) {
        const skuStr = p.sku.toString().trim();
        ops.push({
          updateOne: {
            filter: { sku: skuStr },
            update: { $set: updateFields },
            upsert: true
          }
        });
      } else {
        const randomSku = 'SKU-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        ops.push({
          insertOne: {
            document: {
              ...updateFields,
              sku: randomSku
            }
          }
        });
      }
    }

    if (ops.length > 0) {
      const result = await Product.bulkWrite(ops);
      return res.status(200).json({
        success: true,
        message: `Bulk import completed. Processed ${processedCount} rows.`,
        details: {
          inserted: result.upsertedCount + result.insertedCount,
          updated: result.modifiedCount,
          matched: result.matchedCount
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No valid products were found to process.'
      });
    }

  } catch (err) {
    console.error('Bulk upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error processing bulk products upload'
    });
  }
};
