import { PropsWithChildren, createContext, use, useCallback, useState } from 'react';
import { removeItemFromStore } from 'lib/utils';
import { firebaseAuth } from 'services/firebase/firebase';
import { User } from 'services/swr/api-hooks/useAuthApi';

interface SessionUser extends User {
  provider?: string;
}

interface AuthFirebaseContextInterface {
  sessionUser: SessionUser | null;
  setSession: (user: SessionUser | null, token?: string) => void;
  signout: () => void;
}

export const AuthFirebaseContext = createContext({} as AuthFirebaseContextInterface);

const AuthFirebaseProvider = ({ children }: PropsWithChildren) => {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const setSession = useCallback(
    (user: User | null, token?: string) => {
      setSessionUser(user);
      if (token) {
        localStorage.setItem('auth_token', token);
      }
    },
    [setSessionUser],
  );

  const signout = useCallback(() => {
    setSessionUser(null);
    removeItemFromStore('session_user');
    removeItemFromStore('auth_token');
    firebaseAuth.signOut();
  }, [setSessionUser]);

  return (
    <AuthFirebaseContext value={{ sessionUser, setSession, signout }}>
      {children}
    </AuthFirebaseContext>
  );
};

export const useAuth = () => use(AuthFirebaseContext);

export default AuthFirebaseProvider;
