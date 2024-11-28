require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const { OIDCStrategy } = require('passport-azure-ad');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Configuration CORS pour autoriser les requêtes de ton frontend
const allowedOrigins = [
  "https://ton-domaine-en-production",  // Mets ici l'URL de ton app frontend en production
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS non autorisé pour cette origine.'));
      }
    },
    credentials: true, // Permet d'envoyer des cookies pour maintenir la session
  })
);

// Middleware pour gérer les sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET,  // Utilisation de la variable d'environnement pour le secret
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Utiliser des cookies sécurisés en production
      httpOnly: true,
    },
  })
);

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuration de la stratégie Passport avec Azure AD
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/.well-known/openid-configuration`,  // Utilisation de la variable d'environnement pour le Tenant ID
      clientID: process.env.CLIENT_ID,  // Utilisation de la variable d'environnement pour le Client ID
      clientSecret: process.env.CLIENT_SECRET,  // Utilisation de la variable d'environnement pour le Client Secret
      responseType: 'code',
      responseMode: 'query',
      redirectUrl: 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/openid/return',  // Redirection vers l'URL de prod
      passReqToCallback: false,
      scope: ['profile', 'email'],
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      return done(null, profile); // Stockage du profil dans la session
    }
  )
);

// Sérialisation et désérialisation de l'utilisateur
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Route de login
app.get('/login', (req, res) => {
  res.send('<a href="/auth/openid">Login with Azure AD</a>');
});

// Route pour démarrer l'authentification
app.get(
  '/auth/openid',
  passport.authenticate('azuread-openidconnect', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.redirect('/profile'); // Redirige vers le profil après authentification réussie
  }
);

// Route de retour après authentification réussie
app.get(
  '/auth/openid/return',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

// Route pour afficher le profil de l'utilisateur
app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.json(req.user); // Retourne les informations du profil utilisateur
});

// Route pour obtenir un token (si tu veux utiliser le token d'accès)
app.get('/auth/token', (req, res) => {
  const code = req.query.code;
  
  axios
    .post(`https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`, {
      client_id: process.env.CLIENT_ID,  // Utilisation de la variable d'environnement pour le Client ID
      client_secret: process.env.CLIENT_SECRET,  // Utilisation de la variable d'environnement pour le Client Secret
      code: code,
      redirect_uri: 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/openid/return',  // Redirection vers l'URL de prod
      grant_type: 'authorization_code',
      scope: 'profile email',
    })
    .then((response) => {
      res.json(response.data); // Retourne le token d'accès
    })
    .catch((err) => {
      console.error("Erreur d'échange du code d'autorisation : ", err);
      res.status(500).send("Erreur de récupération du token");
    });
});

// Démarrer le serveur en production
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
