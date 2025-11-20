import { Dispatch, PropsWithChildren, createContext, use, useReducer, useState } from 'react';
import { emails as allEmails } from 'data/email';
import { EMAILACTIONTYPE, emailReducer } from 'reducers/EmailReducer';
import { Email } from 'types/email';

export interface EmailInitialState {
  emails: Email[];
  email: Email | null;
  initialEmails: Email[];
}

interface EmailContextInterface {
  emailDispatch: Dispatch<EMAILACTIONTYPE>;
  emailState: EmailInitialState;
  resizableWidth: number;
  handleResize: (width: number) => void;
}

const initialState: EmailInitialState = {
  emails: [],
  email: null,
  initialEmails: allEmails,
};

export const emailSidebarWidth = 270;

const EmailContext = createContext({} as EmailContextInterface);

const EmailProvider = ({ children }: PropsWithChildren) => {
  const [emailState, emailDispatch] = useReducer(emailReducer, initialState);
  const [resizableWidth, setResizableWidth] = useState<number>(0);

  const handleResize = (width: number) => {
    setResizableWidth(width);
  };

  return (
    <EmailContext
      value={{
        emailState,
        emailDispatch,
        resizableWidth,
        handleResize,
      }}
    >
      {children}
    </EmailContext>
  );
};

export default EmailProvider;

export const useEmailContext = () => use(EmailContext);
