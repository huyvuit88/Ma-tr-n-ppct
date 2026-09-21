import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, logoutUser, checkUserAuthorization, AuthAccessCheck, isSuperAdminEmail } from '../../lib/firebase';
import { WhitelistManagementModal } from './WhitelistManagementModal';

interface AuthContextType {
  user: User | null;
  authAccess: AuthAccessCheck | null;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  openWhitelistModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authAccess: null,
  isSuperAdmin: false,
  logout: async () => {},
  openWhitelistModal: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authAccess, setAuthAccess] = useState<AuthAccessCheck | null>(null);
  const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const access = await checkUserAuthorization(currentUser);
          setAuthAccess(access);
        } catch (e) {
          console.warn('Auth access check notice:', e);
          const isSuper = isSuperAdminEmail(currentUser.email);
          setAuthAccess({
            isAllowed: true,
            isSuperAdmin: isSuper,
            role: isSuper ? 'admin' : 'teacher',
          });
        }
      } else {
        setAuthAccess(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const isSuper = Boolean(user && isSuperAdminEmail(user.email));

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setAuthAccess(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authAccess: authAccess || {
          isAllowed: true,
          isSuperAdmin: isSuper,
          role: isSuper ? 'admin' : 'teacher',
        },
        isSuperAdmin: isSuper,
        logout: handleLogout,
        openWhitelistModal: () => setIsWhitelistModalOpen(true),
      }}
    >
      {children}
      <WhitelistManagementModal
        isOpen={isWhitelistModalOpen}
        onClose={() => setIsWhitelistModalOpen(false)}
        currentUser={user}
      />
    </AuthContext.Provider>
  );
};

