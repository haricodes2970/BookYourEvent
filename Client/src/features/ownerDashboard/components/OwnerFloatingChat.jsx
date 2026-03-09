import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
    getChatMessages,
    getMyChats,
    markChatRead,
    openChatByUsername,
    searchUsersForChat,
    sendChatMessage,
} from '../../../services/chatService';

const formatChatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getOtherUser = (chat, currentUserId) =>
    chat.otherParticipant ||
    chat.participants?.find((participant) => participant?._id?.toString() !== currentUserId) ||
    null;

const Avatar = ({ user, sizeClass = 'h-9 w-9' }) => {
    const initials = user?.name
        ?.split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (user?.avatar) {
        return <img src={user.avatar} alt={user.name || 'User'} className={`${sizeClass} rounded-full object-cover`} />;
    }

    return (
        <span className={`${sizeClass} grid place-items-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]`}>
            {initials || 'US'}
        </span>
    );
};

const OwnerFloatingChat = ({ currentUserId }) => {
    const panelRef = useRef(null);
    const scrollRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState('');
    const [messages, setMessages] = useState([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const activeChat = useMemo(
        () => chats.find((chat) => chat._id === activeChatId) || null,
        [activeChatId, chats]
    );

    const activeChatOtherUser = useMemo(
        () => (activeChat ? getOtherUser(activeChat, currentUserId) : null),
        [activeChat, currentUserId]
    );

    useEffect(() => {
        if (!panelRef.current) return;

        if (open) {
            gsap.set(panelRef.current, { display: 'grid' });
            gsap.fromTo(
                panelRef.current,
                { y: 24, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' }
            );
            return;
        }

        gsap.to(panelRef.current, {
            y: 24,
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in',
            onComplete: () => {
                gsap.set(panelRef.current, { display: 'none' });
            },
        });
    }, [open]);

    const loadChats = async (silent = false) => {
        if (!silent) setLoadingChats(true);
        try {
            const data = await getMyChats();
            const nextChats = Array.isArray(data?.chats) ? data.chats : [];
            setChats(nextChats);

            setActiveChatId((current) => {
                if (current && nextChats.some((chat) => chat._id === current)) return current;
                return nextChats[0]?._id || '';
            });
        } catch (err) {
            if (!silent) {
                setError(err.response?.data?.message || 'Failed to load chats');
            }
        } finally {
            if (!silent) setLoadingChats(false);
        }
    };

    const loadMessages = async (chatId, silent = false) => {
        if (!chatId) return;
        if (!silent) setLoadingMessages(true);
        try {
            const data = await getChatMessages(chatId);
            setMessages(Array.isArray(data?.messages) ? data.messages : []);
            await markChatRead(chatId).catch(() => {});
        } catch (err) {
            if (!silent) {
                setError(err.response?.data?.message || 'Failed to load messages');
            }
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        void loadChats();
    }, [open]);

    useEffect(() => {
        if (!open || !activeChatId) return;
        void loadMessages(activeChatId);
    }, [activeChatId, open]);

    useEffect(() => {
        if (!open) return;

        const pollId = setInterval(() => {
            void loadChats(true);
            if (activeChatId) {
                void loadMessages(activeChatId, true);
            }
        }, 5000);

        return () => clearInterval(pollId);
    }, [activeChatId, open]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSearch = async () => {
        const query = searchInput.trim().replace(/^@+/, '');
        if (!query) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        setError('');

        try {
            const data = await searchUsersForChat(query);
            setSearchResults(Array.isArray(data?.users) ? data.users : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to search users');
        } finally {
            setSearching(false);
        }
    };

    const startChatWithUser = async (user) => {
        try {
            setError('');
            const data = await openChatByUsername(user.username);
            const chat = data?.chat;

            if (!chat?._id) return;

            await loadChats(true);
            setActiveChatId(chat._id);
            setSearchInput(`@${user.username}`);
            setSearchResults([]);
            await loadMessages(chat._id);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to open chat');
        }
    };

    const handleSend = async () => {
        if (!activeChatId || !draft.trim() || sending) return;

        setSending(true);
        setError('');

        try {
            await sendChatMessage(activeChatId, draft.trim());
            setDraft('');
            await loadMessages(activeChatId, true);
            await loadChats(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="fixed bottom-6 right-6 z-[95] grid h-14 w-14 place-items-center rounded-full bg-[var(--primary)] text-white shadow-[0_16px_30px_rgba(8,28,21,0.35)] transition hover:bg-[var(--secondary)]"
                aria-label="Toggle chat"
            >
                {open ? '×' : '💬'}
            </button>

            <section
                ref={panelRef}
                className="fixed bottom-24 right-4 z-[94] hidden h-[72vh] w-[min(94vw,760px)] max-h-[690px] grid-cols-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_80px_rgba(8,28,21,0.28)] md:grid-cols-[260px_1fr]"
            >
                <aside className="border-b border-[var(--border)] bg-[var(--surface-soft)] p-4 md:border-b-0 md:border-r">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Owner Chat
                    </p>
                    <div className="mt-3 flex gap-2">
                        <input
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    void handleSearch();
                                }
                            }}
                            placeholder="Search @username"
                            className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                        />
                        <button
                            type="button"
                            onClick={() => void handleSearch()}
                            className="rounded-xl bg-[var(--primary)] px-3 text-sm font-semibold text-white"
                        >
                            {searching ? '...' : 'Go'}
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            {searchResults.map((result) => (
                                <button
                                    type="button"
                                    key={result._id}
                                    onClick={() => void startChatWithUser(result)}
                                    className="flex w-full items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-left text-sm text-[var(--text)] last:border-b-0 hover:bg-[var(--surface-soft)]"
                                >
                                    <Avatar user={result} sizeClass="h-7 w-7" />
                                    <span className="truncate">
                                        @{result.username} • {result.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 h-[calc(100%-7.2rem)] overflow-y-auto pr-1">
                        {loadingChats ? (
                            <p className="text-sm text-[var(--muted)]">Loading chats...</p>
                        ) : chats.length === 0 ? (
                            <p className="text-sm text-[var(--muted)]">No chats yet.</p>
                        ) : (
                            <div className="space-y-1">
                                {chats.map((chat) => {
                                    const otherUser = getOtherUser(chat, currentUserId);
                                    const isActive = chat._id === activeChatId;
                                    return (
                                        <button
                                            type="button"
                                            key={chat._id}
                                            onClick={() => setActiveChatId(chat._id)}
                                            className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition ${
                                                isActive ? 'bg-[var(--primary)]/12' : 'hover:bg-[var(--surface)]'
                                            }`}
                                        >
                                            <Avatar user={otherUser} sizeClass="h-8 w-8" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-[var(--text)]">
                                                    {otherUser?.name || 'User'}
                                                </span>
                                                <span className="block truncate text-xs text-[var(--muted)]">
                                                    {chat.lastMessage || 'Start chatting'}
                                                </span>
                                            </span>
                                            <span className="text-[10px] text-[var(--muted)]">
                                                {formatChatTime(chat.lastMessageAt)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                <main className="flex h-full flex-col">
                    <header className="border-b border-[var(--border)] px-4 py-3">
                        <p className="font-['Outfit'] text-lg font-semibold text-[var(--text)]">
                            {activeChatOtherUser?.name || 'Select a conversation'}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                            {activeChatOtherUser?.username ? `@${activeChatOtherUser.username}` : 'General messaging'}
                        </p>
                    </header>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[var(--surface-soft)]/50 px-4 py-4">
                        {loadingMessages ? (
                            <p className="text-sm text-[var(--muted)]">Loading messages...</p>
                        ) : !activeChatId ? (
                            <p className="text-sm text-[var(--muted)]">Choose a chat from the left panel.</p>
                        ) : messages.length === 0 ? (
                            <p className="text-sm text-[var(--muted)]">No messages yet. Say hello.</p>
                        ) : (
                            <div className="space-y-2">
                                {messages.map((message) => {
                                    const senderId = (message.sender?._id || message.sender || '').toString();
                                    const mine = senderId === currentUserId;
                                    return (
                                        <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                                    mine
                                                        ? 'bg-[var(--primary)] text-white'
                                                        : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]'
                                                }`}
                                            >
                                                {!mine && (
                                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                                        @{message.sender?.username || 'user'}
                                                    </p>
                                                )}
                                                <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                                                <p className={`mt-1 text-right text-[10px] ${mine ? 'text-white/80' : 'text-[var(--muted)]'}`}>
                                                    {formatChatTime(message.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <footer className="border-t border-[var(--border)] bg-[var(--surface)] p-3">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
                        <div className="flex gap-2">
                            <input
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                placeholder="Type message..."
                                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
                            />
                            <button
                                type="button"
                                onClick={() => void handleSend()}
                                disabled={!draft.trim() || !activeChatId || sending}
                                className="rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {sending ? '...' : 'Send'}
                            </button>
                        </div>
                    </footer>
                </main>
            </section>
        </>
    );
};

export default OwnerFloatingChat;
