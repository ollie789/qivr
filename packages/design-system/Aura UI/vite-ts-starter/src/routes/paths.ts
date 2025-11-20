export const rootPaths = {
  root: '/',
  dashboardRoot: 'dashboard',
  pagesRoot: 'pages',
  miscRoot: 'misc',
  authRoot: 'authentication',
  pricingRoot: 'pricing',
  authDefaultJwtRoot: 'default/jwt',
  authDefaultFirebaseRoot: 'default/firebase',
  authDefaultAuth0Root: 'default/auth0',
  errorRoot: 'error',
  ecommerceRoot: 'ecommerce',
  ecommerceAdminRoot: 'admin',
  ecommerceCustomerRoot: 'customer',
  eventsRoot: 'events',
  emailRoot: 'email',
  kanbanRoot: 'kanban',
  appsRoot: 'apps',
};

const paths = {
  starter: `/${rootPaths.pagesRoot}/starter`,

  defaultJwtLogin: `/${rootPaths.authRoot}/${rootPaths.authDefaultJwtRoot}/login`,
  defaultJwtSignup: `/${rootPaths.authRoot}/${rootPaths.authDefaultJwtRoot}/sign-up`,
  defaultJwtForgotPassword: `/${rootPaths.authRoot}/${rootPaths.authDefaultJwtRoot}/forgot-password`,
  defaultJwt2FA: `/${rootPaths.authRoot}/${rootPaths.authDefaultJwtRoot}/2FA`,
  defaultJwtSetPassword: `/${rootPaths.authRoot}/${rootPaths.authDefaultJwtRoot}/set-password`,

  defaultAuth0Login: `/${rootPaths.authRoot}/${rootPaths.authDefaultAuth0Root}/login`,

  defaultFirebaseLogin: `/${rootPaths.authRoot}/${rootPaths.authDefaultFirebaseRoot}/login`,
  defaultFirebaseSignup: `/${rootPaths.authRoot}/${rootPaths.authDefaultFirebaseRoot}/sign-up`,
  defaultFirebaseForgotPassword: `/${rootPaths.authRoot}/${rootPaths.authDefaultFirebaseRoot}/forgot-password`,

  defaultLoggedOut: `/${rootPaths.authRoot}/default/logged-out`,
  pricingColumn: `/${rootPaths.pricingRoot}/column`,
  notifications: `/${rootPaths.pagesRoot}/notifications`, //? update path

  404: `/${rootPaths.errorRoot}/404`,
};

export const authPaths = {
  /* ---------------------------------JWT----------------------------------------- */
  login: paths.defaultJwtLogin,
  signup: paths.defaultJwtSignup,
  forgotPassword: paths.defaultJwtForgotPassword,
  setNewPassword: paths.defaultJwtSetPassword,
  twoFactorAuth: paths.defaultJwt2FA,
  /* ---------------------------------Firebase----------------------------------------- */
  // login: paths.defaultFirebaseLogin,
  // signup: paths.defaultFirebaseSignup,
  // forgotPassword: paths.defaultFirebaseForgotPassword,
  /* ---------------------------------Auth0----------------------------------------- */
  // login: paths.defaultAuth0Login,
};

export const apiEndpoints = {
  register: '/auth/register',
  login: '/auth/login',
  logout: '/auth/logout',
  profile: '/auth/profile',
  getUsers: '/users',
  forgotPassword: '/auth/forgot-password',
  setPassword: '/auth/set-password',
  getProduct: (id: string) => `e-commerce/products/${id}`,
};

export default paths;
