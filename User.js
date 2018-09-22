const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expires: { type: Date, required: true },
  lastNotifiedTransaction: String,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
