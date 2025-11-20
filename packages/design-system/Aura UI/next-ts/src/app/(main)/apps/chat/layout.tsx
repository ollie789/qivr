import { ReactNode } from 'react';
import ChatLayout from 'components/sections/chat/ChatLayout';

const Layout = ({ children }: { children: ReactNode }) => {
  return <ChatLayout>{children}</ChatLayout>;
};

export default Layout;
