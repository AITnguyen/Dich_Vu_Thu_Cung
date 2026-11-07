const axios = require("axios");

function config() {
  const url = String(process.env.KEYCLOAK_URL || "").replace(/\/+$/, "");
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!url || !realm || !clientId || !clientSecret) {
    throw new Error(
      "Thiếu KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID hoặc KEYCLOAK_CLIENT_SECRET",
    );
  }

  return { url, realm, clientId, clientSecret };
}

function realmUrl() {
  const value = config();
  return value.url + "/realms/" + encodeURIComponent(value.realm);
}

function adminUrl() {
  const value = config();
  return value.url + "/admin/realms/" + encodeURIComponent(value.realm);
}

async function postForm(url, values) {
  const response = await axios.post(url, new URLSearchParams(values), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
}

async function getAdminToken() {
  const value = config();
  const data = await postForm(realmUrl() + "/protocol/openid-connect/token", {
    grant_type: "client_credentials",
    client_id: value.clientId,
    client_secret: value.clientSecret,
  });
  return data.access_token;
}

async function adminHeaders() {
  return { Authorization: "Bearer " + (await getAdminToken()) };
}

module.exports.login = async (email, password) => {
  const value = config();
  return postForm(realmUrl() + "/protocol/openid-connect/token", {
    grant_type: "password",
    client_id: value.clientId,
    client_secret: value.clientSecret,
    username: email,
    password,
    scope: "openid",
  });
};

module.exports.statusToken = async (accessToken) => {
  const value = config();
  return postForm(realmUrl() + "/protocol/openid-connect/token/introspect", {
    client_id: value.clientId,
    client_secret: value.clientSecret,
    token: accessToken,
    token_type_hint: "access_token",
  });
};

module.exports.refreshToken = async (refreshToken) => {
  const value = config();
  return postForm(realmUrl() + "/protocol/openid-connect/token", {
    grant_type: "refresh_token",
    client_id: value.clientId,
    client_secret: value.clientSecret,
    refresh_token: refreshToken,
  });
};

module.exports.logout = async (refreshToken) => {
  const value = config();
  return postForm(realmUrl() + "/protocol/openid-connect/logout", {
    client_id: value.clientId,
    client_secret: value.clientSecret,
    refresh_token: refreshToken,
  });
};

module.exports.checkUsername = async (email) => {
  const response = await axios.get(adminUrl() + "/users", {
    params: { username: email, exact: true },
    headers: await adminHeaders(),
  });
  return response.data || [];
};

module.exports.getRealmRoles = async (userId) => {
  const response = await axios.get(
    adminUrl() +
      "/users/" +
      encodeURIComponent(userId) +
      "/role-mappings/realm",
    { headers: await adminHeaders() },
  );
  return response.data || [];
};

module.exports.setRole = async (userId, roleName) => {
  const roleResponse = await axios.get(
    adminUrl() + "/roles/" + encodeURIComponent(roleName),
    { headers: await adminHeaders() },
  );

  await axios.post(
    adminUrl() +
      "/users/" +
      encodeURIComponent(userId) +
      "/role-mappings/realm",
    [roleResponse.data],
    {
      headers: Object.assign(await adminHeaders(), {
        "Content-Type": "application/json",
      }),
    },
  );
};

module.exports.createUser = async (data, roleName) => {
  const response = await axios.post(
    adminUrl() + "/users",
    {
      username: data.email,
      email: data.email,
      firstName: data.name,
      enabled: true,
      emailVerified: true,
      credentials: [
        { type: "password", value: data.password, temporary: false },
      ],
    },
    {
      headers: Object.assign(await adminHeaders(), {
        "Content-Type": "application/json",
      }),
    },
  );

  let userId = "";
  const location = response.headers.location;
  if (location) userId = location.split("/").pop();

  if (!userId) {
    const users = await module.exports.checkUsername(data.email);
    userId = users[0] && users[0].id;
  }

  if (!userId) throw new Error("Keycloak không trả về ID tài khoản mới");

  try {
    await module.exports.setRole(userId, roleName);
  } catch (error) {
    await module.exports.deleteUser(userId).catch(() => {});
    throw error;
  }

  return userId;
};

module.exports.resetPassword = async (userId, newPassword) => {
  await axios.put(
    adminUrl() + "/users/" + encodeURIComponent(userId) + "/reset-password",
    { type: "password", value: newPassword, temporary: false },
    {
      headers: Object.assign(await adminHeaders(), {
        "Content-Type": "application/json",
      }),
    },
  );
};

module.exports.logoutUserSessions = async (userId) => {
  await axios.post(
    adminUrl() + "/users/" + encodeURIComponent(userId) + "/logout",
    {},
    { headers: await adminHeaders() },
  );
};

module.exports.deleteUser = async (userId) => {
  await axios.delete(adminUrl() + "/users/" + encodeURIComponent(userId), {
    headers: await adminHeaders(),
  });
};
