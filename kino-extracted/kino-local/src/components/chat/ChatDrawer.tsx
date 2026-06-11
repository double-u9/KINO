import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageCircle, Check, CheckCheck, Film, Star, Image as ImageIcon, Download, Music } from 'lucide-react';
import { fetchChatHistory, sendMessage, uploadChatImage, type ChatMessage } from '../../api/chat';
import { useAuthStore } from '../../store/useAuthStore';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  friendUsername: string;
}

export function ChatDrawer({ isOpen, onClose, friendId, friendName, friendAvatar, friendUsername }: ChatDrawerProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = async () => {
    try {
      const data = await fetchChatHistory(friendId);
      setMessages(data);
      setIsLoading(false);
    } catch {
      // Ignore errors silently for polling
    }
  };

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    loadMessages();

    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, friendId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      const newMessage = await sendMessage(friendId, content.trim());
      setMessages((prev) => [...prev, newMessage]);
      setContent('');
    } catch {
      // handle error
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(true);
    try {
      const { imageUrl } = await uploadChatImage(file);
      const payload = JSON.stringify({ type: 'image', url: imageUrl });
      const newMessage = await sendMessage(friendId, payload);
      setMessages((prev) => [...prev, newMessage]);
    } catch (err: any) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = url.split('/').pop() || 'download.webp';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 w-full h-full z-[101] flex flex-col shadow-2xl"
            style={{ background: 'rgba(10,10,10,0.98)', backdropFilter: 'blur(20px)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-edge bg-void/50">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-edge bg-edge flex-shrink-0">
                {friendAvatar ? (
                  <img src={friendAvatar} alt={friendName} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center font-bold text-ink uppercase">
                    {friendUsername[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink truncate">{friendName}</h3>
                <p className="text-[10px] text-ink-3 truncate">@{friendUsername}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {isLoading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-ink-3">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-ink-3">
                  <MessageCircle className="w-10 h-10 mb-2 opacity-50" />
                  <span className="text-xs">No messages yet. Say hi!</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;

                  let suggestionData = null;
                  let imageData = null;
                  try {
                    const parsed = JSON.parse(msg.content);
                    if (parsed.type === 'suggestion') {
                      suggestionData = parsed;
                    } else if (parsed.type === 'image') {
                      imageData = parsed;
                    }
                  } catch { }

                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl p-2 ${isMine
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-edge text-ink rounded-bl-sm'
                          }`}
                      >
                        {suggestionData ? (
                          <div className="flex flex-col gap-2 p-1">
                            <div className="flex items-center gap-1.5 opacity-80 mb-1">
                              {suggestionData.mediaType === 'music' ? <Music className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                              <span className="text-[10px] font-bold tracking-wider uppercase">Recommendation</span>
                            </div>
                            <div className="flex gap-3 bg-black/20 rounded-xl p-2.5 backdrop-blur-md border border-white/5">
                              <div className="w-12 h-16 rounded-md overflow-hidden bg-edge flex-shrink-0 shadow-lg">
                                {suggestionData.coverImageBase64 ? (
                                  <img src={suggestionData.coverImageBase64} alt={suggestionData.title} className="w-full h-full object-cover" />
                                ) : (
                                  suggestionData.mediaType === 'music' ? <Music className="w-5 h-5 m-auto mt-5 opacity-40" /> : <Film className="w-5 h-5 m-auto mt-5 opacity-40" />
                                )}
                              </div>
                              <div className="flex flex-col justify-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{suggestionData.mediaType}</span>
                                <h4 className="text-sm font-bold leading-tight line-clamp-2">{suggestionData.title}</h4>
                                {suggestionData.rating && suggestionData.mediaType !== 'music' ? (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 text-[#F5C518]" fill="currentColor" />
                                    <span className="text-[10px] font-bold">{suggestionData.rating}</span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : imageData ? (
                          <div className="p-1">
                            <div
                              onClick={() => setViewingImage(imageData.url)}
                              className="rounded-xl overflow-hidden bg-black/20 border border-white/5 max-w-[240px] cursor-pointer hover:opacity-90 transition-opacity"
                            >
                              <img src={imageData.url} alt="Sent image" className="w-full h-auto object-contain" />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm px-2 pt-1 break-words whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <div className={`flex items-center gap-1 mt-1 px-1 justify-end ${isMine ? 'text-blue-200' : 'text-ink-3'}`}>
                          <span className="text-[9px]">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            msg.read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" strokeWidth={2.5} />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-white/40" strokeWidth={2.5} />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-edge bg-void/50">
              <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSending}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-ink-3 hover:text-ink transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-edge rounded-full px-4 py-2 text-sm text-ink placeholder:text-ink-3 outline-none focus:border-edge-hi transition-colors"
                />
                <button
                  type="submit"
                  disabled={!content.trim() || isSending}
                  className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors flex-shrink-0"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Full Screen Image Viewer Modal */}
          <AnimatePresence>
            {viewingImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md"
                onClick={() => setViewingImage(null)}
              >
                {/* Close Button */}
                <button
                  onClick={() => setViewingImage(null)}
                  className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Download Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(viewingImage);
                  }}
                  className="absolute top-6 right-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                >
                  <Download className="w-5 h-5" />
                </button>

                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  src={viewingImage}
                  alt="Full screen view"
                  className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
