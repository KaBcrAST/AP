const express = require("express");
const passport = require("passport");
const session = require("express-session");
const { OIDCStrategy } = require("passport-azure-ad");
const dotenv = require("dotenv");
const cors = require("cors");

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

const app = express();

// Configuration CORS
const allowedOrigins = [
  "http://localhost:3000", // Origine pour le développement local
  "https://gentle-wave-023be5a03.5.azurestaticapps.net", // Origine de votre app React déployée
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        // Autoriser si l'origine est dans la liste ou absente (Postman, scripts)
        callback(null, true);
      } else {
        callback(new Error("CORS non autorisé pour cette origine."));
      }
    },
    credentials: true, // Nécessaire pour permettre l'envoi des cookies/sessions
  })
);

// Middleware pour gérer les sessions (doit être avant Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-session-secret", // Clé secrète pour sécuriser la session
    resave: false, // Ne pas sauvegarder la session si elle n'a pas été modifiée
    saveUninitialized: true, // Sauvegarder la session même si elle n'a pas été initialisée
    cookie: {
      secure: process.env.NODE_ENV === "production", // Cookies sécurisés uniquement en production (HTTPS)
      httpOnly: true, // Les cookies ne sont pas accessibles via JavaScript côté client
    },
  })
);

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurer Passport pour utiliser Azure AD OIDC
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/.well-known/openid-configuration`,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET, // Utilisation du secret client
      responseType: "code",
      responseMode: "query",
      redirectUrl: process.env.REDIRECT_URI, // URL de redirection après l'authentification
      allowHttpForRedirectUrl: true, // Important pour les tests en local (utilisation d'http au lieu de https)
      passReqToCallback: false,
      scope: ["profile", "email"], // Scopes pour récupérer les données utilisateur
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      return done(null, profile); // Stocker le profil de l'utilisateur dans la session
    }
  )
);

// Sérialisation et désérialisation de l'utilisateur pour Passport
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Routes
app.get("/login", (req, res) => {
  console.log("Login route accessed");
  res.send('<a href="/auth/openid">Login with Azure AD</a>');
});

// Route pour démarrer l'authentification avec Azure AD
app.get(
  "/auth/openid",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/profile"); // Une fois l'authentification réussie, rediriger vers le profil
  }
);

// Route de retour après l'authentification réussie
app.get(
  "/auth/openid/return",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/profile"); // Rediriger vers le profil
  }
);

// Route pour afficher le profil de l'utilisateur
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  res.json(req.user); // Afficher les informations du profil utilisateur
});

// Démarrer le serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
