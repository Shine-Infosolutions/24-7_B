import orderModel from "../models/ordermodel.js";
import userModel from "../models/usermodel.js";
import "../models/usermodel.js"; // Ensure model is registered
import addressModel from "../models/addressmodel.js";
import Itemmodel from "../models/itemmodel.js";

export const createOrder = async (req, res) => {
  try {
    const { customer_id, address_id, item_ids } = req.body;

    // Validate customer exists
    const customer = await userModel.findById(customer_id);
    if (!customer) {
      return res.status(400).json({ message: "Invalid customer_id" });
    }

    // Validate address exists
    const address = await addressModel.findById(address_id);
    if (!address) {
      return res.status(400).json({ message: "Invalid address_id" });
    }

    // Validate all items exist
    for (const itemId of item_ids) {
      const item = await Itemmodel.findById(itemId);
      if (!item) {
        return res.status(400).json({ message: `Invalid item_id: ${itemId}` });
      }
    }

    const newOrder = new orderModel(req.body);
    const savedOrder = await newOrder.save();

    const updateduser = await userModel.findByIdAndUpdate(
      customer_id,
      { $push: { orders: savedOrder._id } },
      { new: true }
    );

    // Auto-update order status
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(savedOrder._id, {
        order_status: 2,
        'status_timestamps.accepted': new Date()
      });
    }, 2 * 60000);
    
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(savedOrder._id, {
        order_status: 3,
        'status_timestamps.preparing': new Date()
      });
    }, 5 * 60000);
    
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(savedOrder._id, {
        order_status: 4,
        'status_timestamps.prepared': new Date()
      });
    }, 18 * 60000);
    
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(savedOrder._id, {
        order_status: 5,
        'status_timestamps.out_for_delivery': new Date()
      });
    }, 20 * 60000);
    
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(savedOrder._id, {
        order_status: 6,
        'status_timestamps.delivered': new Date()
      });
    }, 40 * 60000);

    res.status(201).json({ message: "Order placed", order: savedOrder, user: updateduser });
  } catch (err) {
    res.status(500).json({ message: `${err}` });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus, reason } = req.body;
    
    if (!newStatus) {
      return res.status(400).json({ message: "newStatus is required" });
    }
    
    if (![1, 2, 3, 4, 5, 6, 7].includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status. Must be 1-7" });
    }
    
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const updateData = { order_status: newStatus };
    const statusMap = {
      1: 'pending',
      2: 'accepted',
      3: 'preparing', 
      4: 'prepared',
      5: 'out_for_delivery',
      6: 'delivered',
      7: 'cancelled'
    };
    
    if (statusMap[newStatus]) {
      updateData[`status_timestamps.${statusMap[newStatus]}`] = new Date();
    }
    
    if (reason) {
      updateData.status_reason = reason;
    }
    
    const updatedOrder = await orderModel.findByIdAndUpdate(orderId, updateData, { new: true });
    
    res.status(200).json({ 
      message: "Status updated successfully", 
      order: updatedOrder,
      newStatus: statusMap[newStatus].toUpperCase()
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    const { orderIds, newStatus, reason } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "orderIds array is required" });
    }
    
    if (!newStatus || ![1, 2, 3, 4, 5, 6, 7].includes(newStatus)) {
      return res.status(400).json({ message: "Valid newStatus is required" });
    }
    
    const statusMap = {
      1: 'pending',
      2: 'accepted',
      3: 'preparing',
      4: 'prepared', 
      5: 'out_for_delivery',
      6: 'delivered',
      7: 'cancelled'
    };
    
    const updateData = { 
      order_status: newStatus,
      [`status_timestamps.${statusMap[newStatus]}`]: new Date()
    };
    
    if (reason) {
      updateData.status_reason = reason;
    }
    
    const result = await orderModel.updateMany(
      { _id: { $in: orderIds } },
      updateData
    );
    
    res.status(200).json({
      message: "Bulk status update completed",
      updatedCount: result.modifiedCount,
      status: statusMap[newStatus].toUpperCase()
    });
  } catch (error) {
    res.status(500).json({ message: "Bulk update failed", error: error.message });
  }
};

