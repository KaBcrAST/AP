require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Variables d'environnement
const { CLIENT_ID, CLIENT_SECRET, TENANT_ID, REDIRECT_URI } = process.env;

// Middleware pour gérer les CORS
app.use(cors());
app.use(express.json());

// Endpoint principal
app.get("/", (req, res) => {
  res.send("API Node.js avec Azure AD OAuth2.0");
});

// Endpoint pour rediriger vers Azure AD pour l'authentification
app.get("/auth/login", (req, res) => {
  const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?` +
    `client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_mode=query&scope=openid profile email offline_access`;
  res.redirect(authUrl);
});

// Endpoint pour gérer le callback après authentification
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Code d'autorisation manquant.");
  }

  try {
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.json({
      accessToken: tokenResponse.data.access_token,
      idToken: tokenResponse.data.id_token,
      refreshToken: tokenResponse.data.refresh_token,
    });
  } catch (error) {
    console.error("Erreur lors de l'échange du code :", error.response?.data || error.message);
    res.status(500).json({
      error: "Erreur lors de l'échange du code",
      details: error.response?.data || error.message,
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
