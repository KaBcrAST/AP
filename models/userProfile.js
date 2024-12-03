const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // ID OAuth de l'utilisateur
  displayName: { type: String }, // Nom récupéré via OAuth
  bio: { type: String, default: '' }, // Bio personnalisée
  isPrivate: { type: Boolean, default: false }, // Profil privé/public
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
