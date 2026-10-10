import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Navigation,
  Loader2,
  Terminal,
  ChevronLeft,
} from 'lucide-react';
import { ChatMessage, User } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AIAgentDrawerProps {
  onClose: () => void;
  onExecuteMapAction: (action: any) => void;
  currentUser: User;
  onOpenAuth: () => void;
  userLocation: { lat: number; lng: number } | null;
  lang: Language;
  isDesktopPanel?: boolean;
  onCollapse?: () => void;
}

export const AIAgentDrawer: React.FC<AIAgentDrawerProps> = ({
  onClose,
  onExecuteMapAction,
  currentUser,
  onOpenAuth,
  userLocation,
  lang,
  isDesktopPanel = false,
  onCollapse,
}) => {
  const t = TRANSLATIONS[lang];
  const { chatHistory, saveChatHistory } = useAuth();

  const defaultWelcomeMessage: ChatMessage = {
    id: 'welcome-01',
    sender: 'agent',
    textTh:
      'สวัสดีครับ! ผมคือ AI ผู้ช่วยภัยพิบัติ FloodSOS GIS ยินดีให้ข้อมูลจุดเสี่ยงน้ำท่วม ค้นหาศูนย์พักพิงปลอดภัย และวางแผนเส้นทางอพยพ 5 จังหวัดภาคเหนือตอนบน (เชียงใหม่, เชียงราย, พะเยา, น่าน, ลำปาง) สอบถามได้ทันทีครับ',
    textEn:
      'Hello! I am the FloodSOS GIS Disaster AI Agent. I can help analyze flood risk zones, find open safe shelters, and plan evacuation routes across the 5 upper-northern provinces. How can I assist you?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (currentUser.role !== 'guest' && chatHistory && chatHistory.length > 0) {
      return chatHistory;
    }
    return [defaultWelcomeMessage];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (currentUser.role !== 'guest') {
      saveChatHistory(messages);
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      textTh: text,
      textEn: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await api.chatWithAgent({
        message: text,
        language: lang,
        userLocation: userLocation || undefined,
      });

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        textTh: response.textTh || response.textEn,
        textEn: response.textEn || response.textTh,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCalls: response.toolCalls,
        mapAction: response.mapAction,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // If response has immediate map action, dispatch it
      if (response.mapAction) {
        onExecuteMapAction(response.mapAction);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          textTh: 'ขออภัย เกิดข้อผิดพลาดในการประมวลผลข้อมูล กรุณาลองใหม่อีกครั้งครับ',
          textEn: 'Apologies, an error occurred while querying the spatial database. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 3 Bottom Sheet States on Phone
  const [sheetState, setSheetState] = useState<'peek' | 'half' | 'full'>('half');

  const cycleSheetState = () => {
    if (sheetState === 'peek') setSheetState('half');
    else if (sheetState === 'half') setSheetState('full');
    else setSheetState('peek');
  };

  const getSheetHeightClass = () => {
    switch (sheetState) {
      case 'peek':
        return 'h-[140px] max-h-[140px]';
      case 'half':
        return 'h-[52dvh] max-h-[52dvh]';
      case 'full':
        return 'h-[calc(100dvh-var(--nav-h)-var(--nav-bump)-env(safe-area-inset-bottom,0px)-16px)] max-h-[calc(100dvh-var(--nav-h)-var(--nav-bump)-env(safe-area-inset-bottom,0px)-16px)]';
    }
  };

  const containerClasses = isDesktopPanel
    ? 'w-full h-full flex flex-col bg-white overflow-hidden select-text'
    : `fixed inset-x-0 bottom-[calc(var(--nav-h)+var(--nav-bump)+env(safe-area-inset-bottom,0px))] md:bottom-[calc(var(--nav-h)+var(--nav-bump)+env(safe-area-inset-bottom,0px))] md:inset-x-auto md:right-3 md:w-[440px] z-40 bg-white shadow-2xl rounded-t-3xl md:rounded-2xl border border-slate-200 flex flex-col md:max-h-[calc(100dvh-var(--nav-h)-var(--nav-bump)-env(safe-area-inset-bottom,0px)-24px)] overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 ${getSheetHeightClass()} md:h-auto`;

  return (
    <div className={containerClasses}>
      {/* Draggable Handle for Mobile Bottom Sheet */}
      {!isDesktopPanel && (
        <button
          onClick={cycleSheetState}
          className="w-full flex flex-col items-center justify-center pt-2 pb-1 shrink-0 md:hidden hover:bg-slate-50 active:bg-slate-100"
          aria-label="Toggle Agent Sheet Height"
        >
          <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors" />
        </button>
      )}

      {/* Header */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 h-14 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div
          className={`flex items-center gap-2.5 ${!isDesktopPanel ? 'cursor-pointer md:cursor-default' : ''}`}
          onClick={!isDesktopPanel ? cycleSheetState : undefined}
        >
          <div className="w-8 h-8 rounded-xl bg-purple-600/60 flex items-center justify-center text-purple-200 shadow-inner">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[15px] sm:text-base font-['Prompt']">
                FloodSOS Agent
              </h3>
              <span className="px-1.5 py-0.5 bg-purple-500/30 text-purple-200 text-[10px] font-mono rounded">
                Gemini
              </span>
            </div>
            <p className="text-[11px] sm:text-[12px] text-purple-200 truncate">
              {lang === 'th' ? 'ผู้ช่วยวิเคราะห์ข้อมูลเชิงพื้นที่และกู้ภัย' : 'Spatial DB & Evacuation Assistant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isDesktopPanel ? (
            <button
              onClick={onCollapse || onClose}
              className="text-purple-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title={lang === 'th' ? 'ยุบแผงด้านข้าง' : 'Collapse Panel'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              title={lang === 'th' ? 'ปิด' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Guest Notice */}
      {currentUser.role === 'guest' && (
        <div className="px-3 py-1.5 bg-purple-50 border-b border-purple-100 flex items-center text-[11px] sm:text-[12px] text-purple-900 shrink-0">
          <span>{t.aiAgent.guestNotice}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="p-3 sm:p-3.5 overflow-y-auto space-y-3 sm:space-y-3.5 flex-1 text-xs sm:text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-2.5 sm:p-3 leading-relaxed whitespace-pre-line shadow-sm text-xs sm:text-sm ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-br-none'
                  : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/70'
              }`}
            >
              {lang === 'th' ? msg.textTh : msg.textEn}

              {/* Tool Execution Badges */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-purple-600" />
                    {t.aiAgent.toolExecuted}
                  </span>
                  {msg.toolCalls.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 bg-white/80 rounded-lg text-[10px] font-mono text-slate-700 border border-slate-200/60"
                    >
                      <span className="text-purple-700 font-bold">{tc.toolName}</span>
                      {tc.resultSnippet && (
                        <p className="text-slate-600 font-sans mt-0.5">{tc.resultSnippet}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button for Map Interaction */}
              {msg.mapAction && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => onExecuteMapAction(msg.mapAction)}
                    className="w-full h-10 min-h-[40px] px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm text-xs sm:text-sm transition-all active:scale-98"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>
                      {msg.mapAction.type === 'show_route'
                        ? 'แสดงเส้นทางอพยพบนแผนที่'
                        : msg.mapAction.type === 'highlight_shelter'
                        ? 'ซูมดูศูนย์พักพิงนี้บนแผนที่'
                        : 'ไฮไลต์พื้นที่เสี่ยงบนแผนที่'}
                    </span>
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 p-2">
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            <span className="text-xs sm:text-sm">{t.aiAgent.thinking}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div className="p-2 sm:p-2.5 bg-slate-50 border-t border-slate-100 overflow-x-auto shrink-0 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 ml-1" />
        {t.aiAgent.suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="shrink-0 text-[11px] sm:text-[12px] font-medium px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 rounded-lg border border-slate-200/80 transition-colors shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box: always fully visible and tappable, with 12px padding below */}
      <div className="px-2.5 pt-2.5 pb-3 sm:px-3 sm:pt-3 sm:pb-3 border-t border-slate-200/80 bg-white flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t.aiAgent.inputPlaceholder}
          disabled={isLoading}
          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 h-10 sm:h-11 min-h-[40px] text-sm sm:text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !inputValue.trim()}
          className="h-10 w-10 sm:h-11 sm:w-11 min-h-[40px] min-w-[40px] bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center shrink-0"
          title={t.aiAgent.send}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
