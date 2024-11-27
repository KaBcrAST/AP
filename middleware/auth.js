const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');


// Middleware pour valider les tokens JWT
// Middleware pour valider les tokens JWT
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://login.microsoftonline.com/${process.env.TENANT_ID}/discovery/v2.0/keys`
    }),
    audience: `api://${process.env.CLIENT_ID}`, // Remplacez par l'audience de votre API
    issuer: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`, // Remplacez par l'issuer de votre tenant
    algorithms: ['RS256'] // L'algorithme de signature du JWT
  });
  
  module.exports = checkJwt;
  
// Middleware pour vérifier les scopes
const checkScopes = (requiredScope) => {
  return (req, res, next) => {
    const scopes = req.auth?.scp?.split(' ') || [];
    if (scopes.includes(requiredScope)) {
      next();
    } else {
      res.status(403).send('Permission refusée : Scope manquant.');
    }
  };
};

module.exports = {
  checkJwt,
  checkScopes,
};
