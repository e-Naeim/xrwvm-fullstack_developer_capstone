import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
const AuthContext = createContext();
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('session').then(data => setUser(data.userName ? data : null))
    .catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  return <AuthContext.Provider value={{ user, setUser, loading }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
