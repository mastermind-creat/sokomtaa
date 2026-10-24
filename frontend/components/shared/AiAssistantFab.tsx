'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrainCircuit, X, Send, Loader2, MessagesSquare, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Web Speech API — use (window as any) to safely access prefixed API across browsers

// ── Custom Markdown renderer ──────────────────────────────────────────────────
function AiMessageRenderer({ text }: { text: string }) {
  const lines = text.split('\n');

  const parseInline = (line: string, key: number) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return (
      <span key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-green-900">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i} className="italic">{part.slice(1, -1)}</em>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      elements.push(<div key={`gap-${i}`} className="h-1" />);
    } else if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#{1,3})/)?.[1].length ?? 1;
      const content = line.replace(/^#{1,3}\s/, '');
      const cls = level === 1 ? 'text-sm font-black text-green-900 mt-1'
        : level === 2 ? 'text-xs font-black text-green-800 uppercase tracking-wide mt-1'
          : 'text-xs font-bold text-green-700 mt-1';
      elements.push(<p key={i} className={cls}>{parseInline(content, i)}</p>);
    } else if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 mt-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[13px] leading-relaxed">
              <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span>{parseInline(item, idx)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1 mt-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[13px] leading-relaxed">
              <span className="font-black text-green-600 text-[11px] mt-0.5 shrink-0 w-4">{idx + 1}.</span>
              <span>{parseInline(item, idx)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (/^---+$/.test(line)) {
      elements.push(<hr key={i} className="border-gray-200 my-2" />);
    } else {
      elements.push(
        <p key={i} className="text-[13px] leading-relaxed text-green-950">
          {parseInline(line, i)}
        </p>
      );
    }
    i++;
  }
  return <div className="space-y-1">{elements}</div>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AiAssistantFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Voice state
  const [voiceMode, setVoiceMode] = useState(false); // Full-screen voice UI
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);

  const { user, token } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Speech Support Detection ──────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR && window.speechSynthesis) {
      setSpeechSupported(true);
    }
  }, []);

  // ── TTS: Speak AI response ────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // cancel any ongoing speech
    // Strip markdown for cleaner speech
    const clean = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{1,3}\s/g, '')
      .replace(/^[-*]\s/gm, '')
      .replace(/^\d+\.\s/gm, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'en-KE'; // Kenyan English if available
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // ── STT: Start listening ──────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Stop any ongoing speech before listening
    window.speechSynthesis.cancel();

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = 'en-KE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceMode(true); // Enter voice mode when listening starts
    };

    recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      sendMessage(transcript); // Auto-send
    };

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast.error('Could not hear you. Please try again.');
        setVoiceMode(false);
      }
    };

    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
    } catch (e) {
      // Ignore start errors if already started
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleVoiceMode = () => {
    if (voiceMode) {
      setVoiceMode(false);
      stopListening();
      window.speechSynthesis.cancel();
    } else {
      startListening();
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) window.speechSynthesis.cancel();
    setVoiceEnabled(v => !v);
  };

  // ── Scroll & Tooltip ──────────────────────────────────────────────────────
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && messages.length === 0) setShowTooltip(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, messages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];

    setInput('');
    setMessages(updatedMessages);
    setIsLoading(true);

    // Get browser geolocation for accurate nearby search
    let browserLocation: { lat: number; lng: number } | null = null;
    try {
      if (navigator.geolocation) {
        browserLocation = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 4000, maximumAge: 300000 }
          );
        });
      }
    } catch {
      // location unavailable — backend will fall back to profile location
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          token: token ?? null,
          role: user?.role,
          location: browserLocation,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error || 'Request failed');

      const aiMessage: ChatMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, aiMessage]);

      // Speak the response if voice is enabled or we are in voice mode
      if (voiceEnabled || voiceMode) {
        speak(data.response);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Soko AI is currently offline.';
      toast.error(msg);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Pole sana! I am having some technical difficulties. Please try again shortly.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Spinning FAB */}
      <div className="fixed bottom-24 right-4 md:right-6 z-40 flex items-center gap-3">
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-brand-100 flex items-center gap-2 cursor-pointer relative"
              onClick={() => { setShowTooltip(false); setIsOpen(true); }}
            >
              <span className="text-[11px] font-black text-brand-700 uppercase tracking-widest">Need Help?</span>
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setShowTooltip(false); setIsOpen(true); }}
          className="w-12 h-12 md:w-14 md:h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20 backdrop-blur-sm"
          aria-label="Open AI Assistant"
        >
          <BrainCircuit size={24} />
        </motion.button>
      </div>

      {/* Right-side Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full md:w-[400px] h-[100dvh] bg-white shadow-2xl overflow-hidden flex flex-col pointer-events-auto relative z-10 border-l border-gray-100"
            >
              {/* Header */}
              <div className="p-5 bg-brand-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <BrainCircuit size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-widest">Soko AI</h3>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider flex items-center gap-1">
                      {isListening ? (
                        <><span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse inline-block" /> Listening...</>
                      ) : isSpeaking ? (
                        <><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block" /> Speaking...</>
                      ) : isLoading ? (
                        <span className="flex items-center gap-0.5">
                          Typing
                          <span className="inline-flex gap-[3px] ml-0.5">
                            <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                        </span>
                      ) : (
                        <><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> Online</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Voice output toggle */}
                  {speechSupported && (
                    <button
                      onClick={toggleVoice}
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                      aria-label={voiceEnabled ? 'Mute AI voice' : 'Enable AI voice'}
                      title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                    >
                      {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors"
                    aria-label="Close assistant"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-neutral-50/50 relative">
                {/* Voice Mode Overlay */}
                <AnimatePresence>
                  {voiceMode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="absolute inset-0 z-20 bg-brand-900 flex flex-col items-center justify-center p-6 text-center"
                    >
                      <button
                        onClick={toggleVoiceMode}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors"
                      >
                        <X size={20} />
                      </button>

                      <div className="relative mb-8">
                        {/* Ripples */}
                        {(isListening || isSpeaking) && (
                          <>
                            <div className="absolute inset-0 bg-brand-500 rounded-full animate-ping opacity-20" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-[-20px] bg-brand-400 rounded-full animate-ping opacity-10" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                          </>
                        )}

                        {/* Central Avatar */}
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl relative z-10 transition-colors duration-500 ${isListening ? 'bg-red-500' : isSpeaking ? 'bg-amber-500' : 'bg-brand-600'
                          }`}>
                          {isListening ? (
                            <Mic size={50} className="text-white animate-pulse" />
                          ) : isSpeaking ? (
                            <Volume2 size={50} className="text-white animate-bounce" />
                          ) : isLoading ? (
                            <BrainCircuit size={50} className="text-white animate-pulse" />
                          ) : (
                            <BrainCircuit size={50} className="text-white" />
                          )}
                        </div>
                      </div>

                      {/* Status Text */}
                      <h2 className="text-2xl font-black text-white tracking-wide mb-2">
                        {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : isLoading ? 'Typing...' : 'Ready'}
                      </h2>

                      <p className="text-brand-200 text-sm font-medium max-w-[250px]">
                        {isListening
                          ? 'Go ahead, I am listening to your request.'
                          : isSpeaking
                            ? 'Listen to the response...'
                            : isLoading
                              ? 'Processing your request...'
                              : 'Tap the microphone to speak.'}
                      </p>

                      {/* Manual Trigger */}
                      {!isListening && !isLoading && !isSpeaking && (
                        <button
                          onClick={startListening}
                          className="mt-12 px-8 py-3 bg-white text-brand-900 rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-transform"
                        >
                          Tap to Speak
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Normal Chat Messages (Hidden when voice mode is active) */}
                <div className={voiceMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}>
                  {messages.length === 0 && (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto">
                        <MessagesSquare size={28} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-green-950">Habari, {user?.name?.split(' ')[0] || 'rafiki'}!</p>
                        <p className="text-xs text-text-secondary font-medium">
                          I can search products, make reservations, and pay via M-Pesa for you.
                          {speechSupported && ' You can also talk to me! 🎤'}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {['Find sukuma wiki', 'Best rated traders', 'Reserve tomatoes for me'].map((tip) => (
                          <button
                            key={tip}
                            onClick={() => setInput(tip)}
                            className="px-3 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-black text-brand-600 uppercase tracking-widest shadow-sm hover:border-brand-500 transition-all"
                          >
                            {tip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                          ? 'bg-brand-600 text-white text-sm font-medium rounded-tr-none'
                          : 'bg-white rounded-tl-none border border-gray-100'
                        }`}>
                        {msg.role === 'assistant'
                          ? <AiMessageRenderer text={msg.content} />
                          : msg.content
                        }
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms', animationDuration: '1s' }}
                        />
                        <span
                          className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
                          style={{ animationDelay: '200ms', animationDuration: '1s' }}
                        />
                        <span
                          className="w-2 h-2 bg-brand-600 rounded-full animate-bounce"
                          style={{ animationDelay: '400ms', animationDuration: '1s' }}
                        />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  {/* Mic button */}
                  {speechSupported && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleVoiceMode}
                      disabled={isLoading}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${voiceMode
                          ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                          : 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                        }`}
                      aria-label={voiceMode ? 'Exit voice mode' : 'Enter voice mode'}
                    >
                      {voiceMode ? <X size={18} /> : <Mic size={18} />}
                    </motion.button>
                  )}

                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isListening ? 'Listening...' : 'Tuma ujumbe hapa...'}
                      disabled={isLoading || isListening}
                      className="w-full h-11 pl-4 pr-12 bg-neutral-50 rounded-xl text-sm font-medium focus:ring-4 focus:ring-brand-500/10 focus:bg-white outline-none transition-all disabled:opacity-60 border border-transparent focus:border-brand-200"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all"
                      aria-label="Send message"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
