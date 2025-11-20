import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { users } from 'data/users';
import { removeItemFromStore } from 'lib/utils';
import { firebaseAuth } from 'services/firebase/firebase';
import { User, useGetCurrentUser } from 'services/swr/api-hooks/useAuthApi';

interface SessionUser extends User {
  provider?: string;
}

interface AuthJwtContextInterface {
  sessionUser: SessionUser | null;
  setSessionUser: Dispatch<SetStateAction<User | null>>;
  setSession: (user: SessionUser | null, token?: string) => void;
  signout: () => void;
}

export const AuthJwtContext = createContext({} as AuthJwtContextInterface);

const AuthJwtProvider = ({ children }: PropsWithChildren) => {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  const { data } = useGetCurrentUser();

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
    if (sessionUser?.provider === 'firebase') {
      firebaseAuth.signOut();
    }
  }, [setSessionUser, sessionUser]);

  useEffect(() => {
    if (data) {
      setSession(data);
    }
  }, [data]);

  return (
    <AuthJwtContext value={{ sessionUser, setSessionUser, setSession, signout }}>
      {children}
    </AuthJwtContext>
  );
};

export const useAuth = () => use(AuthJwtContext);

export const demoUser: SessionUser = {
  id: 0,
  email: 'guest@mail.com',
  name: 'Guest',
  avatar: users[13].avatar,
  designation: 'Merchant Captian ',
};

export default AuthJwtProvider;
