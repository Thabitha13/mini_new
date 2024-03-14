var mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    cans: String,
    address: String,
    name: String,
    phoneNo: String,
    deliverystatus: {type: String, default: 'pending'},
    status: { type : String, default:  'Active' }
});

module.exports = mongoose.model('orderModel', orderSchema);