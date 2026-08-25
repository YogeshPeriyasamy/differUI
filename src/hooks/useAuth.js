/**
 * hooks/useAuth.js
 * Encapsulates the authentication state and logic so App.jsx stays lean.
 * Uses a simple credential check against env variables; swap the
 * `login` function body for a real API call when ready.
 */

import { useState, useCallback } from "react";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../config/env";
import { getStoredUser, storeUser, clearStoredUser } from "../utils/user";

export function useAuth() {
  const [user, setUser] = useState(() => getStoredUser());

  /** Returns an error string on failure, empty string on success. */
  const login = useCallback((email, password) => {
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return "Invalid email or password.";
    }
    storeUser(email);
    setUser(email);
    return "";
  }, []);

  const logout = useCallback(() => {
    clearStoredUser();
    setUser("");
  }, []);

  return { user, login, logout };
}
