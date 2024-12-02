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
    const { title, body, author_id } = req.body;

    // Vérification des données
    if (!author_id) {
      return res.status(400).json({ error: 'Author ID is required.' });
    }

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required.' });
    }

    // Création du post
    const newPost = new Post({ title, body, author_id });
    const savedPost = await newPost.save();

    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});
module.exports = router; // Important : on exporte `router`
