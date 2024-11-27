const express = require('express');
const passport = require('passport');
const { OIDCStrategy } = require('passport-azure-ad');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Configurer CORS pour autoriser le frontend à communiquer avec l'API
app.use(cors({
  origin: "https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net", // L'URL de ton frontend React
  credentials: true
}));

// Configuration de la stratégie OIDC pour Azure AD
passport.use(new OIDCStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
    responseType: 'code',
    responseMode: 'query',
    redirectUrl: process.env.REDIRECT_URI, // URL de redirection après l'authentification
    allowHttpForRedirectUrl: true,  // Utiliser http pour des tests en local
    passReqToCallback: true,
  },
  function (req, iss, sub, profile, accessToken, refreshToken, done) {
    return done(null, profile);
  }
));

// Middleware pour vérifier les tokens JWT
const checkJwt = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).send('Token is required');
  }

  jwt.verify(token, process.env.SESSION_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid Token');
    }
    req.user = decoded;
    next();
  });
};

// Routes de l'API
app.get('/api/protected', checkJwt, (req, res) => {
  res.json({ message: 'Protected content accessed successfully' });
});

// Authentification avec Azure AD (utilisé pour obtenir le token)
app.get('/auth/login', passport.authenticate('azure_ad_oauth2'));

// Callback après l'authentification réussie
app.get('/auth/callback', passport.authenticate('azure_ad_oauth2', {
  failureRedirect: '/',
  successRedirect: '/api/protected',
}));

// Démarrer le serveur
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
