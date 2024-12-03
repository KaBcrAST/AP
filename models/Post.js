const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  author_id: { type: String, required: true },
  media: { type: String }, // Le média (image ou vidéo en base64)
  mediaType: { type: String }, // 'image' ou 'video'
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
