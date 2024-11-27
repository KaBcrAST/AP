const express = require("express");
const { expressjwt: jwt } = require("express-jwt");  // Modification ici pour s'assurer de la bonne méthode d'importation
const jwksRsa = require("jwks-rsa");

const app = express();

// Remplace {tenantId} par ton propre Tenant ID
const tenantId = '3b644da5-0210-4e60-b8dc-0beec1614542';  // Remplace par ton propre Tenant ID

// Configuration du middleware JWT pour valider les jetons
const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,  // Ton URI JWKS
  }),
  audience: 'api://BackendApp',  // Ton audience de l'API
  issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,  // Ton issuer
  algorithms: ['RS256'],  // L'algorithme utilisé pour signer le JWT
});

// Appliquer le middleware pour valider le JWT
// Ici, nous appliquons le middleware `jwtCheck` sur toutes les routes de l'application
app.use(jwtCheck);

// Exemple de route protégée
app.get("/api/data", (req, res) => {
  res.json({ message: "Données sécurisées" });
});

// Démarrer l'application sur le port 3000
app.listen(3000, () => {
  console.log("API backend en écoute sur le port 3000");
});
