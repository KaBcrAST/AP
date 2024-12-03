const axios = require('axios');
const User = require('../models/userProfile');  // Modèle d'utilisateur

/**
 * Récupérer les informations du profil utilisateur à partir de Microsoft Graph API
 * et lier les données à un modèle utilisateur.
 */
const getProfileById = async (req, res) => {
  const userId = req.params.id;

  // Récupération du token d'authentification
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token is required.' });
  }

  try {
    // Requête vers Microsoft Graph API pour récupérer les données de l'utilisateur
    const userData = await getUserProfileFromGraph(userId, token);

    // Vérifier si l'utilisateur existe déjà dans la base de données
    let user = await User.findOne({ graphUserId: userId });

    // Si l'utilisateur n'existe pas, créer un nouvel utilisateur
    if (!user) {
      user = new User({
        graphUserId: userData.id,
        displayName: userData.displayName,
        userPrincipalName: userData.userPrincipalName,
        mail: userData.mail,
        jobTitle: userData.jobTitle,
        isPrivate: false,  // Statut par défaut, vous pouvez ajuster en fonction des besoins
      });
    } else {
      // Si l'utilisateur existe déjà, mettre à jour ses informations
      user.displayName = userData.displayName;
      user.userPrincipalName = userData.userPrincipalName;
      user.mail = userData.mail;
      user.jobTitle = userData.jobTitle;
    }

    // Sauvegarder les informations de l'utilisateur dans la base de données
    await user.save();

    // Retourner les données utilisateur mises à jour
    res.status(200).json({
      displayName: user.displayName,
      userPrincipalName: user.userPrincipalName,
      mail: user.mail,
      jobTitle: user.jobTitle,
      isPrivate: user.isPrivate,  // Vous pouvez ajouter d'autres informations comme le statut privé/public
    });
  } catch (error) {
    console.error('Erreur lors de la récupération ou de la mise à jour du profil :', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to fetch or update profile data.',
    });
  }
};

module.exports = { getProfileById };
