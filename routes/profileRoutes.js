const express = require('express');
const { getProfileById } = require('../controllers/profileController.js');

const router = express.Router();

// Route pour récupérer un profil utilisateur
router.get('/:id', getProfileById);


module.exports = router;
