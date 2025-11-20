import { getItemFromStore, setItemToStore } from 'lib/utils';
import { User } from './api-hooks/useAuthApi';

const testUser: User = {
  email: 'demo@aurora.com',
  id: 1,
  name: 'Demo User',
  type: 'test',
  avatar: null,
};

export const getProfileFetcher = (): Promise<User | null> =>
  new Promise((resolve) => {
    const user = getItemFromStore('session_user');
    if (user) {
      resolve(testUser);
    }
    resolve(null);
  });

export const loginFetcher = (): Promise<{ user: User }> =>
  new Promise((resolve) => {
    setTimeout(() => {
      setItemToStore('session_user', JSON.stringify(testUser));
      resolve({ user: testUser });
    }, 1000);
  });

export const sendPasswordResetLinkFetcher = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve('success');
    }, 1000);
  });
