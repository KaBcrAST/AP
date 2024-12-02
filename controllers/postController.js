const MediaPost = require('../models/mediaPost');

// Récupérer tous les posts
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await MediaPost.find();  // Récupérer tous les posts
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching all posts:', error.message);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// Récupérer les posts d'un utilisateur
exports.getUserPosts = async (req, res) => {
  try {
    const { author_id } = req.query;

    if (!author_id) {
      return res.status(400).json({ message: 'Author ID is required' });
    }

    const userPosts = await MediaPost.find({ author_id });
    res.status(200).json(userPosts);
  } catch (error) {
    console.error('Error fetching user posts:', error.message);
    res.status(500).json({ message: 'Error fetching user posts' });
  }
};

// Créer un nouveau post
exports.createPost = async (req, res) => {
  try {
    const { title, body, author_id } = req.body;
    const media_url = req.file ? req.file.path : null;  // Utiliser le chemin du fichier téléchargé si présent

    if (!title || !body || !author_id) {
      return res.status(400).json({ message: 'Title, body, and author ID are required' });
    }

    const newPost = new MediaPost({
      title,
      body,
      author_id,
      media_url,
      is_published: true,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Error creating post:', error.message);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
};
