const axios = require('axios');
const User = require('../models/userProfile'); // Assure-toi que tu utilises le bon modèle pour l'utilisateur
const bcrypt = require('bcrypt'); // Si tu veux hasher des informations comme le mot de passe, ou si tu en as besoin

/**
 * Récupérer les informations du profil utilisateur à partir de Microsoft Graph API et créer un utilisateur si nécessaire.
 */
const getProfileById = async (req, res) => {
  const userId = req.params.id; // ID de l'utilisateur récupéré via le paramètre de la route

  // Récupération du token d'authentification
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token is required.' });
  }

  try {
    // Requête vers Microsoft Graph API pour récupérer les informations de l'utilisateur
    const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Données de l'utilisateur récupérées de Microsoft Graph
    const graphData = response.data;

    // Vérification si l'utilisateur existe déjà dans la base de données
    let user = await User.findOne({ graphUserId: userId });

    if (!user) {
      // Si l'utilisateur n'existe pas, créer un nouvel utilisateur dans la base de données
      const newUser = new User({
        graphUserId: userId,
        displayName: graphData.displayName,
        email: graphData.mail || graphData.userPrincipalName, // Utiliser le mail ou le userPrincipalName
        givenName: graphData.givenName,
        surname: graphData.surname,
        jobTitle: graphData.jobTitle || 'Not Provided',
        // D'autres champs peuvent être ajoutés en fonction des données que tu veux stocker
        isPrivate: false,  // Par exemple, un champ pour la confidentialité
      });

      // Sauvegarder l'utilisateur dans la base de données
      user = await newUser.save();
      console.log('Utilisateur créé :', user);
    }

    // Retourner les données de l'utilisateur (soit trouvé, soit nouvellement créé)
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération ou création de l\'utilisateur :', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Failed to fetch or create user profile.',
    });
  }
};

/**
 * Vérifie si le profil utilisateur est privé.
 */
const isProfilePrivate = async (req, res) => {
  const userId = req.params.id; // ID utilisateur depuis les paramètres de la requête

  try {
    // Recherche dans la base de données par l'ID de l'utilisateur (graphUserId)
    const user = await User.findOne({ graphUserId: userId });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    // Retourner l'état de confidentialité du profil
    res.status(200).json({ isPrivate: user.isPrivate });
  } catch (error) {
    console.error('Erreur lors de la vérification de la confidentialité du profil :', error.message);
    res.status(500).json({ error: 'Erreur lors de la vérification.' });
  }
};

module.exports = { getProfileById, isProfilePrivate };
