import React, { useState, useEffect, useRef } from 'react';
import { DailyProgress, ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';
import { Sparkles, Send, Trash2, MessageCircle, Minimize2, Maximize2 } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

interface Props {
  progress: DailyProgress;
}

const GeminiMentor: React.FC<Props> = ({ progress }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const savedChat = localStorage.getItem('geminiChatHistory');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
  }, []);

  // Save chat history whenever it changes
  useEffect(() => {
    localStorage.setItem('geminiChatHistory', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput("");
    
    // Add User Message
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Initialize chat with current history and NEWEST progress context
      const chat = createChatSession(messages, progress);
      
      const resultStream = await chat.sendMessageStream({ message: userText });
      
      let fullResponseText = "";
      const modelMsgId = (Date.now() + 1).toString();

      // Create a placeholder for the model response
      setMessages(prev => [
        ...prev, 
        { id: modelMsgId, role: 'model', text: "", timestamp: Date.now() }
      ]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullResponseText += text;
          // Update the last message (model's) with the accumulated text
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: fullResponseText } : msg
          ));
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "عذراً يا صديقي، حدثت مشكلة في الاتصال. هل يمكنك إعادة المحاولة؟", 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    if (confirm("هل أنت متأكد من مسح محادثتك مع المرشد؟")) {
      setMessages([]);
      localStorage.removeItem('geminiChatHistory');
    }
  };

  // --- Collapsed State (Mini Widget) ---
  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-lg mb-6 cursor-pointer transform transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between text-white"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">المرشد الأمين</h3>
            <p className="text-indigo-100 text-xs">اضغط للتحدث معي</p>
          </div>
        </div>
        <MessageCircle className="w-6 h-6 animate-bounce-small" />
      </div>
    );
  }

  // --- Expanded State (Full Chat) ---
  return (
    <div className="bg-white border border-indigo-100 rounded-2xl shadow-xl mb-6 flex flex-col h-[500px] overflow-hidden animate-fade-in relative">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <h3 className="font-bold">المرشد الأمين</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={clearChat} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="مسح المحادثة">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="تصغير">
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <Sparkles className="w-12 h-12 mx-auto mb-2 text-indigo-200" />
            <p className="text-sm">أهلاً بك يا بطل! 👋<br/>أنا هنا لمساعدتك والحديث معك.<br/>كيف كان يومك الدراسي اليوم؟</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-white text-gray-800 rounded-tr-none border border-gray-200' 
                  : 'bg-indigo-600 text-white rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-end">
             <div className="bg-indigo-600/10 text-indigo-600 rounded-2xl rounded-tl-none p-3 px-4 flex gap-1 items-center">
                <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-150"></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          disabled={isTyping}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isTyping}
          className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5 rtl:rotate-180" />
        </button>
      </form>
    </div>
  );
};

export default GeminiMentor;
