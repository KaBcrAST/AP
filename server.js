const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const passport = require('passport');
const { BearerStrategy } = require('passport-azure-ad');
const app = express();

const CLIENT_ID = 'b4a2a829-d4ce-49b9-9341-22995e0476ba';
const CLIENT_SECRET = 'votre-secret-client';  // Remplacez par votre secret client
const TENANT_ID = '3b644da5-0210-4e60-b8dc-0beec1614542';
const REDIRECT_URI = 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/callback';

// Configuration de Passport pour Azure AD
passport.use(new BearerStrategy({
  identityMetadata: `https://login.microsoftonline.com/${TENANT_ID}/.well-known/openid-configuration`,
  clientID: CLIENT_ID,
  validateIssuer: true,
  issuer: `https://sts.windows.net/${TENANT_ID}/`,
  passReqToCallback: false
}, (token, done) => {
  return done(null, token);
}));

app.use(passport.initialize());

// Endpoint pour démarrer l'authentification OAuth
app.post('/api/auth/login', (req, res) => {
  const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?` +
    `client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_mode=query&scope=openid profile email offline_access`;

  // Redirige vers Azure AD
  res.json({ authUrl });
});

// Endpoint pour gérer le callback d'Azure AD
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;  // Récupère le code d'autorisation
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  try {
    // Échange du code contre un access_token
    const response = await axios.post(tokenUrl, qs.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }));

    const accessToken = response.data.access_token;

    // Renvoie l'access token à React
    res.json({ accessToken });
  } catch (error) {
    console.error('Erreur lors de l\'échange du code:', error);
    res.status(500).json({ error: 'Erreur d\'authentification' });
  }
});

// Exemple d'endpoint sécurisé
app.get('/api/protected', passport.authenticate('oauth-bearer', { session: false }), (req, res) => {
  res.json({ message: 'Accès protégé réussi' });
});

// Lancer le serveur
app.listen(3001, () => {
  console.log('Backend API démarré sur http://localhost:3001');
});
