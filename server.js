const express = require('express');
const { Configuration, PublicClientApplication } = require('@azure/msal-node');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Configure MSAL for Azure AD
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    redirectUri: 'https://ap-dfe2cvfsdafwewaw.canadacentral-01.azurewebsites.net/auth/callback', // Update with your redirect URI
  },
};

const pca = new PublicClientApplication(msalConfig);

// Cookie parser middleware
app.use(cookieParser());

// Body parser middleware
app.use(bodyParser.json());

app.get('/api/login', async (req, res) => {
  try {
    const authRequest = {
      scopes: ['user.read'],
    };

    const loginRedirectUrl = pca.getAuthCodeUrl(authRequest);
    res.json({ redirectUri: loginRedirectUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send('Une erreur s\'est produite lors de l\'initialisation de la connexion.');
  }
});

// Route for initiating login flow
app.get('/login', async (req, res) => {
  try {
    const authRequest = {
      scopes: ['user.read'], // Replace with your required scopes
    };

    const loginRedirectUrl = pca.getAuthCodeUrl(authRequest);
    res.redirect(loginRedirectUrl);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during login initiation.');
  }
});

// Route for handling authentication callback
app.get('/auth/callback', async (req, res) => {
  try {
    const authCode = req.query.code;
    const tokenResponse = await pca.acquireTokenByCode({ code: authCode });

    // Store access token in a secure session (e.g., database)
    const accessToken = tokenResponse.accessToken;
    // You can implement session management here

    // Redirect user to the application homepage or profile page
    res.redirect('/profile'); // Replace with your desired redirect path
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during token acquisition.');
  }
});

// Route for retrieving user profile (replace with your logic)
app.get('/profile', async (req, res) => {
  try {
    // Retrieve access token from secure session
    const accessToken = req.cookies.accessToken;

    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userInfo = userResponse.data;
    res.json(userInfo); // Send user information in the response
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while retrieving user profile.');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});