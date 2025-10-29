import mongoose from "mongoose";


const orderSchema = new mongoose.Schema({
  customer_id: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
  address_id: { type: mongoose.Schema.Types.ObjectId,ref: 'UserAddress',required: true},
  item_ids: [{type: mongoose.Schema.Types.ObjectId,ref: 'Item', required: true }],
  is_variation: {type: Boolean,default: false },
  variation: {type: mongoose.Schema.Types.Mixed, default: null},
  is_addon: {type: Boolean,default: false},
  addon: [{type: mongoose.Schema.Types.ObjectId,ref: 'Addon'}],
  gst: {type: Number,required: true},
  amount: {type: Number,required: true},
  payment_status: {type: String,enum: ['success', 'failed'], required: true},
  payment_data: {type: mongoose.Schema.Types.Mixed,default: {}},
  order_status: {type: Number,enum: [1, 2, 3, 4, 5, 6, 7],default: 1,  required: true},// 1-Pending, 7-Cancelled
  delivery_partner_id: {type: mongoose.Schema.Types.ObjectId,ref: 'DeliveryPartner',default: null},
  delivery_boy: {type: String,enum: ['Own-Delivery', 'Partner-Delivery'], default: 'Own-Delivery'},
  order_source: {type: String,enum: ['Online', 'offline'], default: 'Online'},
  status_timestamps: {
    pending: {type: Date, default: Date.now},
    preparing: {type: Date},
    prepared: {type: Date},
    out_for_delivery: {type: Date},
    delivered: {type: Date},
    cancelled: {type: Date}
  }
}, { timestamps: true });

const orderModel = mongoose.model('Order', orderSchema);
export default orderModel;
