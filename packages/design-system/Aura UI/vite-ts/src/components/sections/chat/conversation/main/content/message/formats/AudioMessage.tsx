import { Stack } from '@mui/material';
import { SxProps } from '@mui/material/styles';
import AudioPlayer from 'components/sections/chat/common/AudioPlayer';

interface AudioMessageProps {
  media?: { type: 'audio'; src: string }[];
  currentMessageType: 'sent' | 'received';
  sx?: SxProps;
}

const AudioMessage = ({ media = [], currentMessageType }: AudioMessageProps) => {
  const audioFiles = media.filter((item) => item.type === 'audio');

  if (audioFiles.length === 0) return null;

  return (
    <Stack direction="column" gap={0.5}>
      {audioFiles.map((audio, index) => (
        <AudioPlayer key={index} src={audio.src} messageType={currentMessageType} />
      ))}
    </Stack>
  );
};

export default AudioMessage;
