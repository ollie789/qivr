import { NextAuthOptions, User } from 'next-auth';
import Auth0Provider from 'next-auth/providers/auth0';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { users } from 'data/users';
import paths, { apiEndpoints } from 'routes/paths';
import axiosInstance from 'services/axios/axiosInstance';
import {
  firebaseLoginProviderConfig,
  firebaseSignupProviderConfig,
} from 'services/firebase/firebase-provider';

export interface SessionUser extends User {
  email: string;
  name: string;
  image?: string;
  type?: string;
  designation?: string;
}

export const demoUser: SessionUser = {
  id: '01',
  email: 'guest@mail.com',
  name: 'Guest',
  image: users[13].avatar,
  designation: 'Merchant Captain ',
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (credentials) {
          try {
            const res = await axiosInstance.post(apiEndpoints.login, {
              email: credentials.email,
              password: credentials.password,
            });
            return res;
          } catch (error: any) {
            throw new Error(error.data?.message);
          }
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: 'jwt-signup',
      name: 'Jwt Signup',
      credentials: {
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (credentials) {
          try {
            const res = await axiosInstance.post(apiEndpoints.register, {
              name: credentials.name,
              email: credentials.email,
              password: credentials.password,
            });

            return res;
          } catch (error: any) {
            throw new Error(error.data?.message);
          }
        }
        return null;
      },
    }),

    CredentialsProvider(firebaseLoginProviderConfig),
    CredentialsProvider(firebaseSignupProviderConfig),

    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID as string,
      clientSecret: process.env.AUTH0_CLIENT_SECRET as string,
      issuer: ('https://' + process.env.AUTH0_DOMAIN) as string,
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID as string,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
      tenantId: process.env.AZURE_AD_TENANT_ID as string,
    }),
  ],
  session: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt(jwtParams) {
      const { token, user } = jwtParams;

      if (user) return { ...token, ...user };

      return token;
    },

    async session(sessionParams) {
      const { token, session } = sessionParams;
      session.user.id = token.id as string;

      if (token.user) {
        session.user = token.user;
      }
      if (token.authToken) {
        session.authToken = token.authToken;
      }
      if (!session.user) {
        session.user = demoUser;
      }
      return session;
    },
  },

  pages: {
    signIn: paths.defaultJwtLogin,
    signOut: paths.defaultLoggedOut,
  },
};
