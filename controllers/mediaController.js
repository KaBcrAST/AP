const Media = require('../models/mediaModel');

// GET all media posts
exports.getAllMedia = async (req, res) => {
    try {
        const mediaPosts = await Media.find();
        res.status(200).json(mediaPosts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET a single media post by ID
exports.getMediaById = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).json({ message: 'Media not found' });
        res.status(200).json(media);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE a new media post
exports.createMedia = async (req, res) => {
    try {
        const { title, description, mediaUrl } = req.body;
        const newMedia = new Media({ title, description, mediaUrl });
        const savedMedia = await newMedia.save();
        res.status(201).json(savedMedia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE a media post
exports.updateMedia = async (req, res) => {
    try {
        const updatedMedia = await Media.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedMedia) return res.status(404).json({ message: 'Media not found' });
        res.status(200).json(updatedMedia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE a media post
exports.deleteMedia = async (req, res) => {
    try {
        const deletedMedia = await Media.findByIdAndDelete(req.params.id);
        if (!deletedMedia) return res.status(404).json({ message: 'Media not found' });
        res.status(200).json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
