const express = require("express");
const passport = require("passport");
const session = require("express-session");
const { OIDCStrategy } = require("passport-azure-ad");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

// Configuration CORS pour autoriser le frontend
const allowedOrigins = [
  "http://localhost:3000",  // Frontend local (ajustez en production)
  "https://gentle-wave-023be5a03.5.azurestaticapps.net",  // URL de votre app déployée sur Azure
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS non autorisé pour cette origine."));
      }
    },
    credentials: true,
  })
);

// Middleware pour gérer les sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "None",
    },
  })
);

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Configurer l'authentification Azure AD
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/.well-known/openid-configuration`,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      responseType: "code",
      responseMode: "query",
      redirectUrl: process.env.REDIRECT_URI,  // Doit pointer vers votre endpoint de callback
      allowHttpForRedirectUrl: true, // Seulement en local pour HTTP
      passReqToCallback: false,
      scope: ["profile", "email"],
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      return done(null, profile); // Stocker l'utilisateur dans la session
    }
  )
);

// Routes pour la gestion de l'authentification
app.get("/login", (req, res) => {
  res.send('<a href="/auth/openid">Login with Azure AD</a>');
});

app.get(
  "/auth/openid",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.json(req.user); // Renvoie directement l'utilisateur après une authentification réussie
  }
);

app.get("/auth/openid/return", 
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/login" }), 
  (req, res) => {
    res.json(req.user);  // Renvoie l'utilisateur au frontend
  }
);

// Définir le port
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
