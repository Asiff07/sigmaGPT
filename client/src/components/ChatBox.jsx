import React, { useEffect, useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import Message from './Message';
import toast from 'react-hot-toast';

function ChatBox() {
  const { selectedChat, theme, user, axios, token, setUser } = useAppContext();

  const containerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [isPublished, setIsPublished] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      return toast.error('Login to send a message');
    }

    if (!prompt.trim()) return;

    setLoading(true);

    const userMessage = {
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    };

    // optimistic UI
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');

    try {
      const { data } = await axios.post(
        `/api/message/${mode}`,
        {
          chatId: selectedChat._id,
          prompt: userMessage.content,
          isPublished,
        },
        {
          headers: { Authorization: token },
        }
      );

      if (!data.success) {
        throw new Error(data.message);
      }

      // add assistant reply
      setMessages((prev) => [...prev, data.reply]);

      // update credits
      setUser((prev) => ({
        ...prev,
        credits: prev.credits - (mode === 'image' ? 2 : 1),
      }));
    } catch (error) {
      // rollback optimistic message
      setMessages((prev) => prev.slice(0, -1));

      if (error.response) {
        if (error.response.status === 429) {
          toast.error(
            error.response.data?.message ||
              'Please slow down. Too many requests.'
          );
        } else {
          toast.error(
            error.response.data?.message || 'Request failed'
          );
        }
      } else {
        toast.error(error.message);
      }

      // restore input
      setPrompt(userMessage.content);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 mb-5 overflow-y-scroll">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <img
              src={theme === 'dark' ? assets.logo_white : assets.logo_dark}
              alt=""
              className="w-full max-w-56 sm:max-w-68"
            />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white">
              Ask Me Anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}

        {loading && (
          <div className="loader flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"></div>
          </div>
        )}
      </div>

      {mode === 'image' && (
        <label className="inline-flex items-center gap-2 mb-3 text-sm mx-auto">
          <p className="text-xs">Publish Generated Image To Community</p>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </label>
      )}

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className="bg-primary/20 dark:bg-[#583c79]/30 border border-primary dark:border-[#80609f]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center"
      >
        <select
          onChange={(e) => setMode(e.target.value)}
          value={mode}
          className="text-sm pl-3 pr-2 outline-none"
        >
          <option value="text">Text</option>
          <option value="image">Image</option>
        </select>

        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 w-full text-sm outline-none"
          type="text"
          placeholder="Type your prompt here..."
          required
          disabled={loading}
        />

        <button disabled={loading}>
          <img
            className="w-8 cursor-pointer"
            src={loading ? assets.pause : assets.send}
            alt=""
          />
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
