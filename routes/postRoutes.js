const express = require('express');
const router = express.Router();
const Post = require('../models/Post'); // Assurez-vous que le modèle existe

// Exemple de route pour récupérer tous les posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find(); // Récupère tous les posts depuis MongoDB
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exemple de route pour créer un post
router.post('/', async (req, res) => {
  try {
    const newPost = new Post(req.body); // Crée un nouveau post depuis le body
    const savedPost = await newPost.save(); // Sauvegarde dans MongoDB
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; // Important : on exporte `router`
