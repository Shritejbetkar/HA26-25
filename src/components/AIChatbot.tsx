import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Hammer, Bot, User } from 'lucide-react';
import { getChatResponse, searchJobsWithAI } from '../services/aiService';
import { Link } from 'react-router-dom';

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, jobs?: any[] }[]>([
    { role: 'model', text: 'Namaste! I am Daksh-AI. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim().toLowerCase();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Check if user is searching for jobs
      if (userMsg.includes('find') || userMsg.includes('job') || userMsg.includes('work') || userMsg.includes('search')) {
        const aiSearchResult = await searchJobsWithAI(userMsg);
        setIsTyping(false);
        
        if (aiSearchResult.jobs && aiSearchResult.jobs.length > 0) {
          const jobText = aiSearchResult.ai_active 
            ? `I found ${aiSearchResult.jobs.length} jobs matching your request:`
            : `I found ${aiSearchResult.jobs.length} jobs for you (Demo Mode):`;
            
          setMessages(prev => [...prev, { 
            role: 'model', 
            text: jobText,
            jobs: aiSearchResult.jobs
          }]);
        } else {
          setMessages(prev => [...prev, { 
            role: 'model', 
            text: "I couldn't find any jobs matching those criteria in our database yet. Try searching for different skills or locations!" 
          }]);
        }
      } else {
        // Regular chat
        const history = messages.map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }));

        const response = await getChatResponse(userMsg, history as any);
        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't process that." }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having a bit of trouble right now. Please try again later!" }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="glass w-[350px] sm:w-[400px] h-[600px] rounded-3xl border-primary/30 shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold leading-none">Daksh-AI</h4>
                  <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Online Assistant</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                  {m.jobs && (
                    <div className="mt-2 space-y-2 w-full max-w-[90%]">
                      {m.jobs.map((job: any) => (
                        <Link 
                          to={`/jobs`} 
                          key={job.id}
                          className="block p-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/50 transition-all group"
                        >
                          <div className="flex justify-between items-start">
                            <h5 className="text-white font-bold text-xs truncate group-hover:text-primary">{job.title}</h5>
                            <span className="text-accent font-bold text-[10px]">₹{job.wage}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{job.city || job.district}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/10">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. Find plumber jobs in Mumbai..."
                  className="flex-grow bg-card border border-border rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  className="bg-primary p-2 rounded-xl text-white hover:scale-105 transition-transform"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary p-4 rounded-2xl shadow-2xl text-white flex items-center justify-center"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>
    </div>
  );
};

export default AIChatbot;
