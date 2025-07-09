const mongoose = require('mongoose');
const foodMenuSchema = new mongoose.Schema({
  itemName: String,
  category: String,
  price: Number,
  availabilityStatus: Boolean
});
module.exports = mongoose.model('FoodMenu', foodMenuSchema);