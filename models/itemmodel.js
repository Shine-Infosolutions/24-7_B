import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: {type:String},
    price:{type:String},
    originalPrice:{type:String},
    quantity: {type:String},
    description:{type:String},
    longDescription:{type:String},
    image:{type:String},
    veg:{type:Boolean},
    rating:{type:Number},
    deliveryTime:{type:Number, default: 30},
    available: {type:Boolean, default: true},
    category: {type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true},
    variation: [{ type: mongoose.Schema.Types.ObjectId, ref:'variations'}],
    addon: [{ type: mongoose.Schema.Types.ObjectId, ref:'addon'}]
})

const Itemmodel = mongoose.models.Item || mongoose.model('Item', itemSchema);
export default Itemmodel;
