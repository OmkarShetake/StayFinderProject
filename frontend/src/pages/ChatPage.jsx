import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../context/ToastContext';
import messageService from '../services/messageService';
import aiService from '../services/aiService';

export default function ChatPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addMessageListener, addNotificationListener } = useWebSocket();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputContent, setInputContent] = useState('');
  const [sending, setSending] = useState(false);
  const [chatPartnerName, setChatPartnerName] = useState('Conversation');
  const [smartReplies, setSmartReplies] = useState([]);
  const [showAiCustomBox, setShowAiCustomBox] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [draftingAi, setDraftingAi] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Generate smart replies when messages load or change
  useEffect(() => {
    if (!messages.length) {
      aiService.generateSmartReplies({ guestName: chatPartnerName }).then(setSmartReplies);
      return;
    }
    const lastTheirs = [...messages].reverse().find((m) => m.senderId !== user?.id);
    aiService
      .generateSmartReplies({
        latestMessage: lastTheirs ? lastTheirs.content : '',
        guestName: lastTheirs?.senderName || chatPartnerName,
      })
      .then(setSmartReplies);
  }, [messages, user?.id, chatPartnerName]);

  const loadMessages = async () => {
    if (!bookingId) return;
    try {
      const msgs = await messageService.getMessages(bookingId);
      const list = Array.isArray(msgs) ? msgs : [];
      setMessages(list);

      const other = list.find((m) => m.senderId !== user?.id);
      if (other) {
        setChatPartnerName(other.senderName);
      } else if (list.length > 0) {
        setChatPartnerName(list[0].receiverName || 'Your host');
      } else {
        setChatPartnerName('Conversation');
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time message listener
  useEffect(() => {
    const unsubMsg = addMessageListener((msg) => {
      if (String(msg.bookingId) === String(bookingId)) {
        loadMessages();
      }
    });

    const unsubNotif = addNotificationListener((notif) => {
      if (String(notif.bookingId) === String(bookingId)) {
        loadMessages();
      }
    });

    return () => {
      unsubMsg();
      unsubNotif();
    };
  }, [addMessageListener, addNotificationListener, bookingId]);

  const handleSend = async () => {
    const content = inputContent.trim();
    if (!content) return;

    setSending(true);
    try {
      await messageService.sendMessage({
        bookingId: parseInt(bookingId),
        content,
      });
      setInputContent('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      await loadMessages();
    } catch (err) {
      showToast('Failed to send: ' + err.message);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
  };

  return (
    <>
      <Navbar />

      <main className="chat-layout" style={{ maxWidth: '800px', margin: '24px auto', padding: '0 16px' }}>
        <div
          className="chat-card"
          style={{
            background: 'var(--white)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            height: '75vh',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="chat-header"
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <button
              type="button"
              id="chat-back"
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ←
            </button>
            <div>
              <div id="chat-title" style={{ fontWeight: 700, fontSize: '16px' }}>
                {chatPartnerName}
              </div>
              <div id="chat-subtitle" style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                Booking #{bookingId}
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div
            className="chat-messages"
            id="chat-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {loading ? (
              <div className="chat-empty" style={{ textAlign: 'center', color: 'var(--text-2)' }}>
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty" style={{ textAlign: 'center', color: 'var(--text-2)', marginTop: '40px' }}>
                No messages yet. Say hello! 👋
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === user?.id;
                const time = new Date(m.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={m.id}
                    className={`chat-msg ${isMine ? 'mine' : 'theirs'}`}
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '70%',
                    }}
                  >
                    {!isMine && (
                      <div className="chat-sender" style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '2px' }}>
                        {m.senderName}
                      </div>
                    )}
                    <div
                      className="chat-bubble"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '16px',
                        background: isMine ? 'var(--red)' : 'var(--bg)',
                        color: isMine ? 'white' : 'var(--text)',
                        fontSize: '14px',
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                      }}
                    >
                      {m.content}
                    </div>
                    <div
                      className="chat-time"
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-3)',
                        textAlign: isMine ? 'right' : 'left',
                        marginTop: '2px',
                      }}
                    >
                      {time}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* AI Co-Host Smart Reply Assistant */}
          <div
            className="chat-ai-assistant"
            style={{
              padding: '10px 16px',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#4F46E5' }}>
                <span>✨</span> AI Co-Host Quick Replies:
              </div>
              <button
                type="button"
                onClick={() => setShowAiCustomBox(!showAiCustomBox)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6366F1',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {showAiCustomBox ? 'Hide custom prompter' : '✏️ Prompt AI draft'}
              </button>
            </div>

            {/* Smart Reply Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {smartReplies.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputContent(r.text);
                    showToast('AI draft applied! ✨');
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                      textareaRef.current.style.height = 'auto';
                      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#1E293B',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1';
                    e.currentTarget.style.color = '#4F46E5';
                    e.currentTarget.style.background = '#EEF2FF';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.color = '#1E293B';
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Custom AI Prompter */}
            {showAiCustomBox && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="e.g. allow early check-in at 12pm, welcome them to Goa"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    padding: '6px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!customPrompt.trim()) return;
                      setDraftingAi(true);
                      const lastTheirs = [...messages].reverse().find((m) => m.senderId !== user?.id);
                      aiService
                        .generateCustomDraft({
                          prompt: customPrompt,
                          guestMessage: lastTheirs?.content || '',
                          guestName: chatPartnerName,
                        })
                        .then((drafted) => {
                          setInputContent(drafted);
                          setShowAiCustomBox(false);
                          setCustomPrompt('');
                          showToast('AI reply drafted! ✨');
                          if (textareaRef.current) {
                            textareaRef.current.focus();
                            textareaRef.current.style.height = 'auto';
                            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
                          }
                        })
                        .finally(() => setDraftingAi(false));
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={draftingAi || !customPrompt.trim()}
                  onClick={() => {
                    if (!customPrompt.trim()) return;
                    setDraftingAi(true);
                    const lastTheirs = [...messages].reverse().find((m) => m.senderId !== user?.id);
                    aiService
                      .generateCustomDraft({
                        prompt: customPrompt,
                        guestMessage: lastTheirs?.content || '',
                        guestName: chatPartnerName,
                      })
                      .then((drafted) => {
                        setInputContent(drafted);
                        setShowAiCustomBox(false);
                        setCustomPrompt('');
                        showToast('AI reply drafted! ✨');
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                          textareaRef.current.style.height = 'auto';
                          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
                        }
                      })
                      .finally(() => setDraftingAi(false));
                  }}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    background: '#6366F1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                >
                  {draftingAi ? 'Drafting...' : 'Generate'}
                </button>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div
            className="chat-footer"
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={textareaRef}
              id="chat-input"
              className="form-input"
              rows="1"
              placeholder="Write a message... (Enter to send)"
              value={inputContent}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                resize: 'none',
                minHeight: '40px',
                maxHeight: '100px',
                borderRadius: '20px',
                padding: '10px 16px',
              }}
            />
            <button
              type="button"
              id="chat-send-btn"
              className="btn btn-primary"
              onClick={handleSend}
              disabled={sending || !inputContent.trim()}
              style={{ borderRadius: '20px', padding: '10px 20px', height: '40px' }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
