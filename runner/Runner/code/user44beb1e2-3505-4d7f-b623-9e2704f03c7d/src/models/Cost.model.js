const mongoose = require('mongoose');
const costSchema = new mongoose.Schema({
  orderId: String,
  totalAmount: Number,
  discount: Number,
  finalAmount: Number
});
module.exports = mongoose.model('Cost', costSchema);