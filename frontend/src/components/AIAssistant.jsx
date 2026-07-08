import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MessageSquare, X, Send, Bot, Sparkles, User, HeartPulse, RefreshCw } from 'lucide-react';
import axios from 'axios';

const AIAssistant = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Set initial welcome message depending on selected language
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text: language === 'hi' 
            ? 'नमस्ते! मैं निरामयएआई कोपायलट हूँ। मैं जिला स्वास्थ्य केंद्रों की वास्तविक समय की जानकारी, दवाओं के स्टॉक, बिस्तरों की उपलब्धता और डॉक्टरों की उपस्थिति को प्रबंधित करने में आपकी मदद कर सकता हूँ। मुझसे कोई भी प्रश्न पूछें!'
            : 'Hello! I am your NiramayAI Copilot. I can help you monitor health center alerts, medicine stocks, bed availability, and physician attendance logs. Ask me anything about the district status!',
          timestamp: new Date()
        }
      ]);
    }
  }, [language]);

  const handleSend = async (textToSend) => {
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    // Append User Message
    const userMsg = { sender: 'user', text: queryText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Fetch fresh dashboard data to answer queries accurately
      const overviewRes = await axios.get('/analytics/overview');
      const sugRes = await axios.get('/redistribution/suggestions');
      
      const districtData = overviewRes.data;
      const suggestions = sugRes.data.filter(s => s.status === 'PENDING');
      
      let botResponseText = '';
      const queryLower = queryText.toLowerCase();

      // Simple keywords router in English and Hindi
      const isStockQuery = queryLower.includes('stock') || queryLower.includes('medicine') || queryLower.includes('dawa') || queryLower.includes('दवा') || queryLower.includes('स्टॉक') || queryLower.includes('कमी');
      const isDoctorQuery = queryLower.includes('doctor') || queryLower.includes('absent') || queryLower.includes('attendance') || queryLower.includes('डॉक्टर') || queryLower.includes('अनुपस्थित') || queryLower.includes('हाजिरी');
      const isBedQuery = queryLower.includes('bed') || queryLower.includes('occupancy') || queryLower.includes('icu') || queryLower.includes('oxygen') || queryLower.includes('बेड') || queryLower.includes('बिस्तर') || queryLower.includes('अस्पताल');
      const isRedistributeQuery = queryLower.includes('redistribut') || queryLower.includes('transfer') || queryLower.includes('re-route') || queryLower.includes('स्थानांतरण') || queryLower.includes('बदलाव');

      if (isStockQuery) {
        // Compile low stock warnings
        const flaggedStock = districtData.flaggedCenters?.filter(c => c.reasons.some(r => r.includes('stock') || r.includes('depletion')));
        if (flaggedStock && flaggedStock.length > 0) {
          if (language === 'hi') {
            botResponseText = `⚠️ **स्टॉक चेतावनी:** कुल ${districtData.totalStockOuts || 0} दवाइयां गंभीर स्तर पर हैं।\nनिम्नलिखित केंद्रों में स्टॉक की कमी है:\n` +
              flaggedStock.map(c => `- **${c.name}**: ${c.reasons.filter(r => r.includes('stock') || r.includes('depletion')).join(', ')}`).join('\n') +
              `\n\nबचाव के लिए आप 'रेडिस्ट्रीब्यूशन' (Redistribution) टैब में जाकर अतिरिक्त दवाओं का ट्रांसफर कर सकते हैं।`;
          } else {
            botResponseText = `⚠️ **Critical Stock Alerts:** A total of ${districtData.totalStockOuts || 0} items are currently facing depletion.\nCenters with stock issues:\n` +
              flaggedStock.map(c => `- **${c.name}**: ${c.reasons.filter(r => r.includes('stock') || r.includes('depletion')).join(', ')}`).join('\n') +
              `\n\nYou can re-allocate surpluses using the 'Redistribution' suggestions tab to avoid outages.`;
          }
        } else {
          botResponseText = language === 'hi'
            ? `✅ जिला स्वास्थ्य केंद्रों में सभी आवश्यक दवाइयां पर्याप्त मात्रा में उपलब्ध हैं। वर्तमान में कोई नया स्टॉक-आउट खतरा नहीं है।`
            : `✅ All essential medicines across district centers are in safe supply. No critical stock-out alerts reported.`;
        }
      } 
      else if (isDoctorQuery) {
        // Compile absent doctors
        const flaggedAttendance = districtData.flaggedCenters?.filter(c => c.reasons.some(r => r.toLowerCase().includes('doctor') || r.toLowerCase().includes('absenteeism')));
        if (flaggedAttendance && flaggedAttendance.length > 0) {
          if (language === 'hi') {
            botResponseText = `🩺 **डॉक्टर उपस्थिति अलर्ट:**\n` +
              flaggedAttendance.map(c => `- **${c.name}**: ${c.reasons.filter(r => r.toLowerCase().includes('doctor') || r.toLowerCase().includes('absenteeism')).join(', ')}`).join('\n') +
              `\n\nप्रशासक को सलाह दी जाती है कि वे वैकल्पिक डॉक्टरों की ड्यूटी लगाएं।`;
          } else {
            botResponseText = `🩺 **Physician Attendance Alerts:**\n` +
              flaggedAttendance.map(c => `- **${c.name}**: ${c.reasons.filter(r => r.toLowerCase().includes('doctor') || r.toLowerCase().includes('absenteeism')).join(', ')}`).join('\n') +
              `\n\nAdministrators are recommended to arrange relief officers for these centers.`;
          }
        } else {
          botResponseText = language === 'hi'
            ? `✅ आज जिले के सभी मुख्य चिकित्सा अधिकारी (Medical Officers) उपस्थित हैं।`
            : `✅ All active Medical Officers have clocked in. No absenteeism alerts today.`;
        }
      } 
      else if (isBedQuery) {
        // Bed occupancy status
        const total = districtData.totalBeds || 0;
        const occupied = districtData.occupiedBeds || 0;
        const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
        const flaggedBeds = districtData.flaggedCenters?.filter(c => c.reasons.some(r => r.toLowerCase().includes('bed') || r.toLowerCase().includes('occupancy')));

        if (language === 'hi') {
          botResponseText = `🛏️ **बेड्स (बिस्तरों) की स्थिति:**\n` +
            `- कुल उपलब्ध बिस्तर: **${total}**\n` +
            `- भरे हुए बिस्तर: **${occupied}** (${rate}% ऑक्यूपेंसी रेट)\n` +
            (flaggedBeds && flaggedBeds.length > 0
              ? `⚠️ इन केंद्रों में बेड की गंभीर कमी है:\n` + flaggedBeds.map(c => `- **${c.name}**: ${c.reasons.filter(r => r.toLowerCase().includes('bed') || r.toLowerCase().includes('occupancy')).join(', ')}`).join('\n')
              : `✅ सभी केंद्रों में पर्याप्त बेड्स उपलब्ध हैं।`);
        } else {
          botResponseText = `🛏️ **Bed Occupancy Status:**\n` +
            `- Total District Beds: **${total}**\n` +
            `- Occupied Beds: **${occupied}** (${rate}% occupancy rate)\n` +
            (flaggedBeds && flaggedBeds.length > 0
              ? `⚠️ Critical bed shortages at:\n` + flaggedBeds.map(c => `- **${c.name}**: ${c.reasons.filter(r => r.toLowerCase().includes('bed') || r.toLowerCase().includes('occupancy')).join(', ')}`).join('\n')
              : `✅ No critical bed congestions reported.`);
        }
      }
      else if (isRedistributeQuery) {
        if (suggestions && suggestions.length > 0) {
          if (language === 'hi') {
            botResponseText = `🔄 **स्मार्ट दवा वितरण सुझाव:**\n` +
              suggestions.slice(0, 3).map((s, idx) => `${idx + 1}. **${s.itemName}**: ${s.quantity} यूनिट्स को **${s.sourceCenter.name}** से **${s.targetCenter.name}** भेजें (दूरी: ${s.distanceKm} किमी)`).join('\n') +
              `\n\nइसे मंजूरी देने के लिए डैशबोर्ड के 'Redistribution' पेज पर जाएं।`;
          } else {
            botResponseText = `🔄 **Smart Redistribution Advice:**\n` +
              suggestions.slice(0, 3).map((s, idx) => `${idx + 1}. **${s.itemName}**: Transfer ${s.quantity} units from **${s.sourceCenter.name}** to **${s.targetCenter.name}** (Distance: ${s.distanceKm} km)`).join('\n') +
              `\n\nGo to the 'Redistribution' page to authorize these matches.`;
          }
        } else {
          botResponseText = language === 'hi'
            ? `✅ वर्तमान में कोई नया दवा पुनर्वितरण (Redistribution) सुझाव लंबित नहीं है। सभी केंद्र सुरक्षित स्टॉक स्तर पर हैं।`
            : `✅ No new redistribution matches needed at this time. All centers are balanced.`;
        }
      }
      else {
        // General query response
        const totalFlagged = districtData.flaggedCenters?.length || 0;
        if (language === 'hi') {
          botResponseText = `💡 **जिला स्वास्थ्य सारांश:**\n` +
            `- कुल चिंताजनक स्वास्थ्य केंद्र: **${totalFlagged}** ${totalFlagged > 0 ? '⚠️' : '✅'}\n` +
            `- दवाओं की कमी की संख्या: **${districtData.totalStockOuts || 0}**\n` +
            `- कुल बिस्तरों की ऑक्यूपेंसी: **${districtData.totalBeds > 0 ? Math.round((districtData.occupiedBeds / districtData.totalBeds) * 100) : 0}%**\n\n` +
            `मुझसे दवाओं, डॉक्टर हाजिरी, या बिस्तरों के बारे में विस्तृत सवाल पूछें! (उदाहरण: "दवाओं की कमी दिखाओ")`;
        } else {
          botResponseText = `💡 **District Overview Summary:**\n` +
            `- Flagged Centers for Review: **${totalFlagged}** ${totalFlagged > 0 ? '⚠️' : '✅'}\n` +
            `- Total Medicine Shortages: **${districtData.totalStockOuts || 0}**\n` +
            `- Overall Bed Occupancy: **${districtData.totalBeds > 0 ? Math.round((districtData.occupiedBeds / districtData.totalBeds) * 100) : 0}%**\n\n` +
            `Ask me specific questions like "show low stock items", "check doctor attendance", or "redistribution suggestions".`;
        }
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponseText, timestamp: new Date() }]);
    } catch (err) {
      console.error('AI assistant error:', err);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: language === 'hi' 
          ? 'माफ़ कीजियेगा, जानकारी लोड करने में समस्या आ रही है। कृपया पुनः प्रयास करें।' 
          : 'Sorry, I encountered an error fetching live data. Please try again.', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = language === 'hi' 
    ? [
        { label: '📦 दवा स्टॉक अलर्ट', query: 'दवाओं की कमी की स्थिति क्या है?' },
        { label: '🩺 डॉक्टर उपस्थिति', query: 'डॉक्टरों की हाजिरी दिखाओ' },
        { label: '🛏️ बिस्तरों की स्थिति', query: 'अस्पताल के बेड्स की स्थिति बताएं' },
        { label: '🔄 दवा ट्रांसफर सुझाव', query: 'दवा पुनर्वितरण (Redistribution) सुझाव' }
      ]
    : [
        { label: '📦 Stock Alerts', query: 'Which medicines are low in stock?' },
        { label: '🩺 Doctor Attendance', query: 'Show doctor attendance status' },
        { label: '🛏️ Bed Occupancy', query: 'Show bed availability capacity' },
        { label: '🔄 Transfer Advice', query: 'Suggest medicine redistributions' }
      ];

  return (
    <>
      {/* Floating Toggle Button with Pulse Animation */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 focus:outline-none"
        title="NiramayAI Copilot"
        id="ai-assistant-toggle"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-500/30 dark:bg-emerald-500/20 animate-ping pointer-events-none" />
        {isOpen ? <X className="w-6 h-6 text-slate-950" /> : <HeartPulse className="w-6 h-6 text-slate-950 animate-pulse" />}
      </button>

      {/* Floating Glassmorphic Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] rounded-2xl flex flex-col shadow-2xl overflow-hidden border backdrop-blur-md transition-all duration-300 animate-slide-up ${
            theme === 'light' 
              ? 'bg-white/90 border-slate-200/80 shadow-slate-300/40' 
              : 'bg-[#0b1224]/90 border-slate-800/80 shadow-slate-950/80'
          }`}
          id="ai-assistant-drawer"
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b bg-slate-900/5 dark:bg-slate-950/20 border-slate-200/40 dark:border-slate-800/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h4 className={`text-sm font-bold tracking-wide ${theme === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
                  NiramayAI Copilot
                </h4>
                <p className="text-[10px] text-emerald-500 font-semibold tracking-wider uppercase animate-pulse">
                  {language === 'hi' ? 'लाइव सहायक' : 'Live Assistant'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition ${
                theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' 
                      : 'bg-emerald-500 text-slate-950'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line border shadow-sm ${
                    msg.sender === 'user'
                      ? (theme === 'light' 
                          ? 'bg-slate-100 text-slate-700 border-slate-200' 
                          : 'bg-slate-800/80 text-slate-200 border-slate-700/60')
                      : (theme === 'light' 
                          ? 'bg-emerald-500/10 text-slate-800 border-emerald-500/20' 
                          : 'bg-emerald-500/5 text-slate-200 border-emerald-500/15')
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking / Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className={`p-3 rounded-2xl text-xs flex items-center space-x-2 border ${
                    theme === 'light' 
                      ? 'bg-slate-50 text-slate-400 border-slate-150' 
                      : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
                  }`}>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>{language === 'hi' ? 'सोच रहा हूँ...' : 'Thinking...'}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 pb-2 pt-1 border-t border-slate-200/10 dark:border-slate-800/10">
              <div className="flex flex-wrap gap-2 max-h-[85px] overflow-y-auto scrollbar-thin">
                {quickPrompts.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.query)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition border ${
                      theme === 'light'
                        ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-indigo-650'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-emerald-400'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-3 border-t bg-slate-900/5 dark:bg-slate-950/20 border-slate-200/40 dark:border-slate-800/40 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={language === 'hi' ? 'कुछ पूछें...' : 'Type a query...'}
              className={`flex-1 px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition ${
                theme === 'light'
                  ? 'bg-white text-slate-700 border-slate-250 focus:border-slate-350'
                  : 'bg-slate-950/80 text-slate-200 border-slate-850 focus:border-slate-700'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-xl transition ${
                !input.trim() || isLoading
                  ? 'bg-slate-500/10 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 hover:scale-105 active:scale-95'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
