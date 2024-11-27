require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { BearerStrategy } = require('passport-azure-ad');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurer la session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Mettre `secure: true` en production si HTTPS est activé
  })
);

// Configurer Passport pour OAuth
passport.use(
  new BearerStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.CLIENT_ID,
      audience: process.env.CLIENT_ID,
      validateIssuer: true,
      loggingLevel: 'info',
    },
    (token, done) => {
      return done(null, token, null);
    }
  )
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware pour parsing des JSON
app.use(express.json());

// Routes de base
app.get('/', (req, res) => {
  res.send('API Node.js est en cours d\'exécution');
});

// Route de connexion
app.get('/auth/login', (req, res) => {
  const authUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize` +
    `?client_id=${process.env.CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${process.env.REDIRECT_URI}` +
    `&response_mode=query` +
    `&scope=openid profile email`;

  res.redirect(authUrl);
});

// Route de callback
app.get('/auth/callback', async (req, res) => {
  const axios = require('axios');
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Code d\'authentification manquant.');
  }

  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    req.session.token = response.data.access_token;
    res.redirect('/auth/success');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de l\'authentification.');
  }
});

// Route de succès
app.get('/auth/success', (req, res) => {
  if (!req.session.token) {
    return res.status(401).send('Utilisateur non connecté.');
  }

  res.send({ message: 'Authentification réussie', token: req.session.token });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`API en cours d'exécution sur le port ${PORT}`);
});
