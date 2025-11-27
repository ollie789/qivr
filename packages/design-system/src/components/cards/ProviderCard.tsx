import { auraTokens } from "../../theme/auraTokens";
import React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

export interface ProviderCardProps {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  avatar?: string;
}

/**
 * A card for displaying and selecting providers
 */
export const ProviderCard: React.FC<ProviderCardProps> = ({
  id,
  name,
  title,
  subtitle,
  selected = false,
  onSelect,
  avatar,
}) => {
  return (
    <ListItem disablePadding sx={{ mb: 1 }}>
      <ListItemButton
        selected={selected}
        onClick={() => onSelect?.(id)}
        sx={{
          border: 1,
          borderColor: selected ? 'primary.main' : 'divider',
          borderRadius: auraTokens.borderRadius.sm,
        }}
      >
        <ListItemAvatar>
          <Avatar src={avatar}>
            <PersonIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={name}
          secondary={subtitle || title}
        />
      </ListItemButton>
    </ListItem>
  );
};
