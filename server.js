const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const querystring = require('querystring');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Mettre le TENANT_ID en dur pour éviter les erreurs
const tenantId = '3b644da5-0210-4e60-b8dc-0beec1614542';

// Configuration CORS pour autoriser l'origine du frontend
app.use(cors({
  origin: 'http://localhost:3000', // Remplacez par l'URL de votre frontend en production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Point d'entrée pour rediriger vers Azure AD pour l'authentification
app.get('/auth/login', (req, res) => {
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;
  const params = querystring.stringify({
    client_id: process.env.CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.REDIRECT_URI,
    scope: 'openid profile email',
    state: '12345', // Un paramètre de sécurité (vous pouvez le rendre dynamique)
  });

  // Rediriger l'utilisateur vers Azure AD
  res.redirect(`${authUrl}?${params}`);
});

// Route pour gérer le callback d'Azure AD après authentification
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Logs pour déboguer les paramètres reçus
  console.log('Query Params:', req.query);

  if (!code) {
    console.error('Code manquant dans la requête.');
    return res.status(400).json({ error: 'Code manquant dans la requête.' });
  }

  try {
    // Échanger le code contre un access token
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const tokenResponse = await axios.post(tokenUrl, querystring.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.REDIRECT_URI,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = tokenResponse.data;

    console.log('Access Token:', access_token);

    // Récupérer les infos utilisateur depuis Microsoft Graph
    const userInfo = await getUserInfoFromGraph(access_token);

    res.json(userInfo); // Retourner les informations utilisateur au frontend
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error.response?.data || error.message);
    res.status(500).json({ error: 'Une erreur est survenue lors de l\'authentification.' });
  }
});

// Fonction pour interroger Microsoft Graph API et récupérer les infos utilisateur
const getUserInfoFromGraph = async (token) => {
  try {
    const response = await axios.get(process.env.API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Retourner les données utilisateur
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des infos utilisateur:', error.response?.data || error.message);
    throw new Error('Impossible de récupérer les informations utilisateur depuis Microsoft Graph.');
  }
};

// Route racine pour vérifier si le serveur est en ligne
app.get('/', (req, res) => {
  res.send('Serveur en ligne et opérationnel.');
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
