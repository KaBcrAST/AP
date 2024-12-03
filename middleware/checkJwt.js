const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Initialiser le client JWKS
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.TENANT_ID}/discovery/v2.0/keys`, // TENANT_ID dans les variables d'environnement
});

/**
 * Middleware pour valider les JWT
 */
async function checkJwt(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Décoder le token sans le vérifier pour obtenir la clé 'kid'
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new Error('Invalid token structure');
    }

    // Récupérer la clé publique associée au 'kid'
    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    // Vérifier le token JWT avec la clé publique
    const verifiedToken = jwt.verify(token, publicKey, {
      audience: process.env.CLIENT_ID, // CLIENT_ID dans les variables d'environnement
      issuer: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`, // TENANT_ID dans les variables d'environnement
    });

    // Attacher les informations vérifiées au requête
    req.user = verifiedToken;
    next();
  } catch (err) {
    console.error('JWT validation error:', err.message);
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
}

module.exports = checkJwt;
