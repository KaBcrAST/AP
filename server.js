const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const querystring = require('querystring');
const crypto = require('crypto');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Autoriser CORS (ajustez l'URL du frontend en production)
app.use(cors({
  origin: 'http://localhost:3000', // URL de votre frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Générateur de code challenge et code verifier pour PKCE
const generatePKCECodes = () => {
  const codeVerifier = crypto.randomBytes(64).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
};

// Stocker les codes PKCE en mémoire (remplacer par une base de données dans un vrai projet)
const pkceCodes = {};

// Point d'entrée pour commencer le processus de login (redirection vers Azure AD)
app.get('/auth/login', (req, res) => {
  const { codeChallenge, codeVerifier } = generatePKCECodes();
  const state = crypto.randomBytes(16).toString('hex'); // Générer un état unique pour la session

  // Stocker le code verifier et l'état (en production, utilisez une session ou une base de données)
  pkceCodes[state] = codeVerifier;

  const authUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize`;
  const params = querystring.stringify({
    client_id: process.env.CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.REDIRECT_URI,
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
  });

  // Rediriger l'utilisateur vers Azure AD pour se connecter
  res.redirect(`${authUrl}?${params}`);
});

// Route pour récupérer l'access token après la redirection d’Azure
app.get('/auth/openid/return', async (req, res) => {
  const { code, state } = req.query;

  // Vérifier que nous avons un code et un état valides
  if (!code || !state || !pkceCodes[state]) {
    return res.status(400).json({ error: 'Code ou état manquant/invalid dans la requête.' });
  }

  try {
    // Échanger le code contre un token
    const tokenUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
    const tokenResponse = await axios.post(tokenUrl, querystring.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.REDIRECT_URI,
      code_verifier: pkceCodes[state],
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Supprimer le code verifier utilisé
    delete pkceCodes[state];

    const { access_token } = tokenResponse.data;

    // Utiliser le token pour récupérer les informations utilisateur via Microsoft Graph
    const userInfo = await getUserInfoFromGraph(access_token);

    res.json(userInfo); // Retourner les données utilisateur au frontend
  } catch (error) {
    console.error('Erreur lors de la récupération du token ou des informations utilisateur:', error.response?.data || error.message);
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

    // Retourner les données utilisateur
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'appel Microsoft Graph:', error.response?.data || error.message);
    throw new Error('Impossible de récupérer les informations utilisateur depuis Microsoft Graph.');
  }
};

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
