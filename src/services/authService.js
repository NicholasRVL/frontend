import { apiRequest } from "./api";

export const authService = {
  login(username, pin) {
    return apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username, pin }),
    });
  },
  me(token) {
    return apiRequest("/me", { token });
  },
  logout(token) {
    return apiRequest("/logout", { method: "POST", token });
  },
};
