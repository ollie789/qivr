import { Avatar, Link, Stack } from '@mui/material';
import { CommentType, PostType, ReplyType } from 'types/social';
import Actions from './Actions';
import Attachments from './Attachments';
import AuthorInfo from './AuthorInfo';
import TextContent from './TextContent';

interface ContentBlockProps {
  content: PostType | CommentType | ReplyType;
  toggleThreadInput: () => void;
}

const ContentBlock = ({ content, toggleThreadInput }: ContentBlockProps) => {
  return (
    <Stack spacing={2} py={2}>
      <Avatar
        component={Link}
        href="#!"
        src={content.author.avatar}
        alt="content-author-avatar"
        sx={{
          width: 32,
          height: 32,
          color: 'unset',
        }}
      />
      <Stack direction="column" minWidth={0}>
        <Stack direction="column" spacing={1}>
          <AuthorInfo author={content.author.name} createdAt={content.createdAt} />

          {content.message.text && <TextContent content={content.message.text} />}
          {content.message.attachments && (
            <Attachments
              attachments={content.message.attachments}
              sx={{
                '& img, & video': {
                  width: 1,
                  height: 1,
                  objectFit: 'cover',
                  aspectRatio: 1,
                },
              }}
            />
          )}

          <Actions engagement={content.engagement} toggleThreadInput={toggleThreadInput} />
        </Stack>

        {/* <CommentReplies comment={comment} />
        {commentOpen && <CreateComment comment={comment} setCommentOpen={setCommentOpen} />} */}
      </Stack>
    </Stack>
  );
};

export default ContentBlock;
