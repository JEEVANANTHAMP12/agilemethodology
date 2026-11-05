import React, { useState } from 'react';
import { AuthContext, defaultInspector } from './authContextDef';

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
