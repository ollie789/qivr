import { Suspense, lazy } from 'react';
import { Outlet, RouteObject, createBrowserRouter, useLocation } from 'react-router';
import App from 'App';
import AuthLayout from 'layouts/auth-layout';
import DefaultAuthLayout from 'layouts/auth-layout/DefaultAuthLayout';
import MainLayout from 'layouts/main-layout';
import Page404 from 'pages/errors/Page404';
import PageLoader from 'components/loading/PageLoader';
import paths, { rootPaths } from './paths';

// import AuthGurad from 'components/guard/AuthGuard';
// import GuestGurad from 'components/guard/GuestGurad';
// import Splash from 'components/loading/Splash';

const Starter = lazy(() => import('pages/others/Starter'));

const LoggedOut = lazy(() => import('pages/authentication/default/LoggedOut'));

const Login = lazy(() => import('pages/authentication/default/jwt/Login'));
const Signup = lazy(() => import('pages/authentication/default/jwt/Signup'));
const ForgotPassword = lazy(() => import('pages/authentication/default/jwt/ForgotPassword'));
const TwoFA = lazy(() => import('pages/authentication/default/jwt/TwoFA'));
const SetPassword = lazy(() => import('pages/authentication/default/jwt/SetPassword'));
const FirebaseLogin = lazy(() => import('pages/authentication/default/firebase/Login'));
const FirebaseSignup = lazy(() => import('pages/authentication/default/firebase/Signup'));
const FirebaseForgotPassword = lazy(
  () => import('pages/authentication/default/firebase/ForgotPassword'),
);
const Auth0Login = lazy(() => import('pages/authentication/default/auth0/Login'));

export const SuspenseOutlet = () => {
  const location = useLocation();

  return (
    <Suspense key={location.pathname} fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
};

export const routes: RouteObject[] = [
  {
    element: (
      // Uncomment the following line to enable the Suspense fallback for initial loading when using AuthGuard

      // <Suspense fallback={<Splash />}>
      <App />
      // </Suspense>
    ),
    children: [
      {
        path: '/',
        element: (
          // Uncomment the following line to activate the AuthGuard for protected routes

          // <AuthGurad>
          <MainLayout>
            <SuspenseOutlet />
          </MainLayout>
          // </AuthGurad>
        ),
        children: [
          {
            index: true,
            element: <Starter />,
          },
        ],
      },

      {
        path: rootPaths.authRoot,
        element: (
          // Uncomment the following line to activate the GuestGurad for guest routes

          // <GuestGurad>
          <AuthLayout />
          // </GuestGurad>
        ),
        children: [
          {
            element: (
              <DefaultAuthLayout>
                <SuspenseOutlet />
              </DefaultAuthLayout>
            ),
            children: [
              {
                path: rootPaths.authDefaultJwtRoot,
                children: [
                  {
                    path: paths.defaultJwtLogin,
                    element: <Login />,
                  },
                  {
                    path: paths.defaultJwtSignup,
                    element: <Signup />,
                  },
                  {
                    path: paths.defaultJwtForgotPassword,
                    element: <ForgotPassword />,
                  },
                  {
                    path: paths.defaultJwt2FA,
                    element: <TwoFA />,
                  },
                  {
                    path: paths.defaultJwtSetPassword,
                    element: <SetPassword />,
                  },
                ],
              },
              {
                path: rootPaths.authDefaultFirebaseRoot,
                children: [
                  {
                    path: paths.defaultFirebaseLogin,
                    element: <FirebaseLogin />,
                  },
                  {
                    path: paths.defaultFirebaseSignup,
                    element: <FirebaseSignup />,
                  },
                  {
                    path: paths.defaultFirebaseForgotPassword,
                    element: <FirebaseForgotPassword />,
                  },
                ],
              },
              {
                path: rootPaths.authDefaultAuth0Root,
                children: [
                  {
                    path: paths.defaultAuth0Login,
                    element: <Auth0Login />,
                  },
                ],
              },
              {
                path: paths.defaultLoggedOut,
                element: <LoggedOut />,
              },
            ],
          },
        ],
      },

      {
        path: '*',
        element: <Page404 />,
      },
    ],
  },
];

const router = createBrowserRouter(routes, {
  basename: import.meta.env.VITE_BASENAME || '/',
});

export default router;
