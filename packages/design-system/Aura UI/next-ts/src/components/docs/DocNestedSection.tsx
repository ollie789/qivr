import { ReactNode } from 'react';
import { Box, BoxProps, Typography } from '@mui/material';
import { kebabCase } from 'lib/utils';
import AnchorLinkContainer from 'components/base/AnchorLinkContainer';
import ScrollSpyContent from 'components/scroll-spy/ScrollSpyContent';

interface DocNestedSectionProps extends BoxProps {
  title: string;
  titleEl?: ReactNode;
  component?: React.ElementType;
}

const DocNestedSection = ({ title, children, titleEl, id, ...rest }: DocNestedSectionProps) => {
  return (
    <Box {...rest}>
      <ScrollSpyContent id={kebabCase(id ?? title)}>
        {titleEl ? (
          titleEl
        ) : (
          <AnchorLinkContainer hashHref={kebabCase(title)} sx={{ mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
          </AnchorLinkContainer>
        )}
      </ScrollSpyContent>

      {children}
    </Box>
  );
};

DocNestedSection.componentName = 'DocNestedSection';

export default DocNestedSection;
