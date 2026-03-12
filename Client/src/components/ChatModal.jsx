import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/axiosInstance';

const sameUser = (a, b) => String(a || '') === String(b || '');

export default function ChatModal({ isOpen, otherUser, bookingId, onClose }) {
  const [chatId, setChatId] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.id || user?._id || '';
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !otherUser?.id) {
      return;
    }

    let mounted = true;
    const openAndLoad = async () => {
      setError('');
      setLoading(true);
      try {
        const opened = await api.post('/chats/open', {
          otherUserId: otherUser.id,
          bookingId: bookingId || null,
        });
        if (!mounted) {
          return;
        }
        const id = opened?.data?._id || opened?._id;
        if (!id) {
          throw new Error('Unable to open chat.');
        }
        setChatId(id);

        const res = await api.get(`/chats/${id}/messages`);
        if (!mounted) {
          return;
        }
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setMessages(list);
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || 'Could not open chat.';
        if (mounted) {
          setError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    openAndLoad();
    return () => {
      mounted = false;
      setMessages([]);
      setText('');
      setChatId('');
      setError('');
    };
  }, [isOpen, otherUser?.id, bookingId]);

  useEffect(() => {
    if (!isOpen || !chatId) {
      return;
    }

    let mounted = true;
    const pollMessages = async () => {
      try {
        const res = await api.get(`/chats/${chatId}/messages`);
        if (!mounted) {
          return;
        }
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setMessages(list);
        api.patch(`/chats/${chatId}/read`).catch(() => {});
      } catch {
        // Ignore polling errors to avoid spamming the UI.
      }
    };

    pollMessages();
    const id = setInterval(pollMessages, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isOpen, chatId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const id = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    return () => clearTimeout(id);
  }, [messages, isOpen]);

  const send = async () => {
    const content = text.trim();
    if (!content || !chatId || sending) {
      return;
    }

    setSending(true);
    setError('');
    try {
      const res = await api.post(`/chats/${chatId}/messages`, { text: content });
      const message = res?.data || res;
      setMessages((prev) => [...prev, message]);
      setText('');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to send message.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 18px 48px rgba(0,0,0,0.22)',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>
              {otherUser?.name || 'Chat'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
              {otherUser?.role === 'venueOwner' ? 'Venue Owner' : 'User'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 16,
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            height: 320,
            overflowY: 'auto',
            background: '#f8fafc',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {loading && <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Loading chat...</p>}
          {!loading && messages.length === 0 && (
            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
              No messages yet. Start the conversation.
            </p>
          )}
          {!loading &&
            messages.map((message) => {
              const senderId = message?.sender?._id || message?.sender || '';
              const mine = sameUser(senderId, userId);
              return (
                <div
                  key={message?._id || `${senderId}-${message?.createdAt || Math.random()}`}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    background: mine ? '#1e4d5c' : '#fff',
                    color: mine ? '#fff' : '#0f172a',
                    border: mine ? 'none' : '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {message?.text || ''}
                </div>
              );
            })}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div
            style={{
              padding: '8px 14px',
              background: '#fef2f2',
              borderTop: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            padding: 12,
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: 8,
          }}
        >
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type a message..."
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                send();
              }
            }}
            style={{
              flex: 1,
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              padding: '9px 12px',
              outline: 'none',
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !text.trim() || !chatId}
            style={{
              border: 'none',
              borderRadius: 10,
              background: '#1e4d5c',
              color: '#fff',
              fontWeight: 600,
              padding: '0 16px',
              opacity: sending || !text.trim() || !chatId ? 0.65 : 1,
              cursor: sending || !text.trim() || !chatId ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
