import { KeyboardEvent } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { inputBaseClasses } from '@mui/material';
import StyledTextField from 'components/styled/StyledTextField';
import { ChatFormValues } from './ContentFooter';

const isOnlyEmojis = (text: string): boolean => {
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji_Modifier}|\p{Emoji_Modifier_Base}|\s)+$/u;

  return emojiRegex.test(text.trim()) && /\p{Emoji_Presentation}/u.test(text);
};

interface TextInputProps {
  onSubmit: (data: ChatFormValues) => void;
}

const TextInput = ({ onSubmit }: TextInputProps) => {
  const { register, control, handleSubmit } = useFormContext<ChatFormValues>();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const textValue = useWatch({ control, name: 'text' });

  return (
    <StyledTextField
      fullWidth
      multiline
      maxRows={3}
      placeholder="Write a message"
      {...register('text')}
      onKeyDown={handleKeyDown}
      sx={{
        [`& .${inputBaseClasses.root}`]: {
          py: 0.5,
          '&:hover': { bgcolor: 'transparent' },
          [`&.${inputBaseClasses.focused}`]: { boxShadow: 'none', bgcolor: 'transparent' },
          [`& .${inputBaseClasses.input}`]: {
            py: 0.5,
            px: '10px !important',
            fontSize: isOnlyEmojis(textValue || '') ? 'h2.fontSize' : 'unset',
            lineHeight: isOnlyEmojis(textValue || '') ? 1.2 : 'unset',
          },
        },
      }}
    />
  );
};

export default TextInput;
