const fetch = require('node-fetch');  // Assure-toi d'utiliser la bonne version de node-fetch

const getUserProfileFromGraph = async (userId, token) => {
  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,  // Ajouter le token dans les headers
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching user profile: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('Error fetching profile data: ' + error.message);
  }
};

module.exports = {
  getUserProfileFromGraph,
};
