/**
 * AuthContext – Stub-Version (Base44-unabhängig)
 *
 * Die ursprüngliche Version hat beim App-Start einen Auth-Check gegen
 * die Base44-API gemacht und das Rendering blockiert bis zur Antwort.
 *
 * Dieser Stub gibt sofort zurück: kein Laden, kein Fehler, kein User.
 * Das ermöglicht den lokalen/autarken Betrieb auf Kiosk-Stelen.
 *
 * Admin-Bereich ist damit ungeschützt – das ist für Phase 1 akzeptabel.
 * Später kann hier eine einfache lokale PIN-Prüfung eingebaut werden.
 */
import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const value = {
    user: null,
    isAuthenticated: false,
    isLoadingAuth: false,           // sofort false → kein Spinner
    isLoadingPublicSettings: false, // sofort false → kein Spinner
    authError: null,
    appPublicSettings: null,
    logout: () => {},
    navigateToLogin: () => {},
    checkAppState: () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
