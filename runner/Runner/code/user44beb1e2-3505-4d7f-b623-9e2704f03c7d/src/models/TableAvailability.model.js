const mongoose = require('mongoose');
const tableAvailabilitySchema = new mongoose.Schema({
  tableId: String,
  seatingCapacity: Number,
  occupancyStatus: Boolean
});
module.exports = mongoose.model('TableAvailability', tableAvailabilitySchema);