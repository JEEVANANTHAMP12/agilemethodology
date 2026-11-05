import { createContext } from 'react';

export const defaultInspector = {
  id: 1,
  username: 'inspector',
  full_name: 'Jeeva - Chief Structural Engineer',
  role: 'inspector',
  email: 'inspector@rover-agile.org'
};

export const AuthContext = createContext({
  user: defaultInspector,
  loading: false,
  isAuthenticated: true,
  login: async () => defaultInspector,
  register: async () => defaultInspector,
  logout: () => {}
});

