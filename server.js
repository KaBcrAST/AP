const express = require("express");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const app = express();

const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: "https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys",  // Remplacez par votre Tenant ID
  }),
  audience: "api://BackendApp",  // Audience de l'API
  issuer: "https://login.microsoftonline.com/{tenantId}/v2.0",  // Remplacez par votre Tenant ID
  algorithms: ["RS256"],
});

app.use(jwtCheck); // Appliquez la validation du jeton à toutes les routes protégées

app.get("/api/data", (req, res) => {
  res.json({ message: "Données protégées" });
});

app.listen(3000, () => {
  console.log("API backend en écoute sur le port 3000");
});
