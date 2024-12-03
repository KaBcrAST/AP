const axios = require('axios');

/**
 * Récupérer les informations du profil utilisateur à partir de Microsoft Graph API.
 */
const getProfileById = async (req, res) => {
  const userId = req.params.id;

  // Récupération du token d'authentification
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token is required.' });
  }

  try {
    // Requête vers Microsoft Graph API
    const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Retourner les données utilisateur
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching profile data:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to fetch profile data.',
    });
  }
};

module.exports = { getProfileById };
