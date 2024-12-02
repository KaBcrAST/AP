const mongoose = require('mongoose');

const mediaPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  media_url: { type: String },
  author_id: { type: String, required: true }, // ID de l'utilisateur (OAuth)
  is_published: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MediaPost', mediaPostSchema);
