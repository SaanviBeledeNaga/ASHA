import React, { useState, useEffect, useRef } from 'react';
import { db, ChatMessage } from '@/lib/db';
import { useAppContext } from '@/lib/AppContext';
import { useLiveQuery } from 'dexie-react-hooks';

export default function ChatInterface() {
  const { isOffline, userProfile, setUserProfile, language } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown bold markers (**text**) for cleaner speech
    const cleanText = text.replace(/\*\*(.*?)\*\*/g, "$1");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtteranceRef.current = utterance; // Prevent garbage collection bug in Chromium

    let langCode = 'en-IN';
    if (language === 'Hindi') langCode = 'hi-IN';
    else if (language === 'Telugu') langCode = 'te-IN';

    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Pre-select matching voice for best regional pronunciation
    const voices = window.speechSynthesis.getVoices();
    let matchingVoice = voices.find(v => v.lang.toLowerCase() === langCode.toLowerCase());
    if (!matchingVoice) {
      matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(langCode.split('-')[0]));
    }
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => {
      setSpeakingMsgId(null);
      activeUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      setSpeakingMsgId(null);
      activeUtteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };
  
  const messages = useLiveQuery(
    () => db.chatMessages.orderBy('timestamp').toArray(),
    []
  );

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: ChatMessage = {
      id: 'u-' + Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toISOString(),
      category: userProfile?.departmentCategory
    };

    await db.chatMessages.add(userMsg);
    setInputText('');
    setIsTyping(true);

    if (isOffline) {
      setTimeout(async () => {
        const botMsg: ChatMessage = {
          id: 'b-' + Date.now().toString(),
          sender: 'bot',
          text: "I am currently offline. I have saved your query and will process it when connection is restored.",
          timestamp: new Date().toISOString(),
          category: userProfile?.departmentCategory
        };
        await db.chatMessages.add(botMsg);
        setIsTyping(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMsg.text,
          category: userProfile?.departmentCategory,
          is_offline: isOffline
        })
      });
      
      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: 'b-' + Date.now().toString(),
        sender: 'bot',
        text: data.reroute ? data.reroute_message : (data.answer || "Sorry, I couldn't understand that."),
        timestamp: new Date().toISOString(),
        category: userProfile?.departmentCategory,
        reroute: data.reroute,
        detectedCategory: data.detected_category
      };
      
      // If there are sources or list items we could parse them here
      if (!data.reroute && data.sources && data.sources.length > 0) {
        botMsg.text += `\n\nSources: ${data.sources.join(', ')}`;
      }

      await db.chatMessages.add(botMsg);
    } catch (error) {
      console.error(error);
      const botMsg: ChatMessage = {
        id: 'b-' + Date.now().toString(),
        sender: 'bot',
        text: "Error communicating with the backend server. Please ensure the backend is running.",
        timestamp: new Date().toISOString(),
        category: userProfile?.departmentCategory
      };
      await db.chatMessages.add(botMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    let langCode = 'en-IN';
    if (language === 'Hindi') langCode = 'hi-IN';
    else if (language === 'Telugu') langCode = 'te-IN';
    
    recognition.lang = langCode;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    try {
      recognition.start();
    } catch (e) {
      console.error("Speech recognition start failed:", e);
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {(!messages || messages.length === 0) && (
          <div className="text-center text-secondary mt-10">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
            <p>Namaste! How can I assist you today?</p>
          </div>
        )}
        
        {messages?.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded max-w-[80%] ${msg.sender === 'user' ? 'bg-[#0F4C81] text-white' : 'card'}`}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              
              {msg.reroute && msg.detectedCategory && (
                <div className="mt-4 p-3 rounded bg-slate-900/80 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white">
                  <div className="text-xs text-cyan-200">
                    Switch workspace to <strong>{msg.detectedCategory}</strong>
                  </div>
                  <button
                    onClick={async () => {
                      if (userProfile && setUserProfile) {
                        setUserProfile({
                          ...userProfile,
                          departmentCategory: msg.detectedCategory!
                        });
                        const confirmMsg: ChatMessage = {
                          id: 'b-' + Date.now().toString(),
                          sender: 'bot',
                          text: `✅ Category switched to **${msg.detectedCategory}**. How can I help you in this department?`,
                          timestamp: new Date().toISOString(),
                          category: msg.detectedCategory
                        };
                        await db.chatMessages.add(confirmMsg);
                      }
                    }}
                    className="py-1 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded transition-all duration-150 whitespace-nowrap cursor-pointer active:scale-95"
                  >
                    Confirm 🔄
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 text-[10px] mt-2 opacity-80">
                {msg.sender === 'bot' ? (
                  <button
                    onClick={() => handleSpeakMessage(msg.id, msg.text)}
                    title={speakingMsgId === msg.id ? "Stop reading" : "Read aloud"}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full border border-current transition-all duration-200 ${
                      speakingMsgId === msg.id
                        ? "bg-cyan-500/20 text-cyan-500 animate-pulse border-cyan-500"
                        : "opacity-60 hover:opacity-100 hover:text-cyan-500 border-zinc-500/30"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6a7.975 7.975 0 015.657 2.343m0 0A7.975 7.975 0 0120 12a7.975 7.975 0 01-2.343 5.657m0 0A7.975 7.975 0 0112 20.25M9.5 12a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm-3.536-3.536A7.975 7.975 0 004 12a7.975 7.975 0 002.343 5.657" />
                    </svg>
                    <span className="text-[9px] font-bold tracking-wide">
                      {speakingMsgId === msg.id ? "STOP" : "SPEAK"}
                    </span>
                  </button>
                ) : (
                  <div></div>
                )}
                <div style={{ fontSize: '0.7rem' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="card p-4 rounded text-secondary italic">
              Generating response...
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-white border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex gap-2 relative container max-w-4xl mx-auto">
          <button 
            onClick={handleVoice}
            className={`p-3 rounded flex items-center justify-center transition-colors ${isListening ? 'bg-[#C62828] text-white animate-pulse' : 'bg-slate-100 text-primary'}`}
            style={{ width: '50px', height: '50px' }}
            title="Voice Input"
          >
            🎙️
          </button>
          <input 
            type="text" 
            className="input-field flex-1" 
            placeholder="Type your question here..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="btn-primary"
            style={{ width: '80px' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
