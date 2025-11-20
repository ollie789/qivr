import { useFormContext } from 'react-hook-form';
import { Button, Tooltip } from '@mui/material';
import EmojiPicker from 'components/base/EmojiPicker';
import IconifyIcon from 'components/base/IconifyIcon';
import { ChatFormValues } from '../ContentFooter';

const ChatEmojiPicker = () => {
  const { setValue, watch } = useFormContext<ChatFormValues>();

  const currentText = watch('text') || '';

  const handleEmojiSelect = (native: string) => {
    setValue('text', currentText + native);
  };

  return (
    <EmojiPicker
      handleEmojiSelect={handleEmojiSelect}
      actionButtonEle={
        <Tooltip title="Emoji">
          <Button shape="square" color="neutral">
            <IconifyIcon icon="material-symbols:mood-outline-rounded" fontSize={20} />
          </Button>
        </Tooltip>
      }
    />
  );
};

export default ChatEmojiPicker;
