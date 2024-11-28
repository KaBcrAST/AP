const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { msalInstance } = require('./authConfig');  // Assurez-vous que msalInstance est bien importé

const app = express();
const port = process.env.PORT || 3000;

// Configuration CORS pour autoriser les demandes depuis ton front-end React
const corsOptions = {
  origin: 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net', // Remplace par l'URL de ton front-end React
  methods: 'GET,POST,PUT,DELETE',
  credentials: true,  // Permet d'envoyer des cookies avec les requêtes
};

app.use(cors(corsOptions));  // Ajoute le middleware CORS

// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

// Route pour se connecter via Azure
app.get('/auth/login', (req, res) => {
  const authUrl = msalInstance.getAuthCodeUrl({
    ...loginRequest,
    redirectUri: process.env.REDIRECT_URI,  // Redirection après l'authentification
  });
  res.redirect(authUrl);
});

// Route pour le callback après l'authentification
app.get('/auth/callback', async (req, res) => {
  try {
    const response = await msalInstance.acquireTokenByCode({
      code: req.query.code,
      redirectUri: process.env.REDIRECT_URI,
      clientSecret: process.env.CLIENT_SECRET,
    });
    
    // Sauvegarde le token dans la session
    req.session.accessToken = response.accessToken;
    res.redirect('https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net');  // Redirige vers le front-end
  } catch (error) {
    console.error('Erreur de récupération du token :', error);
    res.status(500).send('Erreur d\'authentification');
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
