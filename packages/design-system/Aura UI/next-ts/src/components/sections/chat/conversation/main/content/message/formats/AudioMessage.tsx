import { Stack } from '@mui/material';
import { SxProps } from '@mui/material/styles';
import { MediaType } from 'types/chat';
import AudioPlayer from 'components/sections/chat/common/AudioPlayer';

interface AudioMessageProps {
  media?: (MediaType & { type: 'audio' })[];
  currentMessageType: 'sent' | 'received';
  sx?: SxProps;
}

const AudioMessage = ({ media = [], currentMessageType }: AudioMessageProps) => {
  const audioFiles = media.filter((item) => item.type === 'audio');

  if (audioFiles.length === 0) return null;

  return (
    <Stack direction="column" gap={0.5}>
      {audioFiles.map((audio, index) => (
        <AudioPlayer key={index} src={audio.src as string} messageType={currentMessageType} />
      ))}
    </Stack>
  );
};

export default AudioMessage;
