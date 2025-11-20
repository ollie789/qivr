import { createContext, useContext, ReactNode } from 'react';

const ChatContext = createContext<any>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  return <ChatContext.Provider value={{}}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);
export default ChatProvider;
