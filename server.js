const express = require("express");
const passport = require("passport");
const session = require("express-session");
const { OIDCStrategy } = require("passport-azure-ad");
const dotenv = require("dotenv");
const app = express();

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Middleware pour gérer les sessions (doit être avant passport.initialize et passport.session)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-session-secret", // Clé secrète pour sécuriser la session
    resave: false, // Ne pas sauvegarder la session si elle n'a pas été modifiée
    saveUninitialized: true, // Sauvegarder la session même si elle n'a pas été initialisée
  })
);

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurer Passport pour utiliser Azure AD OIDC
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/.well-known/openid-configuration`, // URL de l'OpenID Configuration pour votre tenant
      clientID: process.env.CLIENT_ID, // Votre Client ID
      clientSecret: process.env.CLIENT_SECRET, // Votre Client Secret
      responseType: "code",
      responseMode: "query",
      redirectUrl: process.env.REDIRECT_URI, // URL de redirection après l'authentification
      allowHttpForRedirectUrl: true, // Important pour les tests en local (utilisation d'http au lieu de https)
      passReqToCallback: false,
      scope: ["profile", "email"], // Scopes nécessaires pour obtenir les informations du profil utilisateur
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      return done(null, profile); // Stoker le profil de l'utilisateur dans la session
    }
  )
);

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
    return res.redirect("/login");
  }
  res.json(req.user); // Afficher les informations du profil utilisateur
});

// Déterminer le port à utiliser, en fonction de la variable d'environnement définie par Azure
const port = process.env.PORT || 3000; // Azure définit automatiquement la variable PORT
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
