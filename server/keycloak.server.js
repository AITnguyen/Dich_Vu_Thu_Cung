const axios = require("axios");

const {
  KEYCLOAK_URL,
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
} = process.env;

async function getTokenAdmin() {
  const res = await axios.post(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: KEYCLOAK_CLIENT_ID,
      client_secret: KEYCLOAK_CLIENT_SECRET,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  return res.data.access_token;
}

module.exports.createUser = async (data, roles) => {
  const token = await getTokenAdmin();

  // create user
  const response = await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
    {
      username: data.email,
      email: data.email,
      firstName: data.name,
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: "password",
          value: data.password,
          temporary: false,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  // role
  const location = response.headers.location;
  const userId = location.split("/").pop();

  const responseRole = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${roles}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const role = responseRole.data;

  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
    [role],
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  return userId;
};

module.exports.login = async (email, password) => {
  const res = await axios.post(
    `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: "password",
      client_id: KEYCLOAK_CLIENT_ID,
      client_secret: KEYCLOAK_CLIENT_SECRET,
      username: email,
      password: password,
      scope: "openid",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  return res.data;
};

module.exports.statusToken = async (access_token) => {
  try {
    const token = await axios.post(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token/introspect`,
      new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
        token: access_token,
        token_type_hint: "access_token",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );
    return token.data;
  } catch (error) {
    throw error;
  }
};

module.exports.refreshToken = async (refresh_token) => {
  try {
    const token = await axios.post(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
        refresh_token: refresh_token,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    return token.data;
  } catch (error) {
    throw error;
  }
};

module.exports.logout = async (refresh_token) => {
  try {
    await axios.post(
      `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`,
      new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
        refresh_token: refresh_token,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
  } catch (error) {
    throw error;
  }
};

module.exports.resetPassword = async (id_user, new_password) => {
  try {
    const tokenAdmin = await getTokenAdmin();
    await axios.put(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${id_user}/reset-password`,

      {
        type: "password",
        value: new_password,
        temporary: false,
      },
      {
        headers: {
          Authorization: `Bearer ${tokenAdmin}`,
          "Content-type": "application/json",
        },
      },
    );
  } catch (error) {
    throw error;
  }
};

module.exports.changeStatus = async (id_keycloak, status) => {
  try {
    const tokenAdmin = await getTokenAdmin();
    await axios.put(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${id_keycloak}`,
      { enabled: status },
      {
        headers: {
          Authorization: `Bearer ${tokenAdmin}`,
          "Content-type": "application/json",
        },
      },
    );
  } catch (error) {
    throw error;
  }
};

module.exports.deleteUser = async (id_keycloak) => {
  try {
    const tokenAdmin = await getTokenAdmin();
    await axios.delete(
      `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${id_keycloak}`,
      {
        headers: {
          Authorization: `Bearer ${tokenAdmin}`,
          "Content-type": "application/json",
        },
      },
    );
  } catch (error) {
    throw error;
  }
};

module.exports.checkUsername = async (username) => {
  const token = await getTokenAdmin();

  const { data } = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
    {
      params: {
        username: username,
        exact: true,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return data;
};

module.exports.setRole = async (userId, roles) => {
  const token = await getTokenAdmin();

  const responseRole = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${roles}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const role = responseRole.data;

  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/role-mappings/realm`,
    [role],
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};