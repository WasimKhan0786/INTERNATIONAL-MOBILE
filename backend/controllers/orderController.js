const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving orders'
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order receipt not found'
      });
    }
    return res.status(200).json({
      success: true,
      order
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching order details'
    });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      shopName,
      mobile,
      email,
      products,
      subtotal,
      deliveryCharge,
      discount,
      total,
      paymentMethod,
      address,
      city,
      state,
      pincode,
      orderNotes
    } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required.'
      });
    }

    // 1. Generate Unique Order Number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randStr}`;

    // 2. Map and validate product items
    const sanitizedProducts = (products || []).map(p => ({
      id: (p.id || p._id || '').toString(),
      name: p.name || 'Mobile Accessory',
      brand: p.brand || '',
      price: Number(p.price || 0),
      image: p.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      quantity: Number(p.quantity || 1),
      sku: p.sku || ''
    }));

    const newOrder = new Order({
      orderNumber,
      customerName,
      shopName,
      mobile,
      email: email || '',
      products: sanitizedProducts,
      subtotal: Number(subtotal),
      deliveryCharge: Number(deliveryCharge),
      discount: Number(discount) || 0,
      total: Number(total),
      paymentMethod: paymentMethod || 'Cash on Delivery (COD)',
      address: address || 'N/A',
      city: city || 'N/A',
      state: state || 'N/A',
      pincode: pincode || 'N/A',
      orderNotes: orderNotes || ''
    });

    // Run Mongoose schema validation first
    await newOrder.validate();

    // 3. Validate Stock & ObjectId formats
    for (const item of sanitizedProducts) {
      if (!item.id || !mongoose.Types.ObjectId.isValid(item.id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID reference for '${item.name}'.`
        });
      }

      const prod = await Product.findById(item.id);
      if (!prod) {
        return res.status(400).json({
          success: false,
          message: `Product '${item.name}' was not found in database inventory.`
        });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${prod.name}'. Only ${prod.stock} units remaining.`
        });
      }
    }

    // 4. Deduct stock after validation succeeds
    for (const item of sanitizedProducts) {
      await Product.findByIdAndUpdate(item.id, {
        $inc: { stock: -item.quantity }
      });
    }

    // 5. Save order details
    await newOrder.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error placing order'
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const { status } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;

    // Restore stock if transitioning to Cancelled
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.id, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // Re-deduct stock if recovering from Cancelled status
    if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.id, {
          $inc: { stock: -item.quantity }
        });
      }
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status} successfully.`,
      order
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error updating order status'
    });
  }
};

exports.updateOrderDetails = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;
    const { customerName, shopName, mobile } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (customerName !== undefined) order.customerName = customerName;
    if (shopName !== undefined) order.shopName = shopName;
    if (mobile !== undefined) order.mobile = mobile;

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order details updated successfully.',
      order
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error updating order details'
    });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Restore stock if deleting a non-cancelled order
    if (order.status !== 'Cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.id, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await Order.findByIdAndDelete(order._id);

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting order'
    });
  }
};
