const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { OIDCStrategy } = require("passport-azure-ad");
const dotenv = require("dotenv");
const cors = require("cors");

// Charger les variables d'environnement
dotenv.config();

const app = express();
app.use(cors()); // Permettre les requêtes cross-origin entre le frontend et le backend

// Configuration de la session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-session-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Initialisation de Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuration de la stratégie Azure AD
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      responseType: "code",
      responseMode: "query",
      redirectUrl: process.env.REDIRECT_URI,
      scope: ["openid", "profile", "email"],
      passReqToCallback: false,
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      // Enregistrer l'utilisateur dans la session
      return done(null, profile);
    }
  )
);

// Sérialisation/desérialisation utilisateur
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Route pour démarrer l'authentification
app.get(
  "/auth/login",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/error" })
);

// Callback après l'authentification
app.get(
  "/auth/callback",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/error" }),
  (req, res) => {
    res.redirect("/profile"); // Rediriger vers /profile après connexion
  }
);

// Route pour obtenir les données utilisateur
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  res.json(req.user); // Retourner les données utilisateur
});

// Déconnexion
app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Lancer le serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API en cours d'exécution sur http://localhost:${PORT}`));
