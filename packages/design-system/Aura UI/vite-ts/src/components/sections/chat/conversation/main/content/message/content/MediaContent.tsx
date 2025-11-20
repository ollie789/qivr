import { useMemo } from 'react';
import { Theme } from '@mui/material';
import { useChatContext } from 'providers/ChatProvider';
import { MediaType, MessageType } from 'types/chat';
import MessageWrapper from '../MessageWrapper';
import AudioMessage from '../formats/AudioMessage';
import MediaMessage from '../formats/MediaMessage';

interface MediaContentProps {
  message: MessageType;
}

const MediaContent = ({ message }: MediaContentProps) => {
  const { currentConversation } = useChatContext();
  const { type, attachments } = message;

  const prevMessageType = useMemo(() => {
    if (!currentConversation) return;
    const index = currentConversation.messages.findIndex((m) => m.id === message.id);

    return index > 0 ? currentConversation.messages[index - 1].type : undefined;
  }, [currentConversation?.messages, message.id]);

  if (!attachments?.media?.length || !currentConversation) return null;

  const mediaByType = {
    visual: attachments.media.filter((m) => ['image', 'video'].includes(m.type)) as Array<
      MediaType & { type: 'image' | 'video' }
    >,
    audio: attachments.media.filter((m) => m.type === 'audio') as Array<
      MediaType & { type: 'audio' }
    >,
  };

  return (
    <>
      {mediaByType.visual.length > 0 && (
        <MessageWrapper key="visual-media" message={message} sx={{ p: 0, bgcolor: 'transparent' }}>
          <MediaMessage
            currentMessageType={type}
            media={mediaByType.visual}
            sx={{
              borderRadius: (theme: Theme) =>
                type !== prevMessageType
                  ? theme.spacing(type === 'received' ? 0 : 2, type === 'received' ? 2 : 0, 2, 2)
                  : 4,
            }}
          />
        </MessageWrapper>
      )}
      {mediaByType.audio.length > 0 && (
        <MessageWrapper key="audio-media" message={message} sx={{ p: 0, bgcolor: 'transparent' }}>
          <AudioMessage currentMessageType={type} media={mediaByType.audio} />
        </MessageWrapper>
      )}
    </>
  );
};

export default MediaContent;
