import { useState, useEffect } from 'react';
import { fetchMessages, markAsRead, sendMessage, type Message, type SendMessageRequest } from '../services/messagesApi';

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetchMessages();
      setMessages(response.items);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      await markAsRead(message.id);
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, read: true } : m));
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    setShowCompose(true);
  };

  const handleSendMessage = async (request: SendMessageRequest) => {
    try {
      await sendMessage(request);
      setShowCompose(false);
      setReplyTo(null);
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading messages...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Messages List */}
      <div className="w-1/3 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button
            onClick={() => setShowCompose(true)}
            className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            New Message
          </button>
        </div>
        <div className="divide-y">
          {messages.map(message => (
            <div
              key={message.id}
              onClick={() => handleSelectMessage(message)}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${!message.read ? 'bg-blue-50' : ''} ${selectedMessage?.id === message.id ? 'bg-blue-100' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold">{message.from}</div>
                  <div className="text-sm text-gray-600">{message.subject}</div>
                </div>
                <div className="text-xs text-gray-500">{new Date(message.date).toLocaleDateString()}</div>
              </div>
              {!message.read && <div className="mt-1 text-xs text-blue-600 font-semibold">Unread</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Message Detail */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            <div className="p-6 border-b bg-white">
              <h3 className="text-xl font-semibold">{selectedMessage.subject}</h3>
              <div className="mt-2 text-sm text-gray-600">
                <div>From: {selectedMessage.from}</div>
                <div>Date: {new Date(selectedMessage.date).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose max-w-none">{selectedMessage.content}</div>
            </div>
            <div className="p-4 border-t bg-white">
              <button
                onClick={() => handleReply(selectedMessage)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Reply
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a message to read
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          replyTo={replyTo}
          onSend={handleSendMessage}
          onClose={() => {
            setShowCompose(false);
            setReplyTo(null);
          }}
        />
      )}
    </div>
  );
}

function ComposeModal({
  replyTo,
  onSend,
  onClose,
}: {
  replyTo: Message | null;
  onSend: (request: SendMessageRequest) => Promise<void>;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSend({
        recipientId: 'provider', // This should be dynamic based on the clinic
        subject,
        content,
        parentMessageId: replyTo?.id,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-4">
          {replyTo ? 'Reply to Message' : 'New Message'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border rounded px-3 py-2 h-48"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
