const session = require("express-session");
const Keycloak = require("keycloak-connect");

const memoryStore = new session.MemoryStore();
const kc = {
  realm: process.env.KEYCLOAK_REALM,
  "auth-server-url": process.env.KEYCLOAK_URL,
  "ssl-required": "none",
  resource: process.env.KEYCLOAK_CLIENT_ID,
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET,
  },
};
const keycloak = new Keycloak({ store: memoryStore }, kc);

module.exports = {
  keycloak,
  memoryStore,
};