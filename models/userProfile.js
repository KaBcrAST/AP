const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // Utiliser graphUserId comme ID
  graphUserId: { type: String, unique: true, required: true },  // Index unique sur graphUserId
  displayName: { type: String, required: true },
  bio: { type: String },
  isPrivate: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);
