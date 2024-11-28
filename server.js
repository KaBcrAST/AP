const express = require('express');
const session = require('express-session');
const { generators, Issuer } = require('openid-client');

const app = express();

// Configurations
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
const tenantId = process.env.TENANT_ID;

// Session pour stocker PKCE verifier et state
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));

// Découverte d'Azure AD
let client;
(async () => {
    const azureIssuer = await Issuer.discover(`https://login.microsoftonline.com/${tenantId}/v2.0`);
    client = new azureIssuer.Client({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [redirectUri],
        response_types: ['code'],
    });
})();

// Redirection vers Azure AD avec PKCE
app.get('/auth/login', (req, res) => {
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    // Stocke le verifier et l'état dans la session
    req.session.codeVerifier = codeVerifier;

    const authUrl = client.authorizationUrl({
        scope: 'openid profile email User.Read',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: 'random_state_123',
    });

    res.redirect(authUrl);
});

// Callback de redirection
app.get('/auth/callback', async (req, res) => {
    const params = client.callbackParams(req);
    try {
        const tokenSet = await client.callback(redirectUri, params, {
            code_verifier: req.session.codeVerifier,
        });
        req.session.tokenSet = tokenSet;
        res.redirect('/');
    } catch (err) {
        console.error('Erreur lors de l\'échange du token :', err);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'authentification.' });
    }
});

// API pour récupérer les données utilisateur
app.get('/api/user', async (req, res) => {
    if (!req.session.tokenSet) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    try {
        const userInfo = await client.userinfo(req.session.tokenSet.access_token);
        res.json(userInfo);
    } catch (err) {
        console.error('Erreur lors de la récupération des données utilisateur :', err);
        res.status(500).json({ error: 'Impossible de récupérer les données utilisateur.' });
    }
});

app.listen(3000, () => console.log('Serveur démarré sur http://localhost:3000'));
