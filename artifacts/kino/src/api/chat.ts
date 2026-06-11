import { api } from './client';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export const fetchChatHistory = async (friendId: string): Promise<ChatMessage[]> => {
  return await api<ChatMessage[]>(`/api/chat/${friendId}`);
};

export const sendMessage = async (friendId: string, content: string): Promise<ChatMessage> => {
  return await api<ChatMessage>(`/api/chat/${friendId}`, {
    method: 'POST',
    body: { content },
  });
};

export const uploadChatImage = async (file: File): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return await api<{ imageUrl: string }>('/api/upload/chat-image', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
};
