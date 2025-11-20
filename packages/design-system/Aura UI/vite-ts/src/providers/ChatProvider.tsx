import { Dispatch, PropsWithChildren, createContext, use, useReducer } from 'react';
import { users } from 'data/users';
import { ACTIONTYPE, SET_CHAT_SIDEBAR_STATE, chatReducer } from 'reducers/ChatReducer';
import { Conversation } from 'types/chat';
import { User } from 'types/users';

export type ConversationFilterType = 'all' | 'unread' | 'starred';

export interface ChatState {
  initialConversations: Conversation[];
  conversations: Conversation[];
  currentConversation: null | Conversation;
  currentUser: User;
  filterBy: ConversationFilterType;
  searchQuery: string;
  shouldMessagesScroll: boolean;
  isChatSidebarOpen: boolean;
}

interface ChatContextInterface extends ChatState {
  chatDispatch: Dispatch<ACTIONTYPE>;
  handleChatSidebar: (value?: boolean) => void;
}

export const ChatContext = createContext({} as ChatContextInterface);

interface ChatProviderProps {
  conversations: Conversation[];
}

const ChatProvider = ({ conversations, children }: PropsWithChildren<ChatProviderProps>) => {
  const initState: ChatState = {
    initialConversations: conversations,
    conversations: conversations,
    currentConversation: null,
    currentUser: users[14],
    filterBy: 'all',
    searchQuery: '',
    shouldMessagesScroll: true,
    isChatSidebarOpen: false,
  };

  const [chatState, chatDispatch] = useReducer(chatReducer, initState);

  const handleChatSidebar = (value?: boolean) => {
    chatDispatch({
      type: SET_CHAT_SIDEBAR_STATE,
      payload: value ?? !chatState.isChatSidebarOpen,
    });
  };

  const chatContextValue: ChatContextInterface = {
    ...chatState,
    chatDispatch,
    handleChatSidebar,
  };

  return <ChatContext value={chatContextValue}>{children}</ChatContext>;
};

export const useChatContext = () => use(ChatContext);

export default ChatProvider;
