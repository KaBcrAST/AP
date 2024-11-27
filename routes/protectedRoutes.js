const express = require('express');
const router = express.Router();

// Route protégée nécessitant un scope spécifique
router.get('/data', (req, res) => {
  res.json({ message: 'Données accessibles uniquement aux utilisateurs authentifiés.' });
});

// Route nécessitant un scope spécifique (e.g., Storage.ReadWrite)
router.get('/admin', (req, res) => {
  res.json({ message: 'Accès autorisé avec le scope Storage.ReadWrite.' });
});

module.exports = router;
