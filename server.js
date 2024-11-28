require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Issuer, generators } = require('openid-client');

const app = express();
app.use(express.json());

// Configuration des variables d'environnement
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, SESSION_SECRET, TENANT_ID } = process.env;

// Configurer les sessions pour stocker le `codeVerifier`
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Mettre à `true` en production avec HTTPS
    })
);

// Découverte de l'Issuer Azure AD
let client;
(async () => {
    const issuer = await Issuer.discover(`https://login.microsoftonline.com/${TENANT_ID}/v2.0`);
    client = new issuer.Client({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uris: [REDIRECT_URI],
        response_types: ['code'],
    });
    console.log('Azure AD Issuer découvert avec succès');
})();

// Route pour démarrer l'authentification
app.get('/auth/login', (req, res) => {
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    req.session.codeVerifier = codeVerifier; // Stocker le verifier dans la session

    const authorizationUrl = client.authorizationUrl({
        scope: 'openid profile email offline_access',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    });

    res.redirect(authorizationUrl);
});

// Callback pour gérer la redirection après authentification
app.get('/auth/callback', async (req, res) => {
    const params = client.callbackParams(req);

    try {
        const tokenSet = await client.callback(REDIRECT_URI, params, {
            code_verifier: req.session.codeVerifier, // Récupérer le verifier de la session
        });

        req.session.tokenSet = tokenSet; // Stocker les jetons dans la session
        console.log('Authentification réussie, jetons stockés dans la session');
        res.redirect('/'); // Rediriger vers la page principale
    } catch (err) {
        console.error('Erreur lors de l\'échange du code :', err.message);
        res.status(500).send('Erreur lors de l\'authentification');
    }
});

// Route pour récupérer les données utilisateur
app.get('/api/user', async (req, res) => {
    if (!req.session.tokenSet) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    try {
        const userInfo = await client.userinfo(req.session.tokenSet.access_token);
        res.json(userInfo);
    } catch (err) {
        console.error('Erreur lors de la récupération des informations utilisateur :', err.message);
        res.status(500).send('Erreur lors de la récupération des informations utilisateur');
    }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
