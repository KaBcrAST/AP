require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');
const session = require('express-session');  // Middleware pour gérer les sessions

const app = express();
app.use(bodyParser.json());

// Configuration CORS
const allowedOrigins = ['https://frontend.example.com', 'http://localhost:3000']; // Remplacez par votre URL frontend
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Middleware de session pour stocker le code verifier
app.use(session({
  secret: 'votre-clé-secrète',  // Utiliser une clé secrète pour signer la session
  resave: false,
  saveUninitialized: true
}));

// Config Azure AD
const CLIENT_ID = 'b4a2a829-d4ce-49b9-9341-22995e0476ba';  // Remplacez par votre ID client
const REDIRECT_URI = 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/openid/return';  // URI de redirection de votre backend
const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

// Fonction pour générer le code verifier (PKCE)
function generateCodeVerifier() {
  const buffer = crypto.randomBytes(32);
  return buffer.toString('base64url');  // Base64 URL-safe encoding
}

// Fonction pour générer le code challenge (PKCE)
function generateCodeChallenge(codeVerifier) {
  return crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');  // Base64 URL-safe encoding
}

// Endpoint pour rediriger vers Azure OAuth
app.get('/auth/login', (req, res) => {
  // Générer code verifier et challenge PKCE
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Sauvegarder le codeVerifier en session pour l'utiliser lors de l'échange du code
  req.session.codeVerifier = codeVerifier;  // Cela nécessite un middleware de session

  // URL d'authentification avec PKCE
  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=openid profile email`;
  
  res.redirect(authUrl);
});

// Callback pour recevoir le code d'autorisation et échanger contre un token
app.get('/auth/openid/return', async (req, res) => {
  const { code } = req.query;
  const codeVerifier = req.session.codeVerifier;  // Récupérer le code verifier stocké en session

  if (!code) {
    return res.status(400).send('Code d’autorisation manquant');
  }

  try {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend démarré sur le port ${PORT}`));