export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await orderModel.findById(orderId, 'order_status status_timestamps');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const statusNames = {
      1: 'PENDING',
      2: 'ACCEPTED',
      3: 'PREPARING',
      4: 'PREPARED',
      5: 'OUT_FOR_DELIVERY', 
      6: 'DELIVERED',
      7: 'CANCELLED'
    };
    
    res.status(200).json({
      orderId,
      currentStatus: order.order_status,
      statusName: statusNames[order.order_status],
      timestamps: order.status_timestamps
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get status", error: error.message });
  }
};

export const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const statusNum = parseInt(status);
    
    if (![1, 2, 3, 4, 5, 6, 7].includes(statusNum)) {
      return res.status(400).json({ message: "Invalid status. Must be 1-7" });
    }
    
    const orders = await orderModel.find({ order_status: statusNum })
      .populate('customer_id', 'name email phone')
      .populate('address_id')
      .sort({ createdAt: -1 });
    
    const statusNames = {
      1: 'PENDING',
      2: 'ACCEPTED', 
      3: 'PREPARING',
      4: 'PREPARED',
      5: 'OUT_FOR_DELIVERY',
      6: 'DELIVERED',
      7: 'CANCELLED'
    };
    
    res.status(200).json({
      status: statusNames[statusNum],
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get orders", error: error.message });
  }
};

export const autoUpdateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const now = new Date();
    const updateData = {
      order_status: 2,
      'status_timestamps.accepted': new Date(now.getTime() + 2 * 60000)
    };
    
    await orderModel.findByIdAndUpdate(orderId, updateData);
    
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(orderId, {
        order_status: 3,
        'status_timestamps.preparing': new Date()
      });
    }, 3 * 60000);
    
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(orderId, {
        order_status: 4,
        'status_timestamps.prepared': new Date()
      });
    }, 16 * 60000);
    
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(orderId, {
        order_status: 5,
        'status_timestamps.out_for_delivery': new Date()
      });
    }, 18 * 60000);
    
    setTimeout(async () => {
      await orderModel.findByIdAndUpdate(orderId, {
        order_status: 6,
        'status_timestamps.delivered': new Date()
      });
    }, 38 * 60000);
    
    res.status(200).json({ message: "Auto-update started for order" });
  } catch (error) {
    res.status(500).json({ message: "Failed to start auto-update", error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { customer_id } = req.body;
    
    const orders = await orderModel.find({ customer_id }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().populate('customer_id').lean();
    res.status(200).json({ message: "Orders fetched successfully", orders });
  } catch (err) {
    res.status(500).json({ message: "Server error", err: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel.findById(id)
      .populate('customer_id')
      .populate('address_id')
      .populate('item_ids')
      .populate('addon');
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.status(200).json({ message: "Order fetched successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getOrderWithTimestamps = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderModel.findById(orderId).populate('customer_id');
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const statusNames = {
      1: 'PENDING',
      2: 'ACCEPTED', 
      3: 'ORDER PREPARING',
      4: 'ORDER PREPARED',
      5: 'OUT FOR DELIVERY',
      6: 'ORDER DELIVERED',
      7: 'ORDER CANCELLED'
    };
    
    const response = {
      ...order.toObject(),
      current_status: statusNames[order.order_status],
      timeline: {
        pending: order.status_timestamps.pending,
        accepted: order.status_timestamps.accepted,
        preparing: order.status_timestamps.preparing,
        prepared: order.status_timestamps.prepared,
        out_for_delivery: order.status_timestamps.out_for_delivery,
        delivered: order.status_timestamps.delivered,
        cancelled: order.status_timestamps.cancelled
      }
    };
    
    res.status(200).json({ message: "Order fetched successfully", order: response });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCurrentOrder = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }
    
    // Convert phone to number if it's a string
    const phoneNumber = typeof phone === 'string' ? parseInt(phone) : phone;
    
    // Find user by phone
    const user = await userModel.findOne({ phone: phoneNumber });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    // Find latest order
    const latestOrder = await orderModel.findOne({
      customer_id: user._id
    }).populate('item_ids').populate('address_id').sort({ createdAt: -1 });
    
    if (!latestOrder) {
      return res.json({ success: false, message: "No order found" });
    }
    
    res.json({ success: true, order: latestOrder });
  } catch (error) {
    console.error('getCurrentOrder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
