import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Sparkles, 
  Play, 
  ShieldAlert, 
  BedDouble, 
  Package, 
  Users, 
  TrendingDown, 
  Compass, 
  CheckCircle,
  Truck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import axios from 'axios';

const SimulationSandbox = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  // Settings state
  const [centers, setCenters] = useState([]);
  const [epicenterId, setEpicenterId] = useState('');
  const [outbreakType, setOutbreakType] = useState('dengue');
  const [supplyDelay, setSupplyDelay] = useState(10); // Days of supply delay
  const [duration, setDuration] = useState(15); // Simulation span

  // Simulation status
  const [isRunning, setIsRunning] = useState(false);
  const [simRunCount, setSimRunCount] = useState(0);
  const [showPlaybookSuccess, setShowPlaybookSuccess] = useState(false);
  const [playbookMessage, setPlaybookMessage] = useState('');

  // Results state
  const [simResults, setSimResults] = useState(null);
  const [chartData, setChartData] = useState([]);

  // Fetch centers list for dropdown
  useEffect(() => {
    axios.get('/auth/health-centers')
      .then(res => {
        setCenters(res.data);
        if (res.data.length > 0) {
          setEpicenterId(res.data[0].id);
        }
      })
      .catch(err => console.error('Error fetching centers for sandbox dropdown:', err));
  }, []);

  const runSimulation = () => {
    setIsRunning(true);
    setSimRunCount(prev => prev + 1);

    setTimeout(() => {
      const selectedCenter = centers.find(c => c.id === epicenterId) || { name: 'Epicenter PHC' };
      
      // Multipliers based on Outbreak Selection
      let consumptionMultiplier = 1.2;
      let footfallMultiplier = 1.1;
      let targetMedicine = 'Amoxicillin';
      
      if (outbreakType === 'dengue') {
        consumptionMultiplier = 2.8;
        footfallMultiplier = 2.2;
        targetMedicine = 'Paracetamol';
      } else if (outbreakType === 'influenza') {
        consumptionMultiplier = 2.2;
        footfallMultiplier = 1.8;
        targetMedicine = 'Cough Syrup';
      } else if (outbreakType === 'covid') {
        consumptionMultiplier = 3.5;
        footfallMultiplier = 3.0;
        targetMedicine = 'Azithromycin';
      }

      // Generate daily forecast chart array
      const initialStock = 450;
      const normalBurnRate = 20;
      const outbreakBurnRate = normalBurnRate * consumptionMultiplier;
      const data = [];

      for (let day = 0; day <= duration; day++) {
        const normalStock = Math.max(0, initialStock - (day * normalBurnRate));
        
        // Supply delay cuts restocking off, accelerate burn
        const outbreakStock = Math.max(0, initialStock - (day * outbreakBurnRate));

        data.push({
          day: `${language === 'hi' ? 'दिन' : 'Day'} ${day}`,
          [language === 'hi' ? 'सामान्य खपत' : 'Normal Stock']: Math.round(normalStock),
          [language === 'hi' ? 'प्रकोप खपत' : 'Simulated Outbreak Stock']: Math.round(outbreakStock)
        });
      }

      setChartData(data);

      // Compute outcomes
      const stockoutDay = Math.round(initialStock / outbreakBurnRate);
      const normalStockoutDay = Math.round(initialStock / normalBurnRate);
      
      const generalBedSaturationDay = Math.round(8 / (footfallMultiplier * 0.4));
      const doctorBurnoutDay = Math.round(5 / (footfallMultiplier * 0.3));

      setSimResults({
        epicenter: selectedCenter.name,
        targetMedicine,
        stockoutDay: stockoutDay > duration ? `${language === 'hi' ? 'सुरक्षित (> ' : 'Safe (> '}${duration}${language === 'hi' ? ' दिन)' : ' Days)'}` : `${language === 'hi' ? 'दिन ' : 'Day '}${stockoutDay}`,
        normalStockoutDay: `${language === 'hi' ? 'दिन ' : 'Day '}${normalStockoutDay}`,
        bedSaturationDay: generalBedSaturationDay > duration ? `${language === 'hi' ? 'सुरक्षित' : 'Safe'}` : `${language === 'hi' ? 'दिन ' : 'Day '}${generalBedSaturationDay}`,
        doctorBurnoutDay: doctorBurnoutDay > duration ? `${language === 'hi' ? 'सामान्य' : 'Normal'}` : `${language === 'hi' ? 'दिन ' : 'Day '}${doctorBurnoutDay}`,
        playbook: [
          {
            id: 1,
            title: language === 'hi' ? 'पूर्व-खाली दवा पुनर्वितरण' : 'Pre-emptive Drug Redistribution',
            description: language === 'hi'
              ? `निकटतम CHC रामपुर से 200 यूनिट ${targetMedicine} को तुरंत ${selectedCenter.name} में ट्रांसफर करें।`
              : `Route 200 units of ${targetMedicine} from CHC Rampur to ${selectedCenter.name} to extend buffer by 7 days.`,
            icon: Package,
            actionLabel: language === 'hi' ? 'स्थानांतरण प्रारंभ करें' : 'Initiate Transfer'
          },
          {
            id: 2,
            title: language === 'hi' ? 'डॉक्टर बैकअप रोस्टर तैनाती' : 'Physician Backup Roster Deployment',
            description: language === 'hi'
              ? `कार्यभार अधिक होने पर दिन 3 तक PHC सोहागपुर से एक रिलीफ डॉक्टर को ${selectedCenter.name} में भेजें।`
              : `Deploy 1 relief officer from PHC Sohagpur to ${selectedCenter.name} by Day 3 to prevent physician burnout.`,
            icon: Users,
            actionLabel: language === 'hi' ? 'ड्यूटी आदेश जारी करें' : 'Issue Duty Order'
          },
          {
            id: 3,
            title: language === 'hi' ? 'अतिरिक्त बिस्तर विस्तार' : 'Emergency Bed Capacity Expansion',
            description: language === 'hi'
              ? `${selectedCenter.name} के सामान्य वार्ड में 10 अतिरिक्त विस्तार बेड स्थापित करें।`
              : `Provision 10 auxiliary beds in general ward of ${selectedCenter.name} to avoid saturation.`,
            icon: BedDouble,
            actionLabel: language === 'hi' ? 'बिस्तर आवंटित करें' : 'Allocate Beds'
          }
        ]
      });

      setIsRunning(false);
    }, 1800);
  };

  const executePlaybookItem = (title) => {
    setPlaybookMessage(title);
    setShowPlaybookSuccess(true);
    setTimeout(() => {
      setShowPlaybookSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-8 relative">
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient-emerald">
            {language === 'hi' ? 'आपदा एवं प्रकोप सिमुलेटर (AI Sandbox)' : 'Predictive Outbreak Simulation Sandbox'}
          </h1>
          <p className={`text-sm mt-1.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            {language === 'hi' 
              ? 'आसपास के स्वास्थ्य केंद्रों पर प्रकोप और आपूर्ति श्रृंखला के प्रभाव का विश्लेषण करने के लिए सिमुलेशन चलाएं।' 
              : 'Run What-If disaster models to preview depletion timelines and generate emergency countermeasures.'}
          </p>
        </div>
      </div>

      {/* Main Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Parameters Panel */}
        <div className={`glass-panel border p-6 rounded-2xl flex flex-col space-y-6 justify-between ${
          theme === 'light' ? 'border-slate-200 bg-white/60' : 'border-slate-800 bg-[#0b1224]/50'
        }`}>
          <div className="space-y-5">
            <h3 className={`text-base font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
              <Compass className="w-5 h-5 text-emerald-500" />
              {language === 'hi' ? 'सिमुलेशन पैरामीटर' : 'Simulation Parameters'}
            </h3>

            {/* Epicenter Dropdown */}
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {language === 'hi' ? 'प्रकोप का मुख्य केंद्र (Epicenter)' : 'Outbreak Epicenter'}
              </label>
              <select
                value={epicenterId}
                onChange={(e) => setEpicenterId(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none transition ${
                  theme === 'light' 
                    ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500' 
                    : 'bg-slate-950/80 border-slate-850 text-slate-200 focus:border-emerald-500'
                }`}
              >
                {centers.map(center => (
                  <option key={center.id} value={center.id}>{center.name} ({center.type})</option>
                ))}
              </select>
            </div>

            {/* Outbreak Type Select */}
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {language === 'hi' ? 'प्रकोप का प्रकार' : 'Outbreak Scenario'}
              </label>
              <select
                value={outbreakType}
                onChange={(e) => setOutbreakType(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none transition ${
                  theme === 'light' 
                    ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500' 
                    : 'bg-slate-950/80 border-slate-850 text-slate-200 focus:border-emerald-500'
                }`}
              >
                <option value="dengue">🦟 {language === 'hi' ? 'डेंगू प्रकोप (Dengue Spike)' : 'Dengue Outbreak'}</option>
                <option value="influenza">🤒 {language === 'hi' ? 'इन्फ्लुएंजा प्रकोप (Influenza Spike)' : 'Influenza Surge'}</option>
                <option value="covid">😷 {language === 'hi' ? 'कोविड प्रकार (COVID Mutation)' : 'COVID-19 Cluster'}</option>
              </select>
            </div>

            {/* Supply Delay Days */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'hi' ? 'आपूर्ति अवरोध (दिन)' : 'Supply Delay (Days)'}
                </label>
                <span className="text-xs font-bold text-emerald-500">{supplyDelay} {language === 'hi' ? 'दिन' : 'Days'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={supplyDelay}
                onChange={(e) => setSupplyDelay(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-850 accent-emerald-500"
              />
            </div>

            {/* Duration Days */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'hi' ? 'पूर्वानुमान अवधि (दिन)' : 'Forecast Span (Days)'}
                </label>
                <span className="text-xs font-bold text-emerald-500">{duration} {language === 'hi' ? 'दिन' : 'Days'}</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-850 accent-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={isRunning}
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition ${
              isRunning 
                ? 'bg-slate-500/10 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 hover:scale-[1.02] shadow-lg active:scale-98'
            }`}
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning 
              ? (language === 'hi' ? 'मॉडलिंग की जा रही है...' : 'Running Models...') 
              : (language === 'hi' ? 'सिमुलेशन प्रारंभ करें' : 'Initiate AI Simulation')}
          </button>
        </div>

        {/* Right Side: Charts & Outcomes Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Visualizer Area */}
          <div className={`glass-panel border p-6 rounded-2xl ${
            theme === 'light' ? 'border-slate-200 bg-white/60' : 'border-slate-800 bg-[#0b1224]/50'
          }`}>
            <h3 className={`text-base font-bold mb-6 flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
              <Sparkles className="w-5 h-5 text-emerald-500" />
              {language === 'hi' ? 'अनुमानित दवा स्टॉक क्षय वक्र' : 'Simulated Drug Depletion Curve'}
            </h3>

            {chartData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: theme === 'light' ? '#fff' : '#0b1224', borderColor: '#334155' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line 
                      type="monotone" 
                      dataKey={language === 'hi' ? 'सामान्य खपत' : 'Normal Stock'} 
                      stroke="#64748b" 
                      strokeWidth={2.5} 
                      dot={{ r: 2 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey={language === 'hi' ? 'प्रकोप खपत' : 'Simulated Outbreak Stock'} 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={`h-[280px] flex flex-col items-center justify-center border border-dashed rounded-2xl ${
                theme === 'light' ? 'border-slate-250' : 'border-slate-800/80'
              }`}>
                <TrendingDown className="w-12 h-12 text-slate-500 mb-3 animate-pulse" />
                <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'hi' ? 'सिमुलेशन परिणाम लोड करने के लिए बाईं ओर बटन पर क्लिक करें।' : 'Click the button on the left to display predictive simulations.'}
                </p>
              </div>
            )}
          </div>

          {/* Simulated Outcomes */}
          {simResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Outcome 1: Stockout Day */}
              <div className={`glass-panel border p-5 rounded-2xl flex items-center space-x-4 ${
                theme === 'light' ? 'border-slate-200 bg-white/60' : 'border-slate-800 bg-[#0b1224]/50'
              }`}>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {language === 'hi' ? 'अनुमानित स्टॉक-आउट' : 'Simulated Stock-out'}
                  </h4>
                  <p className="text-lg font-black text-rose-500 mt-0.5">{simResults.stockoutDay}</p>
                </div>
              </div>

              {/* Outcome 2: Bed Capacity overload */}
              <div className={`glass-panel border p-5 rounded-2xl flex items-center space-x-4 ${
                theme === 'light' ? 'border-slate-200 bg-white/60' : 'border-slate-800 bg-[#0b1224]/50'
              }`}>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {language === 'hi' ? 'बेड क्षमता अधिभार' : 'Bed Saturation Day'}
                  </h4>
                  <p className="text-lg font-black text-amber-500 mt-0.5">{simResults.bedSaturationDay}</p>
                </div>
              </div>

              {/* Outcome 3: Doctor Burnout */}
              <div className={`glass-panel border p-5 rounded-2xl flex items-center space-x-4 ${
                theme === 'light' ? 'border-slate-200 bg-white/60' : 'border-slate-800 bg-[#0b1224]/50'
              }`}>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {language === 'hi' ? 'चिकित्सक अधिभार खतरा' : 'Staff Burnout Timeline'}
                  </h4>
                  <p className="text-lg font-black text-indigo-500 mt-0.5">{simResults.doctorBurnoutDay}</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Emergency Action Playbook Panel */}
      {simResults && (
        <div className={`glass-panel border p-6 rounded-2xl space-y-6 ${
          theme === 'light' ? 'border-slate-200 bg-white/60' : 'border-slate-800 bg-[#0b1224]/50'
        }`}>
          <div>
            <h3 className={`text-base font-extrabold flex items-center gap-2 ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              {language === 'hi' ? 'एआई-जनित आपातकालीन कार्यपुस्तिका' : 'AI Emergency Action Playbook'}
            </h3>
            <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {language === 'hi' 
                ? 'सिमुलेटेड स्वास्थ्य संकट को रोकने के लिए एआई द्वारा सुझाए गए काउंटर उपाय निम्नलिखित हैं।' 
                : 'Proactive countermeasures suggested by NiramayAI to prevent the simulated outbreak bottleneck.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {simResults.playbook.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id}
                  className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition hover:shadow-md ${
                    theme === 'light' ? 'border-slate-200 bg-slate-50/50' : 'border-slate-850 bg-slate-950/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className={`text-xs font-black tracking-wide ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                        {item.title}
                      </h4>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.description}
                    </p>
                  </div>

                  <button
                    onClick={() => executePlaybookItem(item.title)}
                    className="w-full py-2.5 rounded-xl text-[10px] font-black tracking-wider bg-slate-900 text-slate-100 hover:bg-slate-800 transition uppercase dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    {item.actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Execution Success Modal */}
      {showPlaybookSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className={`p-6 max-w-sm rounded-2xl border flex flex-col items-center text-center space-y-4 shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0b1224] border-slate-850'
          }`}>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                {language === 'hi' ? 'आपातकालीन आदेश जारी!' : 'Emergency Command Executed!'}
              </h3>
              <p className={`text-xs mt-1.5 leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {language === 'hi' 
                  ? `आदेश: "${playbookMessage}" को जिला स्वास्थ्य प्रणाली में सफलतापूर्वक लागू किया गया है।` 
                  : `Playbook command: "${playbookMessage}" has been authorized and dispatched across regional servers.`}
              </p>
            </div>
            <button
              onClick={() => setShowPlaybookSuccess(false)}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-slate-950 hover:scale-105 active:scale-95 transition"
            >
              {language === 'hi' ? 'ठीक है' : 'Close Dashboard'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SimulationSandbox;
