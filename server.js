const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const querystring = require('querystring');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Autoriser CORS (ajustez l'URL du frontend en production)
app.use(cors({
  origin: 'http://localhost:3000', // URL de votre frontend en développement ou production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Point d'entrée pour commencer le processus de login (redirection vers Azure AD)
app.get('/auth/login', (req, res) => {
  const tenantId = '3b644da5-0210-4e60-b8dc-0beec1614542';  // Hardcodé tenant ID
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`;

  const params = querystring.stringify({
    client_id: process.env.CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.REDIRECT_URI,
    scope: 'openid profile email',
    state: '12345',  // Un paramètre de sécurité
    code_challenge: req.query.code_challenge,  // Récupérer le code_challenge envoyé depuis le frontend
    code_challenge_method: 'S256', // Méthode de hashage utilisée
  });

  // Rediriger l'utilisateur vers Azure AD pour se connecter
  res.redirect(`${authUrl}?${params}`);
});

// Route pour récupérer l'access token après la redirection d'Azure
app.get('/auth/openid/return', async (req, res) => {
  const { code } = req.query;
  const { code_verifier } = req.headers;  // Récupérer le code_verifier de l'en-tête

  if (!code || !code_verifier) {
    return res.status(400).json({ error: 'Code ou code_verifier manquants.' });
  }

  try {
    const tenantId = '3b644da5-0210-4e60-b8dc-0beec1614542';  // Hardcodé tenant ID
    // Échanger le code contre un token avec PKCE
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const tokenResponse = await axios.post(tokenUrl, querystring.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.REDIRECT_URI,
      code_verifier: code_verifier,  // Envoyer le code_verifier pour valider l'échange
    }));

    const { access_token } = tokenResponse.data;

    // Une fois le token récupéré, utiliser l'API Microsoft Graph pour obtenir les informations utilisateur
    const userInfo = await getUserInfoFromGraph(access_token);

    res.json(userInfo); // Retourner les données utilisateur au frontend
  } catch (error) {
    console.error('Erreur lors de la récupération du token ou des informations utilisateur:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de l\'authentification.' });
  }
});

// Fonction pour interroger l'API Microsoft Graph et obtenir les infos utilisateur
const getUserInfoFromGraph = async (token) => {
  try {
    const response = await axios.get(process.env.API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Retourner les données utilisateurs (vous pouvez ajuster les champs selon vos besoins)
    return response.data;
  } catch (error) {
    throw new Error('Impossible de récupérer les informations utilisateur depuis Microsoft Graph.');
  }
};

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
