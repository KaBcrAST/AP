const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Informations pour Azure AD
const CLIENT_ID = "b4a2a829-d4ce-49b9-9341-22995e0476ba";  // Ton client ID Azure
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";  // Ton secret client Azure (à obtenir sur Azure Portal)
const REDIRECT_URI = "https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/callback";  // URL de callback
const TENANT_ID = "3b644da5-0210-4e60-b8dc-0beec1614542";  // Ton tenant ID Azure

app.use(cors());
app.use(express.json());  // Permet de parser le corps des requêtes en JSON

// Route de callback où Azure renvoie le code d'autorisation
app.post("/auth/callback", async (req, res) => {
  const { code, code_verifier } = req.body;

  if (!code || !code_verifier) {
    return res.status(400).json({ error: "Code ou code_verifier manquant" });
  }

  try {
    // Echanger le code d'autorisation contre un token d'accès
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: code_verifier,
      })
    );

    // Envoyer les tokens à l'application React
    return res.json({
      accessToken: tokenResponse.data.access_token,
      idToken: tokenResponse.data.id_token,
      refreshToken: tokenResponse.data.refresh_token,
    });
  } catch (error) {
    console.error("Erreur lors de l'échange du code :", error.response?.data || error.message);
    return res.status(500).json({ error: "Erreur lors de l'échange du code" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
