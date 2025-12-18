
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Cloud, Send, Loader2, Sparkles, Database, Shield, Layout, 
  Settings, Menu, X, CheckCircle2, BookOpen, Layers, Terminal,
  RefreshCw, Globe, Server, Cpu, Activity, Sun, Moon, Eye, Search, User
} from 'lucide-react';
import { cloudTutor } from './services/geminiService';
import { Message } from './types';
import MarkdownRenderer from './components/MarkdownRenderer';

type Theme = 'neon' | 'light' | 'high-contrast';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCloud, setSelectedCloud] = useState<'Multi' | 'AWS' | 'Azure' | 'GCP'>('Multi');
  const [theme, setTheme] = useState<Theme>('neon');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const getPhase = () => {
    if (messages.length <= 1) return 'Onboarding';
    if (messages.length <= 4) return 'Discovery';
    if (messages.some(m => m.text.toLowerCase().includes('path'))) return 'Path Selected';
    return 'Learning';
  };

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const playClickSound = () => {
    try {
      if (!audioContext.current) audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();
      osc.connect(gain);
      gain.connect(audioContext.current.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioContext.current.currentTime);
      gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);
      osc.start();
      osc.stop(audioContext.current.currentTime + 0.1);
    } catch (e) {}
  };

  // Fix: Added resetSession to clear the current chat state and allow the user to start over.
  const resetSession = () => {
    setMessages([]);
    setHasStarted(false);
    setInputValue('');
    setIsLoading(false);
    setIsSidebarOpen(false);
    setSearchQuery('');
  };

  const handleStart = async (initialPrompt?: string) => {
    playClickSound();
    setHasStarted(true);
    setIsLoading(true);
    try {
      const response = await cloudTutor.startChat();
      const tutorGreeting: Message = {
        role: 'model',
        text: response,
        timestamp: new Date()
      };
      setMessages([tutorGreeting]);
      if (initialPrompt) await handleSendMessage(initialPrompt, [tutorGreeting]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text?: string, currentMessages?: Message[]) => {
    const content = text || inputValue;
    if (!content.trim() || (isLoading && !text)) return;
    playClickSound();

    const userMessage: Message = {
      role: 'user',
      text: content,
      timestamp: new Date()
    };

    const updatedMessages = [...(currentMessages || messages), userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      let fullResponse = '';
      const responsePlaceholder: Message = { role: 'model', text: '', timestamp: new Date() };
      setMessages([...updatedMessages, responsePlaceholder]);
      
      const prompt = selectedCloud !== 'Multi' 
        ? `[Context: Focus specifically on ${selectedCloud} implementations] ${content}` 
        : content;

      await cloudTutor.sendMessageStream(prompt, (chunk) => {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      });
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Error encountered. Verify connection or API key.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const features = useMemo(() => [
    { icon: Layers, title: "Pattern Focused", desc: "WhatsApp, Netflix, and Uber architectures.", prompt: "I want to learn about architectures for big apps like WhatsApp, Netflix, and Uber." },
    { icon: Globe, title: "Multi-Cloud", desc: "Native mappings for AWS, GCP, and Azure.", prompt: "Help me understand how services map across AWS, GCP, and Azure." },
    { icon: Activity, title: "MLOps Lifecycle", desc: "Automate machine learning pipelines and serving.", prompt: "Tell me about MLOps pipelines and serving patterns." },
    { icon: Terminal, title: "Hands-on Labs", desc: "Conceptual labs using open public datasets.", prompt: "I'm interested in hands-on labs with sample data." }
  ], []);

  const searchSuggestions = useMemo(() => [
    "AWS Lambda vs GCP Functions", "S3 Storage Classes", "Cloud Migration 7R Strategy", "Kubernetes Multi-Cloud Deployment", "SageMaker Training Pipelines"
  ].filter(s => s.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);

  const lastModelMessage = messages.filter(m => m.role === 'model').pop()?.text || '';
  const pathOptions = lastModelMessage.match(/(?:\*\*)?Path [A-E]:[^*|\n]*/g) || [];

  if (!hasStarted) {
    return (
      <main id="main-content" className="flex flex-col items-center justify-center min-h-screen px-4 relative overflow-hidden art-bg">
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setTheme('light')} aria-label="Light Mode" className="p-2 rounded-full border border-slate-700 hover:bg-slate-800"><Sun size={20}/></button>
          <button onClick={() => setTheme('neon')} aria-label="Neon Mode" className="p-2 rounded-full border border-slate-700 hover:bg-slate-800"><Moon size={20}/></button>
          <button onClick={() => setTheme('high-contrast')} aria-label="High Contrast Mode" className="p-2 rounded-full border border-slate-700 hover:bg-slate-800"><Eye size={20}/></button>
        </div>

        <section className="text-center max-w-4xl z-10 animate-fade-in py-12">
          <header>
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-bold mb-8 uppercase tracking-widest">
              <Sparkles size={14} /> Author: BalajiDuddukuri
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter bg-gradient-to-br from-white via-cyan-200 to-slate-500 bg-clip-text text-transparent drop-shadow-2xl">
              CloudStratus <span className="underline decoration-cyan-500 decoration-wavy">Tutor</span>
            </h1>
          </header>

          <p className="text-xl text-slate-400 mb-12 leading-relaxed font-light max-w-2xl mx-auto">
            A WCAG-compliant interactive platform for mastering system design and multi-cloud strategies.
          </p>

          <div className="relative max-w-xl mx-auto mb-12">
            <div className="flex items-center bg-slate-900/80 border border-slate-700 rounded-2xl p-2 focus-within:border-cyan-500 transition-all">
              <Search className="ml-3 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Search topics (e.g. Serverless, MLOps...)" 
                className="w-full bg-transparent border-none outline-none px-4 py-3 text-white"
                value={searchQuery}
                onChange={(e) => {setSearchQuery(e.target.value); setShowSearchSuggestions(true);}}
                onFocus={() => setShowSearchSuggestions(true)}
              />
              <button onClick={() => handleStart(searchQuery)} className="bg-cyan-600 px-6 py-3 rounded-xl font-bold hover:bg-cyan-500 transition-all">Search</button>
            </div>
            {showSearchSuggestions && searchQuery && searchSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-slate-900 border border-slate-700 rounded-xl mt-2 overflow-hidden shadow-2xl z-20">
                {searchSuggestions.map(s => (
                  <li key={s}>
                    <button 
                      onClick={() => handleStart(s)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800 text-slate-300 text-sm border-b border-slate-800 last:border-none"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleStart()}
              className="w-full sm:w-auto neon-glow group flex items-center justify-center gap-3 bg-cyan-600 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all active:scale-95"
            >
              Start Learning Journey
              <BookOpen size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl w-full" aria-label="Learning Areas">
          {features.map((item, i) => (
            <button 
              key={i} 
              onClick={() => handleStart(item.prompt)}
              className="nft-card p-8 rounded-3xl text-left flex flex-col items-start group"
              aria-label={`Learn more about ${item.title}`}
            >
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 mb-6 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                <item.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 underline decoration-cyan-500/20 underline-offset-8 group-hover:decoration-cyan-500 transition-all">{item.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
            </button>
          ))}
        </section>

        <footer className="mt-24 pb-8 text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
          Designed for Excellence • Author: <span className="text-slate-400">BalajiDuddukuri</span>
        </footer>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
      {/* Sidebar Navigation */}
      <nav 
        id="sidebar"
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main Navigation"
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-600 rounded-lg text-white shadow-lg shadow-cyan-500/20">
                <Cloud size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight">CloudStratus</span>
            </div>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar"><X size={20}/></button>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto pr-2">
            <div>
              <h4 className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-widest">Theme Options</h4>
              <div className="flex gap-2">
                {[
                  { id: 'neon', icon: Moon },
                  { id: 'light', icon: Sun },
                  { id: 'high-contrast', icon: Eye }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`flex-1 p-2 rounded-lg border transition-all ${theme === t.id ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
                    aria-label={`Switch to ${t.id} theme`}
                  >
                    <t.icon size={16} className="mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-widest">Preferred Provider</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Multi', 'AWS', 'Azure', 'GCP'].map(cloud => (
                  <button
                    key={cloud}
                    onClick={() => setSelectedCloud(cloud as any)}
                    className={`py-2 px-3 rounded-xl text-[10px] font-bold transition-all border ${selectedCloud === cloud ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                  >
                    {cloud}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-[10px] uppercase font-black text-slate-500 mb-4 tracking-widest">Modules</h4>
              {[
                { icon: BookOpen, label: 'Cloud Fundamentals' },
                { icon: Server, label: 'Migration Workflow' },
                { icon: Activity, label: 'MLOps Lifecycle' },
                { icon: Layers, label: 'System Design' }
              ].map(item => (
                <button 
                  key={item.label}
                  onClick={() => handleSendMessage(`Explain ${item.label} in depth.`)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-cyan-400 rounded-xl transition-all group"
                >
                  <item.icon size={18} className="text-slate-600 group-hover:text-cyan-500" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <button onClick={resetSession} className="w-full flex items-center gap-3 p-3 text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-all"><RefreshCw size={16}/> Reset Session</button>
            <div className="mt-4 flex items-center gap-2 px-3 opacity-50">
              <User size={14} />
              <span className="text-[10px] font-bold tracking-widest">BALAJIDUDDUKURI</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex flex-col min-w-0 bg-slate-950/20" role="main">
        <header className="h-16 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <button className="lg:hidden p-2 text-slate-400" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu"><Menu size={20}/></button>
             <div>
               <h2 className="font-bold text-sm tracking-tight">Active Learning Session</h2>
               <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Phase: {getPhase()}</span>
               </div>
             </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8" role="log" aria-live="polite">
          <div className="max-w-4xl mx-auto space-y-10">
            {messages.map((msg, idx) => (
              <article 
                key={idx} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                aria-label={`${msg.role === 'user' ? 'Your message' : 'Tutor message'}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-900 border-slate-800 text-cyan-500'}`}>
                  {msg.role === 'user' ? <User size={20}/> : <Cpu size={20}/>}
                </div>
                <div className={`max-w-[85%] rounded-3xl p-6 lg:p-8 ${msg.role === 'user' ? 'bg-cyan-600/10 border border-cyan-500/20 text-white rounded-tr-none' : 'bg-slate-900/50 border border-slate-800 text-slate-200 rounded-tl-none shadow-xl'}`}>
                  <MarkdownRenderer content={msg.text} />
                  <footer className="mt-4 pt-4 border-t border-slate-800/50 text-[10px] text-slate-500 font-bold uppercase tracking-widest flex justify-between">
                    <span>{msg.role === 'model' ? 'CloudStratus Tutor' : 'Student'}</span>
                    <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </footer>
                </div>
              </article>
            ))}
            
            {!isLoading && pathOptions.length > 0 && (
              <nav className="flex flex-wrap gap-2 ml-14" aria-label="Learning path options">
                {pathOptions.map((option, i) => {
                  const label = option.replace(/\*\*/g, '').split(':')[0].trim();
                  return (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(label)}
                      className="bg-slate-900 border border-slate-800 text-cyan-500 hover:bg-cyan-600 hover:text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
            )}
            
            {isLoading && !messages[messages.length - 1]?.text && (
              <div className="flex gap-4 ml-14 animate-pulse">
                <div className="bg-slate-900 h-24 w-3/4 rounded-3xl border border-slate-800"></div>
              </div>
            )}
          </div>
        </div>

        <footer className="p-6 bg-slate-950 border-t border-slate-800">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="max-w-4xl mx-auto relative"
          >
            <label htmlFor="user-input" className="sr-only">Type your message</label>
            <input
              id="user-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Explain Lambda triggers or MLOps pipelines..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-cyan-600 text-white rounded-xl flex items-center justify-center hover:bg-cyan-500 disabled:bg-slate-800 transition-all active:scale-95"
              aria-label="Send message"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-6 mt-4 opacity-30 text-[9px] font-black uppercase tracking-widest">
            <span>WCAG 2.2 Compliant</span>
            <span>BalajiDuddukuri AI implementation</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
