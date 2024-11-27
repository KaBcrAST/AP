require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Configuration CORS
const allowedOrigins = ['https://<votre-url-front>', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Config Azure AD
const CLIENT_ID = 'b4a2a829-d4ce-49b9-9341-22995e0476ba';
const REDIRECT_URI = 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/openid/return';
const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

// Endpoint pour rediriger vers Azure OAuth
app.get('/auth/login', (req, res) => {
  const authUrl = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_mode=query&scope=openid profile email User.Read`;
  res.redirect(authUrl);
});

// Callback pour recevoir le token
app.get('/auth/openid/return', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    console.error('Code d’autorisation manquant');
    return res.status(400).send('Code d’autorisation manquant');
  }

  try {
    const tokenResponse = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, id_token } = tokenResponse.data;
    res.json({ access_token, id_token });
  } catch (error) {
    console.error('Erreur lors de la récupération du token', error.response?.data || error.message);
    res.status(500).send('Erreur lors de la récupération du token');
  }
});

// Endpoint pour récupérer les informations utilisateur
app.get('/user-info', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Token manquant');

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
app.listen(PORT, () =>
  console.log(`API démarrée sur https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net`)
);
