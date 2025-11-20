import { SxProps } from '@mui/material';
import paths, { rootPaths } from './paths';

export interface SubMenuItem {
  name: string;
  pathName: string;
  key?: string;
  selectionPrefix?: string;
  path?: string;
  active?: boolean;
  icon?: string;
  iconSx?: SxProps;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string;
  key?: string; // used for the locale
  subheader: string;
  icon: string;
  iconSx?: SxProps;
  items: SubMenuItem[];
}

const sitemap: MenuItem[] = [
  {
    id: 'pages',
    subheader: 'Pages',
    key: 'pages',
    icon: 'material-symbols:view-quilt-outline',
    items: [
      {
        name: 'Starter',
        key: 'starter',
        path: rootPaths.root,
        pathName: 'starter',
        icon: 'material-symbols:play-circle-outline-rounded',
        active: true,
      },
      {
        name: 'Error 404',
        key: 'error_404',
        pathName: 'error',
        active: true,
        icon: 'material-symbols:warning-outline-rounded',
        path: paths[404],
      },
    ],
  },
  {
    id: 'authentication',
    subheader: 'Authentication',
    key: 'authentication',
    icon: 'material-symbols:security-rounded',
    items: [
      {
        name: 'Login',
        key: 'login',
        icon: 'material-symbols:login',
        path: paths.defaultJwtLogin,
        pathName: 'login',
        active: true,
      },
      {
        name: 'Sign up',
        key: 'sign_up',
        icon: 'material-symbols:person-add-outline',
        path: paths.defaultJwtSignup,
        pathName: 'sign-up',
        active: true,
      },
      {
        name: 'Forgot password',
        key: 'forgot_password',
        icon: 'material-symbols:key-outline',
        path: paths.defaultJwtForgotPassword,
        pathName: 'forgot-password',
        active: true,
      },
      {
        name: '2FA',
        key: '2FA',
        icon: 'material-symbols:enhanced-encryption-outline',
        path: paths.defaultJwt2FA,
        pathName: '2FA',
        active: true,
      },
      {
        name: 'Set password',
        key: 'set_password',
        icon: 'material-symbols:settings-outline',
        path: paths.defaultJwtSetPassword,
        pathName: 'default-set-password',
        active: true,
      },
    ],
  },
  {
    id: 'misc',
    subheader: 'Misc',
    key: 'misc',
    icon: 'material-symbols:dashboard-customize-outline-rounded',
    items: [
      {
        name: 'Multi level',
        key: 'multi_level',
        pathName: 'multi-level',
        icon: 'material-symbols:layers-outline-rounded',
        active: true,
        items: [
          {
            name: 'Level two (1)',
            key: 'level_two_1',
            path: '#!',
            pathName: 'multi-level-2',
            active: true,
          },
          {
            name: 'Level two (2)',
            key: 'level_two_2',
            pathName: 'multi-level-3',
            active: true,
            items: [
              {
                name: 'Level three (1)',
                key: 'level_three_1',
                path: '#!',
                pathName: 'multi-level-item-3',
                active: true,
              },
              {
                name: 'Level three (2)',
                key: 'level_three_2',
                path: '#!',
                pathName: 'multi-level-item-4',
                active: true,
              },
            ],
          },
          {
            name: 'Level two (3)',
            key: 'level_two_3',
            pathName: 'multi-level-4',
            active: true,
            items: [
              {
                name: 'Level three (3)',
                key: 'level_three_3',
                path: '#!',
                pathName: 'multi-level-item-6',
                active: true,
              },
              {
                name: 'Level three (4)',
                key: 'level_three_4',
                pathName: 'multi-level-item-7',
                active: true,
                items: [
                  {
                    name: 'Level four (1)',
                    key: 'level_four_1',
                    path: '#!',
                    pathName: 'multi-level-item-8',
                    active: true,
                  },
                  {
                    name: 'Level four (2)',
                    key: 'level_four_2',
                    pathName: 'multi-level-item-9',
                    active: true,
                    items: [
                      {
                        name: 'Level five (1)',
                        key: 'level_five_1',
                        path: '#!',
                        pathName: 'multi-level-item-10',
                        active: true,
                      },
                      {
                        name: 'Level five (2)',
                        key: 'level_five_2',
                        path: '#!',
                        pathName: 'multi-level-item-11',
                        active: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export default sitemap;
