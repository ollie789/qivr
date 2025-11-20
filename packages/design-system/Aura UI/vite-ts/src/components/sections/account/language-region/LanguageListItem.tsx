import {
  Checkbox,
  ListItem,
  ListItemButton,
  ListItemProps,
  ListItemText,
  Typography,
  listItemSecondaryActionClasses,
} from '@mui/material';
import { Language } from 'types/accounts';

interface LanguageListItemProps extends ListItemProps {
  language: Language;
  updatedLanguages: Language[];
  toggleLanguage: (language: Language, isChecked: boolean) => void;
}

const LanguageListItem = ({
  language,
  updatedLanguages,
  toggleLanguage,
  ref,
  ...props
}: LanguageListItemProps) => {
  const isChecked = updatedLanguages.some((l) => l.id === language.id);

  return (
    <ListItem
      ref={ref}
      disablePadding
      disableGutters
      secondaryAction={
        <Checkbox
          size="small"
          checked={isChecked}
          onChange={(event) => toggleLanguage(language, event.target.checked)}
        />
      }
      sx={{
        [`& .${listItemSecondaryActionClasses.root}`]: {
          mr: '7px',
        },
      }}
      {...props}
    >
      <ListItemButton
        disableGutters
        sx={{ py: 1.25 }}
        role={undefined}
        onClick={() => toggleLanguage(language, !isChecked)}
      >
        <ListItemText
          primary={
            <Typography sx={{ color: 'text.primary' }}>
              {language.name} -{' '}
              <Typography component="span" sx={{ color: 'text.secondary' }}>
                {language.label}
              </Typography>
            </Typography>
          }
          sx={{ my: 0 }}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default LanguageListItem;
