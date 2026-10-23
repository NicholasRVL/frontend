import { apiRequest, ApiError } from "./api";

function normalizeUser(user) {
  if (user?.id === undefined || !user?.username) {
    throw new ApiError("Data pengguna dari API tidak lengkap.");
  }

  return {
    id: String(user.id),
    username: user.username,
    role: user.role,
    isActive: Boolean(user.is_active),
  };
}

export const userService = {
  async list(token) {
    const payload = await apiRequest("/users", { token });
    const users = Array.isArray(payload) ? payload : payload?.data;
    if (!Array.isArray(users)) throw new ApiError("Format data pengguna dari API tidak sesuai.");
    return users.map(normalizeUser);
  },
  create(token, user) {
    return apiRequest("/users", {
      method: "POST",
      token,
      body: JSON.stringify(user),
    });
  },
  update(token, id, user) {
    return apiRequest(`/users/${encodeURIComponent(String(id))}`, {
      method: "PUT",
      token,
      body: JSON.stringify(user),
    });
  },
  remove(token, id) {
    return apiRequest(`/users/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
      token,
    });
  },
};
