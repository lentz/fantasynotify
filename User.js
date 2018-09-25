const mongoose = require('mongoose');
const mongooseEncryption = require('mongoose-encryption');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expires: { type: Date, required: true },
  leagues: [{
    _id: false,
    key: { type: String, required: true },
    name: { type: String, required: true },
    lastNotifiedTransaction: String,
  }],
}, { timestamps: true });

userSchema.plugin(mongooseEncryption, {
  encryptionKey: process.env.MONGO_ENCRYPTION_KEY,
  signingKey: process.env.MONGO_SIGNING_KEY,
  encryptedFields: ['accessToken', 'refreshToken'],
  additionalAuthenticatedFields: ['email'],
});

module.exports = mongoose.model('User', userSchema);
