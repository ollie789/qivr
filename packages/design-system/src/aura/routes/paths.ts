const paths = {
  index: '/',
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    defaultJwtLogin: '/login',
  },
  dashboard: '/dashboard',
  showcase: {
    root: '/showcase',
    ecommerce: '/showcase/ecommerce',
  },
  root: '/',
  ecommerce: {
    root: '/ecommerce',
    products: '/ecommerce/products',
  },
  // Add more routes as needed by Aura components
};

export const rootPaths = paths;
export default paths;
