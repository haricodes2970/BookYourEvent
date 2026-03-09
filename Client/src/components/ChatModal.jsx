import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getChatMessages, markChatRead, openChat, sendChatMessage } from '../services/chatService';
import { useLanguage } from '../context/LanguageContext';

const ChatModal = ({ isOpen, onClose, otherUser, bookingId }) => {
    const { t } = useLanguage();

    const currentUserId = useMemo(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            return user?.id || user?._id || null;
        } catch {
            return null;
        }
    }, []);

    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    const bottomRef = useRef(null);

    const fetchMessages = async (id, silent = false) => {
        try {
            const data = await getChatMessages(id);
            setMessages(data.messages || []);
            await markChatRead(id).catch(() => {});
            if (!silent) setError('');
        } catch (err) {
            if (!silent) setError(err.response?.data?.message || t('chat.loadMessagesFailed'));
        }
    };

    useEffect(() => {
        if (!isOpen || !otherUser?.id) return;

        let active = true;

        const init = async () => {
            setLoading(true);
            setError('');
            setMessages([]);
            setChatId(null);
            try {
                const data = await openChat({ otherUserId: otherUser.id, bookingId });
                if (!active) return;
                const id = data.chat?._id;
                setChatId(id);
                if (id) await fetchMessages(id);
            } catch (err) {
                if (!active) return;
                setError(err.response?.data?.message || t('chat.openFailed'));
            } finally {
                if (active) setLoading(false);
            }
        };

        init();

        return () => {
            active = false;
        };
    }, [isOpen, otherUser?.id, bookingId]);

    useEffect(() => {
        if (!isOpen || !chatId) return;

        const interval = setInterval(() => {
            fetchMessages(chatId, true);
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen, chatId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!chatId || !text.trim() || sending) return;

        setSending(true);
        setError('');
        try {
            const data = await sendChatMessage(chatId, text.trim());
            setMessages((prev) => [...prev, data.message]);
            setText('');
            await markChatRead(chatId).catch(() => {});
        } catch (err) {
            setError(err.response?.data?.message || t('chat.sendFailed'));
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    const fallbackUserName = otherUser?.name || t('chat.userFallback');
    const title = t('chat.titleWithName', { name: fallbackUserName });

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 1100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                }}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: 560,
                        height: '80vh',
                        maxHeight: 700,
                        background: '#ffffff',
                        borderRadius: 16,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f8fafc',
                    }}>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
                                {title}
                            </p>
                            <p style={{ fontSize: 11, color: '#64748b' }}>
                                {t('chat.bookingSupport')}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label={t('common.close')}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#64748b',
                                fontSize: 18,
                                cursor: 'pointer',
                                lineHeight: 1,
                            }}
                        >
                            x
                        </button>
                    </div>

                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 14,
                        background: 'linear-gradient(180deg,#f8fafc 0%, #ffffff 100%)',
                    }}>
                        {loading ? (
                            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 20 }}>
                                {t('chat.loading')}
                            </p>
                        ) : messages.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>
                                {t('chat.noMessages')}
                            </p>
                        ) : (
                            messages.map((msg) => {
                                const senderId = (msg.sender?._id || msg.sender || '').toString();
                                const mine = currentUserId && senderId === currentUserId;

                                return (
                                    <div
                                        key={msg._id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: mine ? 'flex-end' : 'flex-start',
                                            marginBottom: 10,
                                        }}
                                    >
                                        <div style={{
                                            maxWidth: '78%',
                                            padding: '9px 12px',
                                            borderRadius: 12,
                                            background: mine
                                                ? 'linear-gradient(135deg,#1e4d5c,#2D8A84)'
                                                : '#ffffff',
                                            color: mine ? '#ffffff' : '#1f2937',
                                            border: mine ? 'none' : '1px solid #e2e8f0',
                                            boxShadow: mine
                                                ? '0 6px 14px rgba(30,77,92,0.22)'
                                                : '0 2px 8px rgba(0,0,0,0.04)',
                                        }}>
                                            {!mine && (
                                                <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 3, color: '#475569' }}>
                                                    {msg.sender?.name || fallbackUserName}
                                                </p>
                                            )}
                                            <p style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                {msg.text}
                                            </p>
                                            <p style={{
                                                marginTop: 4,
                                                fontSize: 10,
                                                opacity: mine ? 0.85 : 0.6,
                                                textAlign: 'right',
                                            }}>
                                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        <div ref={bottomRef} />
                    </div>

                    <div style={{
                        borderTop: '1px solid #e5e7eb',
                        padding: 10,
                        background: '#ffffff',
                    }}>
                        {error && (
                            <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>{error}</p>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={t('chat.typePlaceholder')}
                                style={{
                                    flex: 1,
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 10,
                                    padding: '10px 12px',
                                    fontSize: 13,
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !text.trim()}
                                style={{
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '10px 16px',
                                    background: sending || !text.trim()
                                        ? '#94a3b8'
                                        : 'linear-gradient(135deg,#1e4d5c,#2D8A84)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {sending ? t('chat.sending') : t('chat.send')}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatModal;
