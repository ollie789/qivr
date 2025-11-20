import { withAuth } from 'next-auth/middleware';
import paths from 'routes/paths';

export default withAuth({
  pages: {
    signIn: paths.defaultJwtLogin,
    signOut: paths.defaultLoggedOut,
  },
});

export const config = { matcher: [] };
