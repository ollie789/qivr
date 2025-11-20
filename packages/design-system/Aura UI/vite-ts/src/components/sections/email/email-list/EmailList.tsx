import { useParams } from 'react-router';
import { List, Typography } from '@mui/material';
import { useEmailContext } from 'providers/EmailProvider';
import { Email as EmailType } from 'types/email';
import EmailListItem from './email-list-item/EmailListItem';

interface EmailListProps {
  title: string;
  emails: EmailType[];
}
const EmailList = ({ title, emails }: EmailListProps) => {
  const { resizableWidth } = useEmailContext();
  const { id } = useParams();

  return (
    <List
      disablePadding
      subheader={
        <Typography variant="subtitle2" sx={{ fontWeight: 700, px: 2 }}>
          {title}
        </Typography>
      }
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          px: 1,
        },
        (!id || resizableWidth > 500) && {
          px: { sm: 3 },
        },
      ]}
    >
      {emails.map((mail) => (
        <EmailListItem key={mail.id} mail={mail} />
      ))}
    </List>
  );
};

export default EmailList;
