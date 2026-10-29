import React, { createContext, useContext, useState } from 'react';

const defaultInspector = {
  id: 1,
  username: 'inspector',
  full_name: 'Jeeva - Chief Structural Engineer',
  role: 'inspector',
  email: 'inspector@rover-agile.org'
};

const AuthContext = createContext({
  user: defaultInspector,
  loading: false,
  isAuthenticated: true,
  login: async () => defaultInspector,
  register: async () => defaultInspector,
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user] = useState(defaultInspector);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        isAuthenticated: true,
        login: async () => defaultInspector,
        register: async () => defaultInspector,
        logout: () => {}
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
