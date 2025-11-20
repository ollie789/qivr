import { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, Tooltip } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { VisuallyHiddenInput } from 'components/styled/VisuallyHiddenInput';
import { Attachment, ChatFormValues } from '../ContentFooter';

const ChatAttachments = () => {
  const { setValue, watch } = useFormContext<ChatFormValues>();

  const currentAttachments = watch('attachments') || [];

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const newAttachments: Attachment[] = files.map((file) => ({
      type: file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
            ? 'audio'
            : 'file',
      file,
    }));

    setValue('attachments', [...currentAttachments, ...newAttachments]);

    event.target.value = '';
  };

  return (
    <Tooltip title="Attachments">
      <Button shape="square" color="neutral" component="label">
        <IconifyIcon icon="material-symbols:attachment-rounded" fontSize={20} />
        <VisuallyHiddenInput type="file" onChange={handleFileSelection} multiple />
      </Button>
    </Tooltip>
  );
};

export default ChatAttachments;
