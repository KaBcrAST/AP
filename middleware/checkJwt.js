const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys', // Remplace {tenant_id}
});

async function checkJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.decode(token, { complete: true });
    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    const verifiedToken = jwt.verify(token, publicKey, {
      audience: '{client_id}', // Remplace {client_id}
      issuer: 'https://login.microsoftonline.com/{tenant_id}/v2.0', // Remplace {tenant_id}
    });

    req.user = verifiedToken; // Données du token
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
}

module.exports = checkJwt;
