const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  totalCans: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNo: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  bookingDate: {
    type: Date,
    default: () => new Date().toISOString().split('T')[0] 
  }
});

module.exports = mongoose.model('Order', orderSchema);
