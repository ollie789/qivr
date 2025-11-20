 
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number | string;
      email: string;
      name: string;
      image?: string;
      designation?: string;
    };
    authToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: {
      id: number;
      email: string;
      name: string;
      designation?: string;
    };
    authToken: string;
  }
}
