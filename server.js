require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const CLIENT_ID = 'b4a2a829-d4ce-49b9-9341-22995e0476ba'; // Votre ID d'application Azure
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Secret stocké dans un fichier .env
const REDIRECT_URI = 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/callback';
const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Endpoint pour rediriger vers Azure OAuth
app.get('/auth/login', (req, res) => {
  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_mode=query&scope=openid profile email`;
  res.redirect(authUrl);
});

// Endpoint de callback pour récupérer les tokens
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Code d’autorisation manquant');
  }

  try {
    const tokenResponse = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, id_token } = tokenResponse.data;

    // Retourne les tokens au frontend
    res.json({ access_token, id_token });
  } catch (error) {
    console.error('Erreur lors de la récupération du token', error.response?.data || error.message);
    res.status(500).send('Erreur lors de la récupération du token');
  }
});

// Endpoint pour récupérer les informations utilisateur
app.get('/user-info', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).send('Token manquant');
  }

  try {
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json(userResponse.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur', error.response?.data || error.message);
    res.status(500).send('Erreur lors de la récupération des informations utilisateur');
  }
});

// Lancer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
