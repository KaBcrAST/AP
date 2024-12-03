const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const postRoutes = require('./routes/postRoutes'); // Routes pour les posts
const profileRoutes = require('./routes/profileRoutes'); // Routes pour les profils utilisateur

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Middleware pour les JSON avec une limite augmentée
app.use(express.json({ limit: '50mb' }));  // Augmente la limite pour les fichiers volumineux
app.use(express.urlencoded({ limit: '50mb', extended: true }));  // Pour les formulaires si nécessaire

// Configuration de CORS pour autoriser les requêtes venant de ton front-end
app.use(cors({
  origin: 'http://localhost:3000', // Frontend React
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Connexion à MongoDB
const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.COSMOS_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

// Lancer la connexion à la base de données
connectDb();

// Utilisation des routes
app.use('/posts', postRoutes); // Prefix des routes pour les posts
app.use('/profiles', profileRoutes); // Prefix des routes pour les profils utilisateur

// Route d'accueil pour tester si le serveur tourne
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
