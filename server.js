const express = require("express");
const app = express();
const PORT = 8080;
const userData = require("./MOCK_DATA.json");
const graphql = require("graphql")
const { GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLID, GraphQLInt, GraphQLString } = graphql
const { graphqlHTTP } = require("express-graphql")

const UserType = new GraphQLObjectType({
    name: "User",
    fields: () => ({
        id: { type: GraphQLInt },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
    })
})

const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        getAllUsers: {
            type: new GraphQLList(UserType),
            args: { id: {type: GraphQLInt}},
            resolve(parent, args) {
                return userData;
            }
        },
        findUserById: {
            type: UserType,
            description: "fetch single user",
            args: { id: {type: GraphQLInt}},
            resolve(parent, args) {
                return userData.find((a) => a.id == args.id);
            }
        }
    }
})
const Mutation = new GraphQLObjectType({
    name: "Mutation",
    fields: {
        createUser: {
            type: UserType,
            args: {
                firstName: {type: GraphQLString},
                lastName: { type: GraphQLString },
                email: { type: GraphQLString },
                password: { type: GraphQLString },
            },
            resolve(parent, args) {
                userData.push({
                    id: userData.length + 1,
                    firstName: args.firstName,
                    lastName: args.lastName,
                    email: args.email,
                    password: args.password
                })
                return args
            }
        }
    }
})

const schema = new GraphQLSchema({query: RootQuery, mutation: Mutation})
app.use("/graphql", graphqlHTTP({
    schema,
    graphiql: true,
  })
);

app.get("/rest/getAllUser", (req, res) => {
    res.send(userData)
   });

app.listen(PORT, () => {
  console.log("Server running");
});

const express = require("express");
const passport = require("passport");
const session = require("express-session");
const { OIDCStrategy } = require("passport-azure-ad");
const dotenv = require("dotenv");

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Configurer Passport pour utiliser Azure AD OIDC
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/.well-known/openid-configuration`, // URL de l'OpenID Configuration pour votre tenant
      clientID: process.env.CLIENT_ID, // Votre Client ID
      clientSecret: process.env.CLIENT_SECRET, // Votre Client Secret
      responseType: "code",
      responseMode: "query",
      redirectUrl: process.env.REDIRECT_URI, // URL de redirection après l'authentification
      allowHttpForRedirectUrl: true, // Important pour les tests en local (utilisation d'http au lieu de https)
      passReqToCallback: false,
      scope: ["profile", "email"], // Scopes nécessaires pour obtenir les informations du profil utilisateur
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      return done(null, profile); // Stoker le profil de l'utilisateur dans la session
    }
  )
);

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware pour les sessions
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-session-secret", // Utiliser une session sécurisée
    resave: true,
    saveUninitialized: true,
  })
);

// Routes
app.get("/login", (req, res) => {
  res.send('<a href="/auth/openid">Login with Azure AD</a>');
});

// Route pour démarrer l'authentification avec Azure AD
app.get(
  "/auth/openid",
  passport.authenticate("azuread-openidconnect", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/profile"); // Une fois l'authentification réussie, rediriger vers le profil
  }
);

// Route de retour après l'authentification réussie
app.get("/auth/openid/return", 
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/login" }), 
  (req, res) => {
    res.redirect("/profile"); // Rediriger vers le profil
  }
);

// Route pour afficher le profil de l'utilisateur
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.json(req.user); // Afficher les informations du profil utilisateur
});

// Déterminer le port à utiliser, en fonction de la variable d'environnement définie par Azure ou utiliser le port 3001 pour local
const port = process.env.PORT || 3001; // Azure définit automatiquement la variable PORT
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});