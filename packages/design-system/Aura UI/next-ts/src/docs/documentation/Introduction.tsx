'use client';

import { Link, ListItem, ListItemText, Typography } from '@mui/material';
import Code from 'components/base/Code';
import DocPageLayout from 'components/docs/DocPageLayout';
import DocSection, { DocList, DocSubtitle } from 'components/docs/DocSection';

const Introduction = () => {
  return (
    <DocPageLayout pageHeaderProps={{ title: 'Introduction' }}>
      <DocSection title="About Aurora">
        <Typography sx={{ color: 'text.secondary' }}>
          Aurora is a React-based admin and landing template designed primarily for the MUI Store,
          built with Material UI. It features a modular architecture with ready-to-use modern UI
          components and a developer-friendly coding structure. Aurora uses the latest technologies,
          libraries, and conventions to ensure a high-quality development experience.
        </Typography>
      </DocSection>
      <DocSection title="Primary Technology Stack">
        <DocList>
          <ListItem>
            <ListItemText disableTypography>
              <DocSubtitle component="span" sx={{ color: 'text.primary' }}>
                React:
              </DocSubtitle>{' '}
              Utilizes React and React Hooks for a dynamic and responsive user interface.
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText disableTypography>
              <DocSubtitle component="span" sx={{ color: 'text.primary' }}>
                React Router DOM:
              </DocSubtitle>{' '}
              Handles routing and navigation seamlessly. (Vite)
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText disableTypography>
              <DocSubtitle component="span" sx={{ color: 'text.primary' }}>
                NextJs App Router:
              </DocSubtitle>{' '}
              File based routing and navigation built into NextJs. (NextJs)
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText disableTypography>
              <DocSubtitle component="span" sx={{ color: 'text.primary' }}>
                E-Charts & Mapbox:
              </DocSubtitle>{' '}
              Provides powerful charting and mapping capabilities.
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText disableTypography>
              <DocSubtitle component="span" sx={{ color: 'text.primary' }}>
                React Hook Form & Yup:
              </DocSubtitle>{' '}
              Manages form validation and state with ease.
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText disableTypography>
              <DocSubtitle component="span" sx={{ color: 'text.primary' }}>
                React Context API:
              </DocSubtitle>{' '}
              Manages global state effectively.
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText disableTypography>
              <DocSubtitle component="span" sx={{ color: 'text.primary' }}>
                Axios & SWR:
              </DocSubtitle>{' '}
              Handles HTTP requests and data fetching with custom configurations.
            </ListItemText>
          </ListItem>
          <ListItem>
            <ListItemText disableTypography>
              <DocSubtitle component="span" sx={{ color: 'text.primary' }}>
                Third-Party Libraries:
              </DocSubtitle>{' '}
              Integrates various libraries for utilities, services, and UI components.
            </ListItemText>
          </ListItem>
        </DocList>
      </DocSection>
      <DocSection title="TypeScript">
        <Typography sx={{ color: 'text.secondary' }}>
          Aurora is fully developed in <Code>TypeScript</Code>, ensuring robust type checking and
          enhanced code quality. TypeScript's static type system helps catch errors early during
          development and improves overall code maintainability and readability.
        </Typography>
      </DocSection>
      <DocSection title="Authentication">
        <Typography sx={{ color: 'text.secondary' }}>
          Aurora supports multiple authentication methods, including <Code>JWT</Code>,{' '}
          <Code>Firebase</Code>, <Code>Auth0</Code>, <Code>NextAuth</Code> (for NextJs) and{' '}
          <Code>Social Platform Authentication</Code>, allowing flexibility and secure access
          management.
        </Typography>
      </DocSection>
      <DocSection title="Code Quality and Formatting">
        <Typography sx={{ color: 'text.secondary' }}>
          Aurora employs <Code>ESLint</Code> and <Code>Prettier</Code> to enforce code quality and
          consistency. ESLint provides static code analysis to identify problematic patterns and
          potential errors, while Prettier ensures consistent code formatting across the project.
        </Typography>
      </DocSection>
      <DocSection title="Vite">
        <Typography sx={{ color: 'text.secondary' }}>
          Aurora uses{' '}
          <Link href="https://vitejs.dev/" target="_blank">
            Vite
          </Link>{' '}
          as its build tool for its speed and modern features. Vite provides an optimized
          development experience with faster build times and hot module replacement, enhancing
          productivity and reducing waiting periods during development. It leverages ES modules and
          offers a streamlined workflow for modern JavaScript projects.
        </Typography>
      </DocSection>
      <DocSection title="NextJs">
        <Typography sx={{ color: 'text.secondary' }}>
          Aurora also supports a{' '}
          <Link href="https://nextjs.org/" target="_blank">
            Next.js
          </Link>{' '}
          version built with the App Router for modern file-based routing, layouts, and server
          components. It provides a full-stack development experience with built-in support for API
          routes, server-side rendering, metadata handling, and edge middleware. Next.js enhances
          performance through automatic code splitting, hybrid rendering, and flexible deployment
          options, making Aurora suitable for production-grade web applications.
        </Typography>
      </DocSection>
    </DocPageLayout>
  );
};

export default Introduction;
