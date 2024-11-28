require('dotenv').config();
const express = require('express');
const axios = require('axios');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour les sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

// Route pour rediriger vers Azure AD pour l'authentification
app.get('/auth/login', (req, res) => {
    const redirectUri = encodeURIComponent(process.env.REDIRECT_URI);
    const authUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/authorize` +
        `?client_id=${process.env.CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${redirectUri}` +
        `&response_mode=query` +
        `&scope=openid profile email User.Read` +
        `&state=12345`;
    res.redirect(authUrl);
});

// Callback après l'authentification Azure
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Code de vérification manquant.' });
    }

    try {
        // Échanger le code contre un token d'accès
        const tokenResponse = await axios.post(
            `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
            new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.REDIRECT_URI,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        // Sauvegarde du token d'accès en session
        req.session.accessToken = tokenResponse.data.access_token;

        res.json({ message: 'Authentification réussie !' });
    } catch (err) {
        console.error('Erreur lors de l\'échange du code :', err.response?.data || err.message);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'authentification.' });
    }
});

// Route pour obtenir les données utilisateur depuis Microsoft Graph
app.get('/api/user', async (req, res) => {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    try {
        const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        res.json(userResponse.data);
    } catch (err) {
        console.error('Erreur lors de la récupération des données utilisateur :', err.response?.data || err.message);
        res.status(500).json({ error: 'Impossible de récupérer les données utilisateur.' });
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
