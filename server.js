const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const userData = require("./MOCK_DATA.json");
const graphql = require("graphql");
const { graphqlHTTP } = require("express-graphql");
const passport = require("passport");
const session = require("express-session");
const { OIDCStrategy } = require("passport-azure-ad");
const dotenv = require("dotenv");

// Charger les variables d'environnement
dotenv.config();

// GraphQL Setup
const { GraphQLObjectType, GraphQLSchema, GraphQLList, GraphQLInt, GraphQLString } = graphql;

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLInt },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    getAllUsers: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return userData;
      },
    },
    findUserById: {
      type: UserType,
      description: "Fetch single user",
      args: { id: { type: GraphQLInt } },
      resolve(parent, args) {
        return userData.find((a) => a.id == args.id);
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createUser: {
      type: UserType,
      args: {
        firstName: { type: GraphQLString },
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
          password: args.password,
        });
        return args;
      },
    },
  },
});

const schema = new GraphQLSchema({ query: RootQuery, mutation: Mutation });

// Azure AD OIDC Setup
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/.well-known/openid-configuration`,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      responseType: "code",
      responseMode: "query",
      redirectUrl: process.env.REDIRECT_URI,
      allowHttpForRedirectUrl: true,
      scope: ["profile", "email"],
    },
    (iss, sub, profile, accessToken, refreshToken, done) => {
      // Utilisateur authentifié, gérer le profil ici
      return done(null, profile);
    }
  )
);

// Middleware Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-session-secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes OIDC
app.get("/login", (req, res) => {
  res.send('<a href="/auth/openid">Login with Azure AD</a>');
});

app.get(
  "/auth/openid",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/login" })
);

app.get(
  "/auth/openid/return",
  passport.authenticate("azuread-openidconnect", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/graphql"); // Redirection après succès
  }
);

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/login");
  });
});

// Middleware de protection
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
};

// GraphQL Route protégée
app.use(
  "/graphql",
  isAuthenticated,
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

// REST Route protégée
app.get("/rest/getAllUser", isAuthenticated, (req, res) => {
  res.send(userData);
});

// Serveur
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
