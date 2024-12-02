const express = require('express');
const router = express.Router();
const {
    getAllMedia,
    getMediaById,
    createMedia,
    updateMedia,
    deleteMedia,
} = require('../controllers/mediaController');

// Routes
router.get('/', getAllMedia);
router.get('/:id', getMediaById);
router.post('/', createMedia);
router.put('/:id', updateMedia);
router.delete('/:id', deleteMedia);

module.exports = router;
