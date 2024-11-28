require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

// Configuration CORS
const allowedOrigins = ['https://<votre-url-front>', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Configuration Azure AD
const CLIENT_ID = 'b4a2a829-d4ce-49b9-9341-22995e0476ba';
const REDIRECT_URI = 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/openid/return';
const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

// Utilisation des sessions pour stocker le code verifier généré
app.use(session({
  secret: 'votre-secret-de-session',
  resave: false,
  saveUninitialized: true,
}));

// Endpoint pour démarrer l'authentification OAuth
app.get('/auth/login', (req, res) => {
  // Génération du code verifier
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  req.session.codeVerifier = codeVerifier;

  // Génération du code challenge basé sur le code verifier (PKCE)
  const codeChallenge = crypto.createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_mode=query&scope=openid profile email&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  res.redirect(authUrl);
});

// Callback pour recevoir le code d'autorisation et récupérer les tokens
app.get('/auth/openid/return', async (req, res) => {
  const { code } = req.query;
  const codeVerifier = req.session.codeVerifier;  // Récupérer le code verifier stocké en session

  if (!code) {
    return res.status(400).send('Code d’autorisation manquant');
  }

  try {
    // Demander le token en utilisant le code d'autorisation et le code verifier (sans client secret)
    const tokenResponse = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code: code,  // Le code d’autorisation reçu
        code_verifier: codeVerifier,  // Le code verifier généré lors de l’authentification
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, id_token, refresh_token } = tokenResponse.data;

    // Log de la réponse pour vérifier si tout est correct
    console.log("Token Response:", tokenResponse.data);

    // Retourne les tokens au client
    res.json({ access_token, id_token, refresh_token });
  } catch (error) {
    // Capture l'erreur complète et affiche-la dans la console pour le débogage
    console.error('Erreur lors de la récupération du token:', error.response?.data || error.message);

    if (error.response) {
      // Si une réponse d'erreur est renvoyée par Azure AD, on la log également
      res.status(error.response.status).json({
        message: 'Erreur de récupération du token',
        error: error.response.data,
      });
    } else {
      // Si une erreur inconnue survient (par exemple, un timeout), on la gère ici
      res.status(500).json({ message: 'Erreur inconnue lors de la récupération du token' });
    }
  }
});

// Endpoint pour obtenir les informations de l'utilisateur avec le token d'accès
app.get('/user-info', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Token manquant');

  try {
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json(userResponse.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur', error.response.data);
    res.status(500).send('Erreur lors de la récupération des informations utilisateur');
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API démarrée sur https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net`));
