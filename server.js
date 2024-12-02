const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const postRoutes = require('./routes/postRoutes'); // Importation des routes pour les posts

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Middleware pour les JSON
app.use(express.json());

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

// Route d'accueil pour tester si le serveur tourne
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
