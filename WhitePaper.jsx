import React, { useState, useMemo, useRef } from 'react';
import { 
  Database, Cloud, BarChart3, Activity, ChevronDown, 
  TerminalSquare, Search, PieChart, Users, DollarSign, 
  TrendingUp, Percent, Wallet, RefreshCw, Target, 
  Briefcase, Menu, X, RotateCcw, LayoutDashboard, 
  Server, CandlestickChart, Scale, FileText, CheckCircle2,
  Cpu, Globe, ArrowRight, Hexagon, Settings2, Download,
  Clock, Terminal, GitCommit, ListTodo, Share, LineChart as LineChartIcon,
  FolderOpen, Lock, Edit, MessageSquare, LayoutGrid, Sparkles, Plus, Mic
} from 'lucide-react';
import { 
  ComposedChart, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- Default Configuration (For Resetting) ---
const DEFAULT_CONFIG = {
  subscriptionPrice: 850,
  cac: 1500,
  organicGrowth: 2,
  churnRate: 2.0,
  ownerDrawPercent: 30,
  tam: 25000,
  maxMomGrowth: 12,
  baseOpEx: 5000,
  supportCostPerClient: 150,
  ordersPerClient: 5000,
  updatesPerOrder: 2,
  kbPerOrderEvent: 5,
  analyticsQueriesPerClient: 200,
  gbPerQuery: 0.25,
  supaBase: 25,
  supaCompute: 110,
  supaStorageGb: 0.125,
  supaEgressGb: 0.09,
  supaReadReplica: 110,
  supaReplicaTbThreshold: 1.5,
  awsRdsMonthly: 130,
  awsLambda1m: 0.20,
  awsSqs1m: 0.40,
  awsStorageGb: 0.115,
  awsAthenaPerTb: 5.00,
  bqPerTb: 7.82,
  bqStorage: 0.05,
};

// --- Mock Data Constants for KPIs ---
const BURNDOWN_DATA = [
  { day: 'Mon - 3/2', remaining: 45, ideal: 45 },
  { day: 'Tue - 3/3', remaining: 40, ideal: 38 },
  { day: 'Wed - 3/4', remaining: 32, ideal: 30 },
  { day: 'Thu - 3/5', remaining: 28, ideal: 24 },
  { day: 'Fri - 3/6', remaining: 20, ideal: 18 },
  { day: 'Sat - 3/7', remaining: 15, ideal: 10 },
  { day: 'Sun - 3/8', remaining: 4, ideal: 0 },
];

const ROADMAP_DATA = [
  { id: 's1', title: 'Sprint 1', status: 'Completed', goal: 'Foundation & CI/CD pipeline setup. Core DB architecture.', epics: [ { name: 'Infrastructure as Code', progress: 100, stories: 12 }, { name: 'Auth Service', progress: 100, stories: 8 } ] },
  { id: 's2', title: 'Sprint 2', status: 'Completed', goal: 'API Gateway and initial data ingestion endpoints.', epics: [ { name: 'Ingestion Pipeline', progress: 100, stories: 15 }, { name: 'Webhook Handlers', progress: 100, stories: 5 } ] },
  { id: 's3', title: 'Sprint 3', status: 'Completed', goal: 'Frontend scaffolding and initial dashboard visualizations.', epics: [ { name: 'Component Library', progress: 100, stories: 10 }, { name: 'Analytics UI', progress: 100, stories: 14 } ] },
  { id: 's4', title: 'Sprint 4', status: 'Current', goal: 'Stripe integration, usage metering, and billing portal.', epics: [ { name: 'Payment Gateway', progress: 82, stories: 18 }, { name: 'Usage Metering', progress: 45, stories: 12 } ] },
  { id: 's5', title: 'Sprint 5', status: 'Planned', goal: 'Custom report generation and PDF export engine.', epics: [ { name: 'Reporting Engine', progress: 0, stories: 20 }, { name: 'PDF Service', progress: 0, stories: 8 } ] },
  { id: 's6', title: 'Sprint 6', status: 'Planned', goal: 'Public API beta release and developer documentation.', epics: [ { name: 'Public API Beta', progress: 0, stories: 16 }, { name: 'Developer Portal', progress: 0, stories: 10 } ] }
];

// --- Helper Functions ---
const formatCurrency = (value) => {
  if (value === 'N/A') return 'N/A';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  if (value < 0) return `-$${Math.abs(value).toFixed(0)}`;
  return `$${value.toFixed(0)}`;
};

const formatNumber = (value) => {
  if (value === 'N/A') return 'N/A';
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short"
  }).format(Math.floor(value));
};

// --- Cursor-Inspired UI Components ---
const ControlGroup = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#EAE7E0]/[0.04]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-[13px] font-medium hover:bg-[#EAE7E0]/[0.02] transition-colors focus:outline-none group"
      >
        <div className="flex items-center gap-3 text-[#EAE7E0]/70 group-hover:text-[#EAE7E0]/90 transition-colors">
          <Icon size={14} className="text-[#EAE7E0]/40 group-hover:text-[#EAE7E0]/70" />
          <span>{title}</span>
        </div>
        <ChevronDown size={14} className={`text-[#EAE7E0]/30 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-5 space-y-4 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const InputRow = ({ label, value, onChange, step = 1, min = 0, max = undefined, unit = "", isInt = false }) => {
  const handleChange = (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 0;
    if (isInt) val = Math.round(val);
    onChange(val);
  };
  return (
    <div className="flex flex-col gap-1.5 group">
      <div className="flex justify-between items-center">
        <label className="text-[11px] text-[#A19D98] tracking-wide font-medium">{label}</label>
        {unit && <span className="text-[10px] text-[#A19D98]/50 font-mono">{unit}</span>}
      </div>
      <input
        type="number" value={value} onChange={handleChange} step={step} min={min} max={max}
        className="bg-[#0C0B0A]/50 border border-[#EAE7E0]/[0.06] rounded-md px-2.5 py-1.5 text-[13px] text-[#EAE7E0] font-mono focus:outline-none focus:border-[#EAE7E0]/30 focus:bg-[#EAE7E0]/[0.04] transition-all w-full placeholder-[#A19D98]/30 hover:border-[#EAE7E0]/10"
      />
    </div>
  );
};

const MetricCard = ({ title, value, subtext, icon: Icon, colorClass = "text-[#EAE7E0]", highlight = false }) => (
  <div className={`p-5 rounded-xl border relative overflow-hidden transition-all duration-500 bg-[#161412] hover:bg-[#1A1816] ${highlight ? 'border-[#EAE7E0]/20 shadow-[0_0_30px_rgba(234,231,224,0.03)]' : 'border-[#EAE7E0]/[0.06] hover:border-[#EAE7E0]/10'}`}>
    {highlight && <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#EAE7E0]/30 to-transparent"></div>}
    <div className="flex flex-col h-full justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-[#EAE7E0]/[0.03] border border-[#EAE7E0]/[0.05] shrink-0 ${colorClass}`}>
          <Icon size={14} strokeWidth={1.5} />
        </div>
        <h3 className="text-[12px] font-medium text-[#A19D98] tracking-wide truncate">{title}</h3>
      </div>
      <div>
        <span className="text-2xl font-semibold text-[#EAE7E0] tracking-tight font-mono">{value}</span>
        {subtext && <p className="text-[11px] text-[#A19D98]/70 mt-1.5 tracking-wide truncate">{subtext}</p>}
      </div>
    </div>
  </div>
);

const NavDropdown = ({ title, items, onTitleClick }) => {
  return (
    <div className="relative group">
      <button 
        onClick={onTitleClick}
        className="text-[13px] font-medium text-[#A19D98] group-hover:text-[#EAE7E0] transition-colors py-5 flex items-center gap-1.5 focus:outline-none"
      >
        {title}
        <ChevronDown size={12} className="text-[#A19D98]/50 group-hover:text-[#EAE7E0]/70 transition-colors" />
      </button>
      <div className="absolute top-full left-0 mt-0 hidden group-hover:block w-48 bg-[#161412] border border-[#EAE7E0]/[0.08] rounded-xl shadow-2xl py-1.5 z-50">
        {items.map((item, idx) => (
          <button 
            key={idx} 
            onClick={item.onClick}
            className="w-full text-left block px-4 py-2 text-[13px] text-[#A19D98] hover:text-[#EAE7E0] hover:bg-[#EAE7E0]/[0.04] transition-colors focus:outline-none"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const StatementWidget = ({ title, type, data, onClick, isPlaceholder = false }) => {
  return (
    <div 
      onClick={onClick}
      className="h-[280px] bg-[#131110] rounded-2xl border border-[#EAE7E0]/[0.08] shadow-2xl overflow-hidden flex flex-col cursor-pointer hover:border-[#EAE7E0]/20 hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className="h-10 border-b border-[#EAE7E0]/[0.04] bg-[#0C0B0A]/30 flex items-center px-4 justify-between select-none">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EAE7E0]/20 group-hover:bg-[#EF4444]/80 transition-colors"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#EAE7E0]/20 group-hover:bg-[#FF9900]/80 transition-colors"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#EAE7E0]/20 group-hover:bg-[#10B981]/80 transition-colors"></div>
        </div>
        <span className="text-[11px] text-[#A19D98]/50 font-mono group-hover:text-[#EAE7E0]/80 transition-colors">{title}</span>
        <div className="w-10"></div>
      </div>
      <div className="flex-1 p-6 pointer-events-none relative flex flex-col items-center justify-center">
         {isPlaceholder ? (
            <div className="flex flex-col items-center justify-center text-center opacity-50">
               <FolderOpen size={48} className="text-[#A19D98] mb-4" />
               <h4 className="text-[15px] text-[#EAE7E0] font-medium mb-1">Coming Soon</h4>
               <p className="text-[12px] text-[#A19D98]">Data synchronization pending.</p>
            </div>
         ) : type === 'income' ? (
           <div className="w-full h-full flex flex-col">
             <h4 className="text-[15px] text-[#EAE7E0] mb-1 font-medium">Income Statement</h4>
             <p className="text-[12px] text-[#A19D98] mb-6">Revenue & EBITDA Margin</p>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={data}>
                 <Bar dataKey="revenue" fill="rgba(234,231,224,0.05)" radius={[2,2,0,0]} />
                 <Bar dataKey="netIncome" fill="rgba(234,231,224,0.3)" radius={[2,2,0,0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
         ) : type === 'balance' ? (
           <div className="w-full h-full flex flex-col">
             <h4 className="text-[15px] text-[#EAE7E0] mb-1 font-medium">Balance Sheet</h4>
             <p className="text-[12px] text-[#A19D98] mb-6">Cumulative Distributions</p>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data}>
                 <Area type="monotone" dataKey="cumulativeDraw" fill="rgba(234,231,224,0.1)" stroke="#EAE7E0" strokeWidth={2} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
         ) : type === 'cashflow' ? (
           <div className="w-full h-full flex flex-col">
             <h4 className="text-[15px] text-[#EAE7E0] mb-1 font-medium">Cash Flow</h4>
             <p className="text-[12px] text-[#A19D98] mb-6">Operating & Distribution Flows</p>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data}>
                 <Line type="monotone" dataKey="netIncome" stroke="rgba(234,231,224,0.6)" strokeWidth={2} dot={false} />
                 <Line type="monotone" dataKey="ownerDraw" stroke="#EAE7E0" strokeWidth={2} dot={false} strokeDasharray="4 4" />
               </LineChart>
             </ResponsiveContainer>
           </div>
         ) : null}
      </div>
    </div>
  );
};

const StatementViewTemplate = ({ title, subtitle, columns, rows, onBack }) => (
  <div className="w-full max-w-5xl mx-auto pt-32 pb-32 px-6 relative z-10 animate-in fade-in duration-500">
    <button onClick={onBack} className="text-[#A19D98] hover:text-[#EAE7E0] flex items-center gap-2 text-[13px] mb-8 transition-colors focus:outline-none">
       <ArrowRight size={14} className="rotate-180" /> Back
    </button>
    
    <div className="mb-10">
      <h2 className="text-4xl font-medium text-[#EAE7E0] tracking-tight mb-2">{title}</h2>
      <p className="text-[#A19D98] text-[15px]">{subtitle}</p>
    </div>

    <div className="bg-[#131110] border border-[#EAE7E0]/[0.08] rounded-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#EAE7E0]/[0.08] bg-[#0C0B0A]/50">
               <th className="py-4 px-6 text-[11px] font-mono text-[#A19D98]/70 uppercase tracking-widest w-1/3">Line Item</th>
               {columns.map(c => <th key={c} className="py-4 px-6 text-[11px] font-mono text-[#A19D98]/70 uppercase tracking-widest text-right">{c}</th>)}
            </tr>
          </thead>
          <tbody>
             {rows.map((r, i) => {
                if (r.isSpacer) return <tr key={i}><td colSpan={columns.length + 1} className="h-6"></td></tr>;
                return (
                  <tr key={i} className={`border-b border-[#EAE7E0]/[0.04] hover:bg-[#EAE7E0]/[0.02] transition-colors ${r.isTotal ? 'bg-[#EAE7E0]/[0.01]' : ''}`}>
                     <td className={`py-3.5 px-6 text-[14px] ${r.isHeader ? 'text-[#EAE7E0] font-medium' : r.isTotal ? 'text-[#EAE7E0] font-medium' : 'text-[#A19D98]'} ${r.indent ? 'pl-10' : ''}`}>
                       {r.label}
                     </td>
                     {r.values.map((v, j) => (
                       <td key={j} className={`py-3.5 px-6 text-[13px] font-mono text-right ${r.isTotal ? 'text-[#EAE7E0] font-medium' : 'text-[#A19D98]'}`}>
                         {v === null || v === 'N/A' ? v : (r.format === 'percent' ? `${v.toFixed(1)}%` : formatCurrency(v))}
                       </td>
                     ))}
                  </tr>
                )
             })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// --- Standalone ChatGPT / MCP Web Browser Demo Component ---
const McpDemoWidget = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mcpAdded, setMcpAdded] = useState(false);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 z-20 relative animate-in fade-in duration-500">
      <div className="w-full h-[650px] bg-[#212121] rounded-2xl border border-[#EAE7E0]/[0.08] shadow-2xl shadow-black/50 overflow-hidden flex flex-col font-sans">
         {/* Browser Header Bar */}
         <div className="h-10 border-b border-white/5 bg-[#171717] flex items-center px-4 justify-between select-none shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-white/20"></div>
              <div className="w-3 h-3 rounded-full bg-white/20"></div>
              <div className="w-3 h-3 rounded-full bg-white/20"></div>
            </div>
            <div className="text-[11px] text-white/50 font-mono tracking-wide absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-[#212121] px-4 py-1 rounded-md border border-white/5">
              <Lock size={10} /> chatgpt.com
            </div>
            <div className="flex gap-2">
               <Menu size={14} className="text-white/40" />
            </div>
         </div>

         {/* ChatGPT Application Body */}
         <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-[260px] bg-[#171717] flex-col p-3 shrink-0 hidden md:flex border-r border-white/5">
               <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-2 text-white hover:bg-white/5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center mr-1">
                      <Hexagon size={14} className="text-black" />
                    </div>
                    <span className="text-[14px] font-medium">ChatGPT</span> 
                    <ChevronDown size={12} className="opacity-50" />
                  </div>
                  <Edit size={16} className="text-white/70 cursor-pointer hover:text-white" />
               </div>
               
               <div className="space-y-1 mb-8">
                 <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-[13px] text-white/90">
                   <MessageSquare size={16} className="opacity-70" /> New chat
                 </div>
                 <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-[13px] text-white/90">
                   <Search size={16} className="opacity-70" /> Search chats
                 </div>
                 <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-[13px] text-white/90">
                   <LayoutGrid size={16} className="opacity-70" /> Explore GPTs
                 </div>
               </div>

               <div className="text-xs text-white/50 px-3 mb-2 font-medium">Projects</div>
               <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer text-[13px] text-white/90">
                   <FolderOpen size={16} className="opacity-70" /> E-commerce Data
               </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#212121] relative">
               {/* User Nav */}
               <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
                  <div className="px-3 py-1.5 bg-[#2F2F2F] hover:bg-[#3F3F3F] cursor-pointer rounded-full text-xs font-medium text-white/90 border border-white/5 flex items-center gap-2 transition-colors">
                     <Sparkles size={12} className="text-purple-400" /> Free offer
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-blue-500 shadow-md"></div>
               </div>

               <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <h1 className="text-3xl font-medium text-[#ECECEC] mb-8">What are you working on?</h1>

                  <div className="w-full max-w-2xl bg-[#2F2F2F] rounded-3xl p-3 shadow-lg relative border border-white/5">
                     
                     {/* Popup Context Menu */}
                     {menuOpen && (
                       <div className="absolute bottom-[60px] left-0 w-[260px] bg-[#2F2F2F] rounded-xl border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                          <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#3F3F3F] cursor-pointer text-[14px] text-[#ECECEC] transition-colors">
                            <FileText size={16} className="text-[#ECECEC]/70" /> Add photos & files
                          </div>
                          <div className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#3F3F3F] cursor-pointer text-[14px] text-[#ECECEC] border-b border-white/5 pb-3 mb-1 transition-colors">
                            <Cloud size={16} className="text-blue-400" /> Add from Google Drive
                          </div>
                          {/* The MCP Integration Link */}
                          <div 
                            className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#3F3F3F] cursor-pointer text-[14px] text-[#ECECEC] group transition-colors" 
                            onClick={() => {setMcpAdded(true); setMenuOpen(false);}}
                          >
                            <Database size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" /> 
                            <span className="font-medium">Simulator MCP</span>
                          </div>
                       </div>
                     )}

                     {/* Chat Input Container */}
                     <div className="flex flex-col px-1">
                       {/* Attached MCP Pill */}
                       {mcpAdded && (
                         <div className="flex mb-3">
                           <div className="flex items-center gap-1.5 bg-[#171717] border border-white/10 px-3 py-1.5 rounded-full text-[13px] font-medium text-[#ECECEC]">
                             <Database size={13} className="text-emerald-400" /> 
                             Simulator MCP 
                             <X size={14} className="ml-1 cursor-pointer text-white/40 hover:text-white transition-colors" onClick={() => setMcpAdded(false)} />
                           </div>
                         </div>
                       )}
                       
                       <div className="flex items-center gap-3">
                         <button 
                           onClick={() => setMenuOpen(!menuOpen)}
                           className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 transition-colors shrink-0 focus:outline-none"
                         >
                           <Plus size={18} />
                         </button>
                         <input 
                           type="text"
                           placeholder="Ask anything"
                           className="flex-1 bg-transparent border-none outline-none text-[#ECECEC] text-[15px] placeholder:text-[#ECECEC]/50 py-1"
                           value={mcpAdded ? "Extract the Q3 pipeline margins from the Simulator MCP..." : ""}
                           readOnly
                         />
                         <div className="flex gap-2 shrink-0">
                           <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-[#ECECEC] transition-colors focus:outline-none">
                             <Mic size={16} />
                           </button>
                           <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none ${mcpAdded ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white/50'}`}>
                             <ArrowRight size={16} />
                           </button>
                         </div>
                       </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const Footer = ({ setActiveRoute }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const dummy = document.createElement('input');
    document.body.appendChild(dummy);
    dummy.value = window.location.href;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="w-full border-t border-[#EAE7E0]/[0.04] bg-[#0C0B0A] pt-24 pb-12 px-8 mt-auto z-10 relative">
      <div className="max-w-6xl mx-auto flex flex-col gap-20">
        <div className="flex flex-col items-center justify-center gap-6 mb-4">
          <h2 className="text-4xl md:text-5xl font-medium text-[#EAE7E0] tracking-tight">Share With Friends.</h2>
          <button 
            onClick={handleShare}
            className="bg-[#EAE7E0] hover:bg-white text-[#0C0B0A] px-6 py-3 rounded-full text-[15px] font-medium transition-colors flex items-center gap-2 mt-2 shadow-lg shadow-white/5"
          >
            {copied ? <CheckCircle2 size={16} /> : <Share size={16} />} 
            {copied ? 'Link Copied!' : 'Share Website'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-[13px]">
          <div className="flex flex-col gap-4">
            <span className="text-[#EAE7E0] font-medium mb-1">Product</span>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Agents</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Enterprise</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Code Review</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Cloud Agents</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Pricing</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[#EAE7E0] font-medium mb-1">Resources</span>
            <button onClick={() => setActiveRoute('tax_documents')} className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors text-left focus:outline-none">Tax Documents</button>
            <button onClick={() => setActiveRoute('roadmap')} className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors text-left focus:outline-none">Road Map</button>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Docs</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Forum</a>
            <button onClick={() => setActiveRoute('resources')} className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors text-left mt-2 focus:outline-none underline underline-offset-2">All Resources</button>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[#EAE7E0] font-medium mb-1">Company</span>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Careers</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Blog</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Community</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Brand</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[#EAE7E0] font-medium mb-1">Legal</span>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Terms of Service</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Privacy Policy</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">Security</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[#EAE7E0] font-medium mb-1">Connect</span>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">X</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">LinkedIn</a>
            <a href="#" className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors">YouTube</a>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[#EAE7E0]/[0.04] text-[13px] text-[#A19D98]">
          <div className="flex items-center gap-6">
            <span>© 2026 Simulator, Inc.</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> SOC 2 Certified</span>
          </div>
          <div className="flex items-center gap-4 mt-6 md:mt-0">
             <div className="flex items-center gap-2 border border-[#EAE7E0]/10 rounded-full px-4 py-2 hover:bg-[#EAE7E0]/5 cursor-pointer transition-colors">
               <Globe size={14} /> English <ChevronDown size={12} />
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Main Application ---
export default function App() {
  const [activeRoute, setActiveRoute] = useState('whitepaper'); 
  const [activeTab, setActiveTab] = useState('overview'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const [isGlobalSidebarOpen, setIsGlobalSidebarOpen] = useState(false); 
  const [liveKpiView, setLiveKpiView] = useState('agile'); // 'agile' or 'business'

  // --- Scroll State for Roadmap ---
  const roadmapRef = useRef(null);
  const [isDraggingRoadmap, setIsDraggingRoadmap] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onRoadmapMouseDown = (e) => {
    setIsDraggingRoadmap(true);
    setStartX(e.pageX - roadmapRef.current.offsetLeft);
    setScrollLeft(roadmapRef.current.scrollLeft);
  };
  const onRoadmapMouseLeave = () => setIsDraggingRoadmap(false);
  const onRoadmapMouseUp = () => setIsDraggingRoadmap(false);
  const onRoadmapMouseMove = (e) => {
    if (!isDraggingRoadmap) return;
    e.preventDefault();
    const x = e.pageX - roadmapRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    roadmapRef.current.scrollLeft = scrollLeft - walk;
  };

  // --- State Variables ---
  const [subscriptionPrice, setSubscriptionPrice] = useState(DEFAULT_CONFIG.subscriptionPrice); 
  const [cac, setCac] = useState(DEFAULT_CONFIG.cac);
  const [organicGrowth, setOrganicGrowth] = useState(DEFAULT_CONFIG.organicGrowth); 
  const [churnRate, setChurnRate] = useState(DEFAULT_CONFIG.churnRate); 
  const [ownerDrawPercent, setOwnerDrawPercent] = useState(DEFAULT_CONFIG.ownerDrawPercent); 
  const [tam, setTam] = useState(DEFAULT_CONFIG.tam); 
  const [maxMomGrowth, setMaxMomGrowth] = useState(DEFAULT_CONFIG.maxMomGrowth); 
  const [baseOpEx, setBaseOpEx] = useState(DEFAULT_CONFIG.baseOpEx); 
  const [supportCostPerClient, setSupportCostPerClient] = useState(DEFAULT_CONFIG.supportCostPerClient); 
  const [ordersPerClient, setOrdersPerClient] = useState(DEFAULT_CONFIG.ordersPerClient); 
  const [updatesPerOrder, setUpdatesPerOrder] = useState(DEFAULT_CONFIG.updatesPerOrder);
  const [kbPerOrderEvent, setKbPerOrderEvent] = useState(DEFAULT_CONFIG.kbPerOrderEvent);
  const [analyticsQueriesPerClient, setAnalyticsQueriesPerClient] = useState(DEFAULT_CONFIG.analyticsQueriesPerClient); 
  const [gbPerQuery, setGbPerQuery] = useState(DEFAULT_CONFIG.gbPerQuery); 
  
  // Provider configs
  const [supaBase, setSupaBase] = useState(DEFAULT_CONFIG.supaBase);
  const [supaCompute, setSupaCompute] = useState(DEFAULT_CONFIG.supaCompute);
  const [supaStorageGb, setSupaStorageGb] = useState(DEFAULT_CONFIG.supaStorageGb);
  const [supaEgressGb, setSupaEgressGb] = useState(DEFAULT_CONFIG.supaEgressGb);
  const [supaReadReplica, setSupaReadReplica] = useState(DEFAULT_CONFIG.supaReadReplica);
  const [supaReplicaTbThreshold, setSupaReplicaTbThreshold] = useState(DEFAULT_CONFIG.supaReplicaTbThreshold);
  
  const [awsRdsMonthly, setAwsRdsMonthly] = useState(DEFAULT_CONFIG.awsRdsMonthly);
  const [awsLambda1m, setAwsLambda1m] = useState(DEFAULT_CONFIG.awsLambda1m);
  const [awsSqs1m, setAwsSqs1m] = useState(DEFAULT_CONFIG.awsSqs1m);
  const [awsStorageGb, setAwsStorageGb] = useState(DEFAULT_CONFIG.awsStorageGb);
  const [awsAthenaPerTb, setAwsAthenaPerTb] = useState(DEFAULT_CONFIG.awsAthenaPerTb);
  
  const [bqPerTb, setBqPerTb] = useState(DEFAULT_CONFIG.bqPerTb);
  const [bqStorage, setBqStorage] = useState(DEFAULT_CONFIG.bqStorage);

  const handleReset = () => {
    setSubscriptionPrice(DEFAULT_CONFIG.subscriptionPrice);
    setCac(DEFAULT_CONFIG.cac);
    setOrganicGrowth(DEFAULT_CONFIG.organicGrowth);
    setChurnRate(DEFAULT_CONFIG.churnRate);
    setOwnerDrawPercent(DEFAULT_CONFIG.ownerDrawPercent);
    setTam(DEFAULT_CONFIG.tam);
    setMaxMomGrowth(DEFAULT_CONFIG.maxMomGrowth);
    setBaseOpEx(DEFAULT_CONFIG.baseOpEx);
    setSupportCostPerClient(DEFAULT_CONFIG.supportCostPerClient);
    setOrdersPerClient(DEFAULT_CONFIG.ordersPerClient);
    setUpdatesPerOrder(DEFAULT_CONFIG.updatesPerOrder);
    setKbPerOrderEvent(DEFAULT_CONFIG.kbPerOrderEvent);
    setAnalyticsQueriesPerClient(DEFAULT_CONFIG.analyticsQueriesPerClient);
    setGbPerQuery(DEFAULT_CONFIG.gbPerQuery);
    setSupaBase(DEFAULT_CONFIG.supaBase);
    setSupaCompute(DEFAULT_CONFIG.supaCompute);
    setSupaStorageGb(DEFAULT_CONFIG.supaStorageGb);
    setSupaEgressGb(DEFAULT_CONFIG.supaEgressGb);
    setSupaReadReplica(DEFAULT_CONFIG.supaReadReplica);
    setSupaReplicaTbThreshold(DEFAULT_CONFIG.supaReplicaTbThreshold);
    setAwsRdsMonthly(DEFAULT_CONFIG.awsRdsMonthly);
    setAwsLambda1m(DEFAULT_CONFIG.awsLambda1m);
    setAwsSqs1m(DEFAULT_CONFIG.awsSqs1m);
    setAwsStorageGb(DEFAULT_CONFIG.awsStorageGb);
    setAwsAthenaPerTb(DEFAULT_CONFIG.awsAthenaPerTb);
    setBqPerTb(DEFAULT_CONFIG.bqPerTb);
    setBqStorage(DEFAULT_CONFIG.bqStorage);
  };

  // --- Core Logic & Simulation ---
  const getVolumeMetrics = (numClients) => {
    const totalOrders = numClients * ordersPerClient;
    const totalEvents = totalOrders * (1 + updatesPerOrder);
    const storageGbAddedPerMo = (totalEvents * kbPerOrderEvent) / (1024 * 1024);
    const totalStorageGb = storageGbAddedPerMo * 12; 
    const tbScanned = (numClients * analyticsQueriesPerClient * gbPerQuery) / 1024;
    return { totalOrders, totalEvents, totalStorageGb, tbScanned };
  };

  const getInfraCosts = (numClients) => {
    if (numClients <= 0) return { min: 0, supaCost: 0, awsCost: 0, bqCost: 0 };
    const { totalEvents, totalStorageGb, tbScanned } = getVolumeMetrics(numClients);
    
    const supaStorageCost = Math.max(0, (totalStorageGb - 8)) * supaStorageGb;
    const egressGb = (totalEvents * 2) / (1024 * 1024);
    const egressCost = Math.max(0, (egressGb - 50)) * supaEgressGb;
    const replicaCount = Math.floor(tbScanned / Math.max(0.1, supaReplicaTbThreshold));
    const supaAnalyticsCompute = replicaCount * supaReadReplica;
    const scaledCompute = totalEvents > 50000000 ? supaCompute * 2 : supaCompute;
    const supaCost = supaBase + scaledCompute + supaStorageCost + egressCost + supaAnalyticsCompute;

    const awsWriteCost = (totalEvents / 1000000) * (awsLambda1m + awsSqs1m);
    const awsCost = awsRdsMonthly + awsWriteCost + (totalStorageGb * awsStorageGb) + (tbScanned * awsAthenaPerTb);

    const bqCost = (tbScanned * bqPerTb) + (totalStorageGb * bqStorage);

    return {
      min: Math.min(supaCost, awsCost, bqCost),
      supaCost, awsCost, bqCost,
      optimalProvider: supaCost <= awsCost && supaCost <= bqCost ? 'Supabase' : awsCost <= bqCost ? 'AWS' : 'BigQuery'
    };
  };

  const simulation = useMemo(() => {
    const timeline = [];
    let currentClients = 1; 
    let cumulativeDraw = 0;
    let cumulativeRevenue = 0;

    for (let month = 1; month <= 60; month++) {
      const revenue = currentClients * subscriptionPrice;
      cumulativeRevenue += revenue;
      const infra = getInfraCosts(currentClients);
      const grossProfit = revenue - infra.min;
      const totalOpEx = baseOpEx + (currentClients * supportCostPerClient);
      const netBeforeGrowth = grossProfit - totalOpEx;
      
      let ownerCash = 0;
      let marketingSpend = 0;
      let newClientsMarketing = 0;
      const marketSaturation = currentClients / tam;
      const effectiveCac = cac / Math.max(0.01, (1 - marketSaturation));

      if (netBeforeGrowth > 0) {
        ownerCash = netBeforeGrowth * (ownerDrawPercent / 100);
        let intendedMarketingSpend = netBeforeGrowth - ownerCash;
        let potentialNewClients = intendedMarketingSpend / effectiveCac;
        const absoluteMaxNewClients = Math.max(1, currentClients * (maxMomGrowth / 100));

        if (potentialNewClients > absoluteMaxNewClients) {
          newClientsMarketing = absoluteMaxNewClients;
          marketingSpend = newClientsMarketing * effectiveCac; 
          ownerCash += (intendedMarketingSpend - marketingSpend); 
        } else {
          newClientsMarketing = potentialNewClients;
          marketingSpend = intendedMarketingSpend;
        }
      } else if (netBeforeGrowth < 0 && currentClients === 1) {
          ownerCash = netBeforeGrowth; 
      }

      cumulativeDraw += ownerCash;
      const churnedClients = currentClients * (churnRate / 100);
      const ltv = subscriptionPrice / (churnRate / 100);
      
      timeline.push({
        month: `Mo ${month}`,
        monthNum: month,
        clients: Math.round(currentClients),
        revenue, cumulativeRevenue,
        infraCost: infra.min,
        optimalProvider: infra.optimalProvider,
        supaCost: infra.supaCost, awsCost: infra.awsCost, bqCost: infra.bqCost,
        totalOpEx, ownerCash, cumulativeDraw, marketingSpend, effectiveCac, ltv,
        netProfit: ownerCash + marketingSpend,
      });

      currentClients = Math.max(0, currentClients + organicGrowth + newClientsMarketing - churnedClients);
    }
    return timeline;
  }, [subscriptionPrice, cac, organicGrowth, churnRate, baseOpEx, supportCostPerClient, tam, maxMomGrowth, ownerDrawPercent, ordersPerClient, updatesPerOrder, kbPerOrderEvent, analyticsQueriesPerClient, gbPerQuery, supaBase, supaCompute, supaStorageGb, supaEgressGb, supaReadReplica, supaReplicaTbThreshold, awsRdsMonthly, awsLambda1m, awsSqs1m, awsStorageGb, awsAthenaPerTb, bqPerTb, bqStorage]);

  const month60 = simulation[59];

  // --- Aggregated Yearly Data for Financial Statements ---
  const yearlyData = useMemo(() => {
    let cumulativeDraw = 0;
    return Array.from({ length: 5 }, (_, i) => {
      const months = simulation.slice(i * 12, (i + 1) * 12);
      
      const revenue = months.reduce((acc, m) => acc + m.revenue, 0);
      const cogs = months.reduce((acc, m) => acc + m.infraCost, 0);
      const grossProfit = revenue - cogs;
      
      const baseAndSupportOpex = months.reduce((acc, m) => acc + m.totalOpEx, 0);
      const marketingSpend = months.reduce((acc, m) => acc + m.marketingSpend, 0);
      const totalOpex = baseAndSupportOpex + marketingSpend;
      
      const netIncome = grossProfit - totalOpex; 
      const ownerDraw = months.reduce((acc, m) => acc + m.ownerCash, 0);
      
      cumulativeDraw += ownerDraw;
      
      return {
        year: `Year ${i + 1}`,
        revenue,
        cogs,
        grossProfit,
        baseAndSupportOpex,
        marketingSpend,
        totalOpex,
        netIncome,
        ownerDraw,
        cumulativeDraw,
        netChangeInCash: netIncome - ownerDraw
      };
    });
  }, [simulation]);

  // --- Mock Data for Live Business Metrics (First 6 months of sim) ---
  const liveBusinessData = useMemo(() => {
    return simulation.slice(0, 6).map(d => ({
      month: d.month,
      revenue: d.revenue,
      clients: d.clients,
      marketing: d.marketingSpend,
      infra: d.infraCost
    }));
  }, [simulation]);

  const currentLiveMonth = liveBusinessData[liveBusinessData.length - 1];

  // --- Common Chart Styles ---
  const chartProps = {
    margin: { top: 20, right: 20, left: 10, bottom: 0 },
  };
  const axisProps = {
    stroke: "rgba(234,231,224,0.1)",
    tick: { fill: 'rgba(234,231,224,0.4)', fontSize: 10, fontFamily: 'monospace' },
    tickLine: false,
    axisLine: false,
  };
  const tooltipProps = {
    contentStyle: { 
      backgroundColor: '#161412', 
      borderColor: 'rgba(234,231,224,0.08)', 
      borderRadius: '8px',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8)',
      padding: '10px 14px'
    },
    itemStyle: { color: 'rgba(234,231,224,0.9)', fontSize: '12px', padding: '3px 0' },
    labelStyle: { color: 'rgba(234,231,224,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
  };

  // --- Dynamic Renderers for Dashboards/Widgets ---
  const renderMasterDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Revenue Graph */}
      <div className="border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative flex flex-col min-h-[220px]">
        <h3 className="text-[12px] font-medium text-[#EAE7E0] mb-4">Revenue Growth</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simulation} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" hide />
              <YAxis tickFormatter={formatCurrency} {...axisProps} width={60} />
              <Tooltip {...tooltipProps} formatter={(val) => formatCurrency(val)} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#EAE7E0" fill="rgba(234,231,224,0.08)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Graph */}
      <div className="border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative flex flex-col min-h-[220px]">
        <h3 className="text-[12px] font-medium text-[#EAE7E0] mb-4">Active Users (TAM Saturation)</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulation} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" hide />
              <YAxis tickFormatter={formatNumber} {...axisProps} width={60} />
              <Tooltip {...tooltipProps} formatter={(val) => formatNumber(val)} />
              <Line type="monotone" dataKey="clients" name="Active Clients" stroke="rgba(234,231,224,0.6)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Usage Graph */}
      <div className="border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative flex flex-col min-h-[220px]">
        <h3 className="text-[12px] font-medium text-[#EAE7E0] mb-4">Resource Cost (Optimal DB)</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simulation} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" hide />
              <YAxis tickFormatter={formatCurrency} {...axisProps} width={60} />
              <Tooltip {...tooltipProps} formatter={(val) => formatCurrency(val)} />
              <Area type="monotone" dataKey="infraCost" name="Optimal Infra Cost" stroke="rgba(234,231,224,0.4)" fill="rgba(234,231,224,0.04)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cash Flow/OpEx Graph */}
      <div className="border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative flex flex-col min-h-[220px]">
        <h3 className="text-[12px] font-medium text-[#EAE7E0] mb-4">Net Cash Allocation</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={simulation} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" hide />
              <YAxis tickFormatter={formatCurrency} {...axisProps} width={60} />
              <Tooltip {...tooltipProps} formatter={(val) => formatCurrency(val)} />
              <Bar dataKey="marketingSpend" name="Marketing Reinvestment" stackId="a" fill="rgba(234,231,224,0.15)" />
              <Bar dataKey="ownerCash" name="Founder Payout" stackId="a" fill="rgba(234,231,224,0.3)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderDataPipeline = () => {
    const eventsPerMonth = ordersPerClient * (1 + updatesPerOrder);
    const dataPerMonthGb = (eventsPerMonth * kbPerOrderEvent) / (1024 * 1024);
    const dailyEvents = Math.floor(eventsPerMonth / 30);

    const trafficData = Array.from({length: 24}, (_, i) => ({
       hour: `${i}:00`,
       events: Math.floor(dailyEvents/24 * (1 + Math.sin(i/3) * 0.5 + Math.random()*0.2))
    }));

    return (
       <div className="flex flex-col gap-5 h-full">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Monthly API Events" value={formatNumber(eventsPerMonth)} subtext={`Per Client (${ordersPerClient} orders)`} icon={Activity} />
            <MetricCard title="Payload Size" value={`${kbPerOrderEvent} KB`} subtext="Avg per event" icon={Database} />
            <MetricCard title="Monthly Ingestion" value={`${dataPerMonthGb.toFixed(2)} GB`} subtext="Hot storage per client" icon={Server} />
         </div>
         <div className="flex-1 border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative overflow-hidden flex flex-col">
            <h3 className="text-[13px] font-medium text-[#EAE7E0] mb-6">Real-time Data Flow (Single Client)</h3>
            
            {/* Pipeline Visual */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 w-full max-w-4xl mx-auto mt-4">
               <div className="flex flex-col items-center gap-3 w-32">
                  <div className="w-14 h-14 rounded-full bg-[#EAE7E0]/5 border border-[#EAE7E0]/10 flex items-center justify-center text-[#EAE7E0]">
                     <Search size={24} />
                  </div>
                  <div className="text-center">
                    <div className="text-[12px] font-medium text-[#EAE7E0]">POS Source</div>
                    <div className="text-[10px] text-[#A19D98]">{formatNumber(ordersPerClient)} cmds/mo</div>
                  </div>
               </div>

               <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#EAE7E0]/20 to-transparent relative hidden md:block">
                  <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] bg-[#161412] px-2 text-[#10B981] font-mono border border-[#EAE7E0]/10 rounded-full flex items-center gap-1">
                     <Activity size={10} /> Webhooks
                  </div>
               </div>

               <div className="flex flex-col items-center gap-3 w-32">
                  <div className="w-14 h-14 rounded-2xl bg-[#EAE7E0]/5 border border-[#EAE7E0]/10 flex items-center justify-center text-[#EAE7E0]">
                     <Cpu size={24} />
                  </div>
                  <div className="text-center">
                    <div className="text-[12px] font-medium text-[#EAE7E0]">Event Stream</div>
                    <div className="text-[10px] text-[#A19D98]">+{updatesPerOrder} updates/cmd</div>
                  </div>
               </div>

               <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#EAE7E0]/20 to-transparent relative hidden md:block">
                  <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-[10px] bg-[#161412] px-2 text-[#8B5CF6] font-mono border border-[#EAE7E0]/10 rounded-full flex items-center gap-1">
                     <ArrowRight size={10} /> Transform
                  </div>
               </div>

               <div className="flex flex-col items-center gap-3 w-32">
                  <div className="w-14 h-14 rounded-lg bg-[#EAE7E0]/5 border border-[#EAE7E0]/10 flex items-center justify-center text-[#EAE7E0]">
                     <Database size={24} />
                  </div>
                  <div className="text-center">
                    <div className="text-[12px] font-medium text-[#EAE7E0]">Data Warehouse</div>
                    <div className="text-[10px] text-[#A19D98]">{dataPerMonthGb.toFixed(2)} GB/mo</div>
                  </div>
               </div>
            </div>

            <h3 className="text-[12px] font-medium text-[#A19D98] mb-4 mt-auto">Simulated Daily Traffic (Events/Hour)</h3>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <Area type="monotone" dataKey="events" stroke="#EAE7E0" fill="rgba(234,231,224,0.05)" strokeWidth={2} />
                  <Tooltip contentStyle={{ backgroundColor: '#161412', borderColor: 'rgba(234,231,224,0.08)', borderRadius: '6px' }} itemStyle={{ color: 'rgba(234,231,224,0.9)', fontSize: '12px' }} labelStyle={{ display: 'none' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>
       </div>
    )
  };

  const renderOverview = () => (
    <div className="flex flex-col gap-5 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Year 5 MRR" value={formatCurrency(month60.revenue)} icon={DollarSign} highlight />
        <MetricCard title="Total Cash Out" value={formatCurrency(month60.cumulativeDraw)} subtext="5 Yr Accumulated" icon={Wallet} />
        <MetricCard title="Active Clients" value={formatNumber(month60.clients)} subtext={`${((month60.clients / tam) * 100).toFixed(1)}% of TAM`} icon={Users} />
        <MetricCard title="Monthly OpEx" value={formatCurrency(month60.totalOpEx)} subtext="Support & Base Costs" icon={Briefcase} />
      </div>
      <div className="flex-1 min-h-[300px] border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#EAE7E0]/[0.03] to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute top-5 left-5 z-10">
          <h3 className="text-[13px] font-medium text-[#EAE7E0]">Compounding Growth S-Curve</h3>
          <p className="text-[11px] text-[#A19D98] mt-0.5">60-month projection with market constraints</p>
        </div>
        <div className="w-full h-full mt-10">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={simulation} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,231,224,0.04)" vertical={false} />
              <XAxis dataKey="month" {...axisProps} dy={10} />
              <YAxis yAxisId="left" tickFormatter={formatCurrency} {...axisProps} dx={-10} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatNumber} {...axisProps} dx={10} />
              <Tooltip {...tooltipProps} formatter={(val, name) => [name === 'Clients' ? formatNumber(val) : formatCurrency(val), name]} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', color: '#A19D98', paddingBottom: '10px' }} iconType="circle" />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#EAE7E0" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#EAE7E0' }} />
              <Area yAxisId="left" type="monotone" dataKey="totalOpEx" name="OpEx" fill="rgba(234,231,224,0.03)" stroke="rgba(234,231,224,0.15)" strokeWidth={1} />
              <Area yAxisId="left" type="monotone" dataKey="ownerCash" name="Owner Cash" fill="rgba(234,231,224,0.06)" stroke="rgba(234,231,224,0.3)" strokeWidth={1} />
              <Line yAxisId="right" type="monotone" dataKey="clients" name="Clients" stroke="rgba(234,231,224,0.2)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderUnitEconomics = () => {
    const ltv = subscriptionPrice / (churnRate / 100);
    const grossMarginClient = subscriptionPrice - supportCostPerClient - (month60.infraCost / Math.max(1, month60.clients));
    const paybackMonths = month60.effectiveCac / Math.max(1, grossMarginClient);

    return (
      <div className="flex flex-col gap-5 h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Life Time Value" value={formatCurrency(ltv)} subtext={`Based on ${churnRate}% churn`} icon={Target} highlight />
          <MetricCard title="Effective CAC" value={formatCurrency(month60.effectiveCac)} subtext="Y5 saturated cost" icon={Activity} />
          <MetricCard title="LTV : CAC Ratio" value={`${(ltv / month60.effectiveCac).toFixed(1)}x`} subtext="Healthy SaaS > 3.0x" icon={Scale} />
          <MetricCard title="Payback Period" value={`${paybackMonths.toFixed(1)} mo`} subtext="Time to recover CAC" icon={RefreshCw} />
        </div>
        <div className="flex-1 min-h-[300px] border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative">
          <div className="absolute top-5 left-5 z-10">
            <h3 className="text-[13px] font-medium text-[#EAE7E0]">Marketing Spend Efficiency</h3>
            <p className="text-[11px] text-[#A19D98] mt-0.5">CAC evolution versus total spend & users</p>
          </div>
          <div className="w-full h-full mt-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simulation} {...chartProps}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,231,224,0.04)" vertical={false} />
                <XAxis dataKey="month" {...axisProps} dy={10} />
                <YAxis yAxisId="left" tickFormatter={formatCurrency} {...axisProps} dx={-10} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={formatNumber} {...axisProps} dx={10} />
                <Tooltip {...tooltipProps} formatter={(val, name) => [name === 'Active Clients' ? formatNumber(val) : formatCurrency(val), name]} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', color: '#A19D98', paddingBottom: '10px' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="marketingSpend" name="Marketing Spend" fill="rgba(234,231,224,0.1)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="effectiveCac" name="Effective CAC" stroke="#EAE7E0" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="clients" name="Active Clients" stroke="rgba(16,185,129,0.8)" strokeWidth={2} dot={false} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderInfrastructure = () => (
    <div className="flex flex-col gap-5 h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Supabase Est. (Y5)" value={formatCurrency(month60.supaCost)} icon={Database} highlight={month60.infraCost === month60.supaCost} />
        <MetricCard title="AWS Stack Est. (Y5)" value={formatCurrency(month60.awsCost)} icon={Cloud} highlight={month60.infraCost === month60.awsCost} />
        <MetricCard title="BigQuery Est. (Y5)" value={formatCurrency(month60.bqCost)} icon={BarChart3} highlight={month60.infraCost === month60.bqCost} />
      </div>
      <div className="flex-1 min-h-[300px] border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative">
        <div className="absolute top-5 left-5 z-10">
          <h3 className="text-[13px] font-medium text-[#EAE7E0]">Infrastructure Cost Scaling</h3>
          <p className="text-[11px] text-[#A19D98] mt-0.5">Comparing provider models at scale</p>
        </div>
        <div className="w-full h-full mt-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulation} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,231,224,0.04)" vertical={false} />
              <XAxis dataKey="month" {...axisProps} dy={10} />
              <YAxis tickFormatter={formatCurrency} {...axisProps} dx={-10} />
              <Tooltip {...tooltipProps} formatter={(val) => formatCurrency(val)} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', color: '#A19D98', paddingBottom: '10px' }} iconType="circle" />
              <Line type="monotone" dataKey="supaCost" name="Supabase" stroke="rgba(234,231,224,0.2)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="awsCost" name="AWS Stack" stroke="rgba(234,231,224,0.4)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="bqCost" name="BigQuery" stroke="rgba(234,231,224,0.6)" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="infraCost" name="Optimal Route" stroke="#EAE7E0" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#EAE7E0' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderCashFlow = () => (
    <div className="flex flex-col gap-5 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard title="Cumulative Revenue" value={formatCurrency(month60.cumulativeRevenue)} icon={DollarSign} />
        <MetricCard title="Total Founder Payout" value={formatCurrency(month60.cumulativeDraw)} icon={Wallet} highlight />
      </div>
      <div className="flex-1 min-h-[300px] border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 relative">
         <div className="absolute top-5 left-5 z-10">
          <h3 className="text-[13px] font-medium text-[#EAE7E0]">Cash Allocation Analysis</h3>
          <p className="text-[11px] text-[#A19D98] mt-0.5">Where every dollar goes</p>
        </div>
        <div className="w-full h-full mt-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simulation} {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,231,224,0.04)" vertical={false} />
              <XAxis dataKey="month" {...axisProps} dy={10} />
              <YAxis tickFormatter={formatCurrency} {...axisProps} dx={-10} />
              <Tooltip {...tooltipProps} formatter={(val) => formatCurrency(val)} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', color: '#A19D98', paddingBottom: '10px' }} iconType="circle" />
              <Area type="monotone" dataKey="totalOpEx" stackId="1" name="Operations" fill="rgba(234,231,224,0.04)" stroke="transparent" />
              <Area type="monotone" dataKey="infraCost" stackId="1" name="Infrastructure" fill="rgba(234,231,224,0.08)" stroke="transparent" />
              <Area type="monotone" dataKey="marketingSpend" stackId="1" name="Reinvested Marketing" fill="rgba(234,231,224,0.15)" stroke="transparent" />
              <Area type="monotone" dataKey="ownerCash" stackId="1" name="Owner Cash Out" fill="rgba(234,231,224,0.25)" stroke="transparent" />
              <Line type="monotone" dataKey="revenue" name="Topline Revenue" stroke="#EAE7E0" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderInteractiveWidget = (content, tabs = null, windowTitle = "simulation-engine.exe") => (
    <div className="w-full max-w-[1200px] mx-auto px-4 pb-16 z-20 relative animate-in fade-in duration-500">
      <div className="w-full h-[650px] bg-[#131110] rounded-2xl border border-[#EAE7E0]/[0.08] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        <div className="h-10 border-b border-[#EAE7E0]/[0.04] bg-[#0C0B0A]/30 flex items-center px-4 justify-between select-none">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EAE7E0]/20"></div>
            <div className="w-3 h-3 rounded-full bg-[#EAE7E0]/20"></div>
            <div className="w-3 h-3 rounded-full bg-[#EAE7E0]/20"></div>
          </div>
          <div className="text-[11px] text-[#A19D98]/50 font-mono tracking-wide absolute left-1/2 transform -translate-x-1/2">
            {windowTitle}
          </div>
          <div className="flex gap-2">
             <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 text-[#A19D98]/70 hover:text-[#EAE7E0] rounded transition-colors"
            >
              <Menu size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-shrink-0 bg-[#0C0B0A]/40 border-r border-[#EAE7E0]/[0.04] flex flex-col h-full transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full overflow-hidden absolute'}`}>
            {renderSidebarContent()}
          </div>

          <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent">
            {tabs && (
              <div className="h-10 border-b border-[#EAE7E0]/[0.04] flex items-center px-3 z-10 sticky top-0 bg-[#131110]/80 backdrop-blur-sm">
                {tabs}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5 z-10">
              <div className="max-w-6xl mx-auto h-full">
                {content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Shared Sidebar Content for Reusability ---
  const renderSidebarContent = () => (
    <>
      <div className="flex-1 overflow-y-auto pb-16 no-scrollbar">
        <ControlGroup title="Financial Strategy" icon={Wallet} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <InputRow label="Pricing" value={subscriptionPrice} onChange={setSubscriptionPrice} step={25} unit="$" />
            <InputRow label="Base CAC" value={cac} onChange={setCac} step={100} unit="$" />
            <InputRow label="Org. Grwth" value={organicGrowth} onChange={setOrganicGrowth} step={1} unit="/mo" />
            <InputRow label="Churn" value={churnRate} onChange={setChurnRate} step={0.5} unit="%" />
          </div>
          <div className="pt-1">
            <InputRow label="Owner Draw" value={ownerDrawPercent} onChange={setOwnerDrawPercent} step={5} unit="% net" max={100} />
          </div>
        </ControlGroup>

        <ControlGroup title="Constraints" icon={Briefcase} defaultOpen={true}>
          <div className="mb-2">
             <InputRow label="Addressable Market (TAM)" value={tam} onChange={setTam} step={1000} unit="stores" isInt />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <InputRow label="Max MoM" value={maxMomGrowth} onChange={setMaxMomGrowth} step={1} unit="%" max={100} />
            <InputRow label="Base OpEx" value={baseOpEx} onChange={setBaseOpEx} step={500} unit="$" />
          </div>
          <InputRow label="Support Cost/Client" value={supportCostPerClient} onChange={setSupportCostPerClient} step={10} unit="$" />
        </ControlGroup>

        <ControlGroup title="Activity Load" icon={Activity} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <InputRow label="Orders/Clnt" value={ordersPerClient} onChange={setOrdersPerClient} step={500} unit="/mo" isInt />
            <InputRow label="Updt/Order" value={updatesPerOrder} onChange={setUpdatesPerOrder} step={1} unit="qty" isInt />
            <InputRow label="Query/Clnt" value={analyticsQueriesPerClient} onChange={setAnalyticsQueriesPerClient} step={10} unit="/mo" isInt />
            <InputRow label="Data/Query" value={gbPerQuery} onChange={setGbPerQuery} step={0.05} unit="GB" />
          </div>
        </ControlGroup>

        <ControlGroup title="Supabase" icon={Database} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            <InputRow label="Pro Plan" value={supaBase} onChange={setSupaBase} unit="$" />
            <InputRow label="Compute" value={supaCompute} onChange={setSupaCompute} unit="$" />
          </div>
        </ControlGroup>
        
        <ControlGroup title="AWS" icon={Cloud} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            <InputRow label="RDS Base" value={awsRdsMonthly} onChange={setAwsRdsMonthly} unit="$" />
            <InputRow label="Lambda 1M" value={awsLambda1m} onChange={setAwsLambda1m} unit="$" step={0.01} />
          </div>
        </ControlGroup>
      </div>

      <div className="bg-[#0C0B0A] border-t border-[#EAE7E0]/[0.04] p-3">
        <button 
          onClick={handleReset}
          className="w-full py-2 bg-[#EAE7E0]/[0.02] hover:bg-[#EAE7E0]/[0.04] border border-[#EAE7E0]/[0.05] rounded text-[#A19D98] hover:text-[#EAE7E0] text-[12px] font-medium flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw size={13} />
          Reset Config
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(234,231,224,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(234,231,224,0.2); }
        .recharts-tooltip-cursor { stroke: rgba(234,231,224,0.1) !important; stroke-width: 1px !important; }
        body { background-color: #0C0B0A; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      `}</style>
      
      <div className="min-h-screen w-full bg-[#0C0B0A] text-[#EAE7E0] overflow-y-auto selection:bg-[#EAE7E0]/20 flex flex-col font-sans relative">
        
        {/* Global Sidebar Overlay (for non-whitepaper routes) */}
        <div className={`fixed inset-y-0 right-0 z-50 w-[280px] bg-[#0C0B0A] border-l border-[#EAE7E0]/[0.08] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isGlobalSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-14 border-b border-[#EAE7E0]/[0.04] flex items-center justify-between px-5">
            <span className="text-[13px] font-medium text-[#EAE7E0]">Simulation Engine Variables</span>
            <button onClick={() => setIsGlobalSidebarOpen(false)} className="text-[#A19D98] hover:text-[#EAE7E0] transition-colors focus:outline-none">
              <X size={16}/>
            </button>
          </div>
          {renderSidebarContent()}
        </div>
        {/* Global Overlay Backdrop */}
        {isGlobalSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" onClick={() => setIsGlobalSidebarOpen(false)}></div>
        )}

        {/* Top Navbar */}
        <nav className="w-full flex items-center justify-between px-8 py-0 bg-transparent z-40 absolute top-0">
          <div className="flex items-center gap-2">
            <Hexagon size={24} className="text-[#EAE7E0]" fill="currentColor" />
          </div>

          <div className="hidden md:flex items-center gap-10">
            <button 
              onClick={() => setActiveRoute('whitepaper')}
              className="text-[13px] font-medium text-[#A19D98] hover:text-[#EAE7E0] transition-colors py-5 focus:outline-none"
            >
              White Paper
            </button>
            <NavDropdown 
              title="Financial Statements" 
              onTitleClick={() => setActiveRoute('financials')}
              items={[
                { label: 'Financial Summary', onClick: () => setActiveRoute('financials') },
                { label: 'Income Statement', onClick: () => setActiveRoute('income') },
                { label: 'Balance Sheet', onClick: () => setActiveRoute('balance') },
                { label: 'Cash Flow Analysis', onClick: () => setActiveRoute('cashflow') }
              ]} 
            />
            <NavDropdown 
              title="Forecast Model" 
              onTitleClick={() => setActiveRoute('forecast_model')}
              items={[
                { label: 'Forecast Summary', onClick: () => setActiveRoute('forecast_model') },
                { label: 'CPU Usage', onClick: () => setActiveRoute('cpu_usage') },
                { label: 'Customer Acquisition', onClick: () => setActiveRoute('customer_acquisition') },
                { label: 'Data Pipeline', onClick: () => setActiveRoute('data_pipeline') }
              ]} 
            />
            <button 
              onClick={() => setActiveRoute('live_kpis')}
              className="text-[13px] font-medium text-[#A19D98] hover:text-[#EAE7E0] transition-colors py-5 flex items-center gap-1.5 focus:outline-none"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-0.5 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              Live KPI's
            </button>
          </div>

          <div className="flex items-center gap-4 w-[120px] justify-end">
            {activeRoute !== 'whitepaper' && activeRoute !== 'live_kpis' && activeRoute !== 'resources' && activeRoute !== 'tax_documents' && activeRoute !== 'roadmap' && (
              <button 
                onClick={() => setIsGlobalSidebarOpen(true)}
                className="flex items-center gap-2 text-[12px] font-medium text-[#EAE7E0] bg-[#EAE7E0]/[0.05] border border-[#EAE7E0]/10 px-3 py-1.5 rounded-full hover:bg-[#EAE7E0]/10 transition-colors focus:outline-none whitespace-nowrap"
              >
                <Settings2 size={14} /> Configure
              </button>
            )}
          </div>
        </nav>

        {/* Dynamic Route Rendering */}

        {activeRoute === 'whitepaper' && (
          <>
            {/* Hero Section */}
            <div className="w-full flex flex-col items-center justify-center pt-40 pb-16 px-6 relative z-10">
              <h1 className="text-5xl md:text-6xl lg:text-[72px] font-medium text-center tracking-tighter leading-none text-[#EAE7E0]">
                WhitePaper
              </h1>
            </div>

            {/* Abstract Section */}
            <article className="max-w-3xl mx-auto px-6 mb-16 text-[#A19D98] font-serif leading-relaxed text-[17px] text-justify space-y-6 relative z-20">
              <p>
                <strong className="text-[#EAE7E0] font-sans text-sm tracking-widest uppercase block mb-4">Abstract</strong>
                This paper presents a dynamic, constraints-based financial model for scaling an e-commerce analytics Software-as-a-Service (SaaS) platform. We introduce a continuous compounding simulation that integrates operational bottlenecks, Customer Acquisition Cost (CAC) market saturation, and precise cloud infrastructure economics across multiple database paradigms. By utilizing the interactive modeling environment below, stakeholders can observe the real-time degradation of marketing efficiency and the resultant S-curve of user acquisition, ultimately defining the optimal reinvestment flywheel for maximizing enterprise value and liquid founder payout over a 60-month horizon.
              </p>
              <div className="pt-2 flex justify-center md:justify-start">
                <button className="bg-[#EAE7E0] hover:bg-white text-[#0C0B0A] px-5 py-2.5 rounded-full text-[14px] font-sans font-medium transition-colors flex items-center gap-2 relative z-30 cursor-pointer">
                  <Download size={15} />
                  Download PDF
                </button>
              </div>
            </article>

            {/* OLD DEMO APP WIDGET CONTAINER WITH ARTWORK BACKGROUND */}
            <div className="relative w-full pt-8 pb-8">
              {/* Immersive Background Artwork */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1600px] h-[1000px] pointer-events-none z-0">
                <img 
                  src="https://images.unsplash.com/photo-1518623489648-a173ef7824f3?auto=format&fit=crop&w=2000&q=80" 
                  onError={(e) => e.target.style.display = 'none'}
                  alt="Landscape Art"
                  className="w-full h-full object-cover opacity-[0.35] grayscale contrast-125 brightness-150"
                />
                {/* Soft edge fades to blend into the main background */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B0A] via-transparent to-[#0C0B0A] opacity-100"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0C0B0A] via-transparent to-[#0C0B0A] opacity-100"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0C0B0A] via-[#0C0B0A]/10 to-[#0C0B0A] opacity-100"></div>
                <div className="absolute inset-0 bg-gradient-to-l from-[#0C0B0A] via-[#0C0B0A]/10 to-[#0C0B0A] opacity-100"></div>
              </div>

              <div className="relative z-10">
                {renderInteractiveWidget(
                  activeTab === 'overview' ? renderOverview() :
                  activeTab === 'economics' ? renderUnitEconomics() :
                  activeTab === 'infrastructure' ? renderInfrastructure() :
                  renderCashFlow(),
                  <div className="flex gap-1">
                    {[
                      { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                      { id: 'economics', icon: CandlestickChart, label: 'Economics' },
                      { id: 'infrastructure', icon: Server, label: 'Infrastructure' },
                      { id: 'cashflow', icon: DollarSign, label: 'Cash Flow' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-md transition-all whitespace-nowrap ${
                          activeTab === tab.id 
                            ? 'bg-[#EAE7E0]/[0.06] text-[#EAE7E0] font-medium' 
                            : 'text-[#A19D98] hover:text-[#EAE7E0] hover:bg-[#EAE7E0]/[0.02]'
                        }`}
                      >
                        <tab.icon size={12} className={activeTab === tab.id ? 'text-[#EAE7E0]' : 'text-[#A19D98]/70'} />
                        {tab.label}
                      </button>
                    ))}
                  </div>,
                  "simulation-engine.exe"
                )}
              </div>
            </div>

            {/* Academic One-Pager Section */}
            <article className="max-w-3xl mx-auto px-6 pb-16 pt-16 text-[#A19D98] font-serif leading-relaxed text-[17px] text-justify space-y-8 relative z-20">
              <section>
                <h2 className="text-[#EAE7E0] font-sans text-xl font-medium tracking-tight mb-4">1. Introduction</h2>
                <p className="mb-4">
                  The prevailing heuristic in Software-as-a-Service valuation relies heavily on unconstrained exponential growth models. However, when evaluating data-intensive applications such as e-commerce analytics, unit economics are intimately bound to infrastructural scaling ceilings and the logistical reality of market saturation.
                </p>
                <p>
                  By observing the simulation provided above, it becomes evident that a linear projection of marketing efficacy fails over a 60-month window. As the Total Addressable Market (TAM) is penetrated, the Effective Customer Acquisition Cost (CAC) undergoes exponential decay in efficiency, forcing the growth vector into a logistic S-curve. 
                </p>
              </section>

              <section>
                <h2 className="text-[#EAE7E0] font-sans text-xl font-medium tracking-tight mb-4">2. Methodology and Operational Limits</h2>
                <p className="mb-4">
                  To accurately reflect operational reality, a hard constraint—the Maximum Month-over-Month Growth Limit—is enforced. This serves as a proxy for the logistical limits of hiring sales personnel, expanding customer success teams, and safely managing database ingestion rates without downtime. 
                </p>
                <p>
                  Capital that cannot be efficiently deployed due to this operational bottleneck is retained as surplus cash, bolstering the Founder Draw metric rather than being wasted on saturated acquisition channels.
                </p>
              </section>

              <section>
                <h2 className="text-[#EAE7E0] font-sans text-xl font-medium tracking-tight mb-4">3. Database Infrastructure Parity</h2>
                <p className="mb-4">
                  Unlike traditional B2B SaaS, analytics platforms face severe Cost of Goods Sold (COGS) degradation as data velocity scales. The simulation evaluates three distinct architectural paradigms in real-time:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4 font-sans text-[15px]">
                  <li><strong className="text-[#EAE7E0]">Provisioned Relational (PostgreSQL):</strong> Exhibits a "staircase" cost function. It absorbs initial workload scaling at zero marginal cost until compute saturation requires provisioning heavy read-replicas.</li>
                  <li><strong className="text-[#EAE7E0]">Serverless Compute (AWS Lambda/SQS + Athena):</strong> Provides perfectly linear scaling and zero idle costs, but becomes prohibitively expensive at high sustained request volumes.</li>
                  <li><strong className="text-[#EAE7E0]">Data Warehouse (BigQuery):</strong> Optimizes specifically for the OLAP queries, charging purely per Terabyte scanned, largely ignoring ingest velocities.</li>
                </ul>
              </section>
            </article>

            {/* ChatGPT MCP Browser Demo Widget */}
            <div className="mb-16 relative z-20">
              <McpDemoWidget />
            </div>

            {/* Conclusion */}
            <article className="max-w-3xl mx-auto px-6 pb-32 text-[#A19D98] font-serif leading-relaxed text-[17px] text-justify space-y-8 relative z-20">
              <section>
                <h2 className="text-[#EAE7E0] font-sans text-xl font-medium tracking-tight mb-4">4. Conclusion</h2>
                <p>
                  Sustainable scaling requires a delicate equilibrium between operational expenditure, infrastructure architecture, and CAC inflation. As demonstrated by the interactive models and integration hooks, maximizing the Life Time Value to CAC ratio (LTV:CAC) and prioritizing early profitability over unconstrained growth yields a highly robust financial outcome and significant liquid capital generation over a 5-year lifecycle.
                </p>
              </section>
            </article>
          </>
        )}

        {activeRoute === 'forecast_model' && (
          <div className="pt-40 pb-8 w-full animate-in fade-in duration-500">
             <div className="mb-16 text-center px-6">
               <h1 className="text-5xl md:text-6xl font-medium text-[#EAE7E0] tracking-tighter mb-4">Forecast Summary</h1>
               <p className="text-[#A19D98] text-[17px] font-light max-w-2xl mx-auto leading-relaxed">A unified view of user acquisition, revenue generation, and resource scaling.</p>
             </div>
             {renderInteractiveWidget(renderMasterDashboard(), null, "forecast-summary.exe")}
          </div>
        )}

        {activeRoute === 'cpu_usage' && (
          <div className="pt-32 w-full animate-in fade-in duration-500">
             <div className="max-w-[1200px] mx-auto px-4 mb-8">
               <button onClick={() => setActiveRoute('forecast_model')} className="text-[#A19D98] hover:text-[#EAE7E0] flex items-center gap-2 text-[13px] mb-8 transition-colors focus:outline-none">
                  <ArrowRight size={14} className="rotate-180" /> Back to Forecast Summary
               </button>
               <h2 className="text-4xl font-medium text-[#EAE7E0] tracking-tight mb-2">CPU Usage & Resource Scaling</h2>
               <p className="text-[#A19D98] text-[15px]">Tech stack resource comparison and cost scaling across different infrastructure paradigms.</p>
             </div>
             {renderInteractiveWidget(renderInfrastructure(), null, "cpu-scaling-model.exe")}
             <article className="max-w-3xl mx-auto px-6 pb-32 text-[#A19D98] font-serif leading-relaxed text-[17px] text-justify space-y-6">
                <h2 className="text-[#EAE7E0] font-sans text-xl font-medium tracking-tight mb-4 mt-8">Resource Scaling Architecture</h2>
                <p>
                  As the active client base grows, infrastructure demands scale non-linearly across different architectural paradigms. The simulation above compares three distinct models: provisioned relational databases (Supabase/PostgreSQL), serverless compute stacks (AWS Lambda/SQS), and pure OLAP data warehouses (BigQuery).
                </p>
                <p>
                  Provisioned databases exhibit a stepped cost curve, requiring substantial vertical scaling (read-replicas) when CPU thresholds are breached during intensive analytical queries. Conversely, serverless and data warehouse models scale linearly with exact usage but impose higher baseline costs at pure transaction volume. Optimizing unit economics relies on intelligently routing OLTP data gathering and OLAP data analyzing workloads to their respective, most cost-efficient services.
                </p>
             </article>
          </div>
        )}

        {activeRoute === 'customer_acquisition' && (
          <div className="pt-32 w-full animate-in fade-in duration-500">
             <div className="max-w-[1200px] mx-auto px-4 mb-8">
               <button onClick={() => setActiveRoute('forecast_model')} className="text-[#A19D98] hover:text-[#EAE7E0] flex items-center gap-2 text-[13px] mb-8 transition-colors focus:outline-none">
                  <ArrowRight size={14} className="rotate-180" /> Back to Forecast Summary
               </button>
               <h2 className="text-4xl font-medium text-[#EAE7E0] tracking-tight mb-2">Customer Acquisition</h2>
               <p className="text-[#A19D98] text-[15px]">Simulation of customer acquisition efficiency and CAC degradation over time.</p>
             </div>
             {renderInteractiveWidget(renderUnitEconomics(), null, "acquisition-simulator.exe")}
             <article className="max-w-3xl mx-auto px-6 pb-32 text-[#A19D98] font-serif leading-relaxed text-[17px] text-justify space-y-6">
                <h2 className="text-[#EAE7E0] font-sans text-xl font-medium tracking-tight mb-4 mt-8">Acquisition Strategy Summary</h2>
                <p>
                  As modeled in the simulation above, the trajectory of customer acquisition is heavily influenced by the Total Addressable Market (TAM) constraint. In the early stages (Months 1-12), the low baseline CAC allows for highly efficient capital deployment, translating owner reinvestment directly into rapid linear growth.
                </p>
                <p>
                  However, as the platform captures a more significant percentage of the TAM, the Effective CAC begins an exponential curve upward. This dynamic reflects the increasing difficulty of reaching peripheral market segments and forces the active client count into a logistic S-curve. The strategic imperative is therefore to secure profitability before the Effective CAC outpaces the Customer Lifetime Value (LTV).
                </p>
             </article>
          </div>
        )}

        {activeRoute === 'data_pipeline' && (
          <div className="pt-32 w-full animate-in fade-in duration-500">
             <div className="max-w-[1200px] mx-auto px-4 mb-8">
               <button onClick={() => setActiveRoute('forecast_model')} className="text-[#A19D98] hover:text-[#EAE7E0] flex items-center gap-2 text-[13px] mb-8 transition-colors focus:outline-none">
                  <ArrowRight size={14} className="rotate-180" /> Back to Forecast Summary
               </button>
               <h2 className="text-4xl font-medium text-[#EAE7E0] tracking-tight mb-2">Data Pipeline Simulation</h2>
               <p className="text-[#A19D98] text-[15px]">Simulated data ingestion and processing flow for an average individual client.</p>
             </div>
             {renderInteractiveWidget(renderDataPipeline(), null, "pipeline-telemetry.exe")}
             <article className="max-w-3xl mx-auto px-6 pb-32 text-[#A19D98] font-serif leading-relaxed text-[17px] text-justify space-y-6">
                <h2 className="text-[#EAE7E0] font-sans text-xl font-medium tracking-tight mb-4 mt-8">Ingestion & Processing Architecture</h2>
                <p>
                  The diagram above illustrates the typical event flow for a single client integrated with the analytics platform. Based on the selected variables, each initial Point of Sale (POS) order triggers an initial payload, which is subsequently followed by multiple downstream state updates (e.g., fulfillment, shipping, delivery).
                </p>
                <p>
                  Because these events are highly variable throughout the day (visualized in the hourly traffic distribution), the ingestion pipeline must decouple immediate request handling from heavy database writes. Leveraging a scalable queue or event stream (such as Kafka or AWS SQS) ensures that traffic spikes during major retail events do not overwhelm the core Data Warehouse or relational databases, safely staging payloads for asynchronous transformation and storage.
                </p>
             </article>
          </div>
        )}

        {activeRoute === 'live_kpis' && (
          <div className="pt-28 pb-12 px-8 max-w-[1400px] mx-auto z-10 relative w-full animate-in fade-in duration-500 min-h-screen flex flex-col">
             
             {/* Header & Toggle */}
             <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 shrink-0 border-b border-[#EAE7E0]/[0.06] pb-4 min-h-[68px]">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)] shrink-0"></div>
                    <h1 className="text-3xl font-medium text-[#EAE7E0] tracking-tight">
                      {liveKpiView === 'agile' ? 'Agile Project Management' : 'Live Business Metrics'}
                    </h1>
                  </div>
                  <p className="text-[13px] text-[#A19D98] ml-5">
                    {liveKpiView === 'agile' ? 'Live telemetry connected to Jira Project Workspace' : 'Real-time production business growth indicators'}
                  </p>
                </div>
                
                {/* Stable Right Side Toggle area */}
                <div className="flex items-center justify-end gap-4 mt-4 md:mt-0 w-[350px]">
                  <div className="bg-[#161412] border border-[#EAE7E0]/[0.06] rounded-lg p-1 flex items-center shrink-0">
                    <button
                      onClick={() => setLiveKpiView('agile')}
                      className={`px-4 py-1.5 text-[12px] font-medium rounded-md transition-all focus:outline-none ${liveKpiView === 'agile' ? 'bg-[#EAE7E0]/10 text-[#EAE7E0]' : 'text-[#A19D98] hover:text-[#EAE7E0]'}`}
                    >
                      Project Agile
                    </button>
                    <button
                      onClick={() => setLiveKpiView('business')}
                      className={`px-4 py-1.5 text-[12px] font-medium rounded-md transition-all focus:outline-none ${liveKpiView === 'business' ? 'bg-[#EAE7E0]/10 text-[#EAE7E0]' : 'text-[#A19D98] hover:text-[#EAE7E0]'}`}
                    >
                      Business Metrics
                    </button>
                  </div>
                  {/* Badge container with fixed width/opacity to prevent layout shifts */}
                  <div className="w-[110px] flex flex-col items-end transition-all duration-300">
                    <span className={`text-[9px] text-[#A19D98] uppercase tracking-wider mb-1 mr-1 transition-opacity ${liveKpiView === 'agile' ? 'opacity-100' : 'opacity-0'}`}>Current</span>
                    <div className="text-[11px] text-[#EAE7E0] border border-[#EAE7E0]/10 px-3 py-1 rounded bg-[#161412] font-mono tracking-wider text-center w-full">
                      {liveKpiView === 'agile' ? 'SPRINT 4' : 'MONTH 6'}
                    </div>
                  </div>
                </div>
             </div>
             
             {/* --- AGILE VIEW --- */}
             {liveKpiView === 'agile' && (
               <>
                 {/* Top KPIs - Power BI Style Dense Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 shrink-0">
                    {[
                      { label: 'Pending Tasks', value: '12/45', subtext: 'Current Sprint', icon: ListTodo },
                      { label: 'Velocity Rate', value: '0.85', subtext: 'Story Points/Day', icon: TrendingUp },
                      { label: 'Sprint Progress', value: '82%', subtext: 'Points Burned', icon: Target },
                      { label: 'Open Issues', value: '23', subtext: 'Backlog & Sprint', icon: TerminalSquare },
                      { label: 'System Uptime', value: '99.99%', subtext: 'Rolling 30 Days', icon: Activity }
                    ].map((kpi, i) => (
                      <div key={i} className="bg-[#161412] border border-[#EAE7E0]/[0.06] rounded-lg p-4 flex flex-col justify-between h-[100px] min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-[10px] text-[#EAE7E0] uppercase tracking-wider font-medium truncate w-full">{kpi.label}</span>
                            <span className="text-[9px] text-[#A19D98] truncate w-full">{kpi.subtext}</span>
                          </div>
                          <kpi.icon size={14} className="text-[#EAE7E0]/50 shrink-0" />
                        </div>
                        <div className="text-2xl font-semibold text-[#EAE7E0] tracking-tight font-mono">
                          {kpi.value}
                        </div>
                      </div>
                    ))}
                 </div>

                 {/* Main Dashboard Area */}
                 <div className="grid grid-cols-1 gap-4 flex-1 min-h-0 mb-4">
                    
                    {/* Burndown Chart */}
                    <div className="border border-[#EAE7E0]/[0.06] rounded-lg bg-[#161412] p-5 relative flex flex-col flex-1 min-h-[300px]">
                      <h3 className="text-[13px] font-medium text-[#EAE7E0] mb-1">Week's Velocity & Burn Down</h3>
                      <p className="text-[11px] text-[#A19D98] mb-4">Story points remaining vs ideal trajectory</p>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={BURNDOWN_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,231,224,0.04)" vertical={false} />
                            <XAxis dataKey="day" stroke="rgba(234,231,224,0.1)" tick={{ fill: 'rgba(234,231,224,0.4)', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={5} />
                            <YAxis stroke="rgba(234,231,224,0.1)" tick={{ fill: 'rgba(234,231,224,0.4)', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip contentStyle={{ backgroundColor: '#161412', borderColor: 'rgba(234,231,224,0.08)', borderRadius: '6px' }} itemStyle={{ color: 'rgba(234,231,224,0.9)', fontSize: '11px' }} labelStyle={{ color: 'rgba(234,231,224,0.5)', fontSize: '10px' }} />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', color: '#A19D98', paddingBottom: '10px' }} iconType="circle" />
                            <Bar dataKey="remaining" name="Actual Remaining" fill="rgba(234,231,224,0.15)" radius={[2, 2, 0, 0]} barSize={40} />
                            <Line type="monotone" dataKey="ideal" name="Ideal Burn" stroke="#EAE7E0" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                 </div>

                 {/* Full Width Horizontal Jira Roadmap (Draggable) */}
                 <div className="border border-[#EAE7E0]/[0.06] rounded-xl bg-[#161412] p-5 flex flex-col">
                    <h3 className="text-[13px] font-medium text-[#EAE7E0] mb-1">Epic & Story Roadmap</h3>
                    <p className="text-[11px] text-[#A19D98] mb-4">Drag horizontally to explore sprint goals and epic completion.</p>
                    <div 
                      ref={roadmapRef}
                      onMouseDown={onRoadmapMouseDown}
                      onMouseLeave={onRoadmapMouseLeave}
                      onMouseUp={onRoadmapMouseUp}
                      onMouseMove={onRoadmapMouseMove}
                      className="flex overflow-x-auto flex-row gap-4 pb-2 no-scrollbar cursor-grab active:cursor-grabbing select-none"
                    >
                      {ROADMAP_DATA.map(sprint => (
                        <div key={sprint.id} className="min-w-[280px] max-w-[280px] bg-[#0C0B0A]/40 border border-[#EAE7E0]/[0.04] rounded-lg p-4 flex flex-col shrink-0 pointer-events-none">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[13px] font-medium text-[#EAE7E0]">{sprint.title}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider border ${
                              sprint.status === 'Completed' ? 'bg-[#EAE7E0]/10 text-[#EAE7E0] border-[#EAE7E0]/20' :
                              sprint.status === 'Current' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-[#EAE7E0]/5 text-[#A19D98] border-[#EAE7E0]/10'
                            }`}>{sprint.status}</span>
                          </div>
                          <p className="text-[11px] text-[#A19D98] leading-relaxed mb-6 min-h-[34px]">{sprint.goal}</p>
                          <div className="space-y-4 mt-auto">
                            {sprint.epics.map((epic, i) => (
                              <div key={i}>
                                <div className="flex justify-between text-[10px] mb-1.5">
                                  <span className="text-[#EAE7E0]/80 truncate mr-2">{epic.name}</span>
                                  <span className="text-[#A19D98] font-mono shrink-0">{epic.progress}% ({epic.stories} st)</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#161412] rounded-full overflow-hidden border border-[#EAE7E0]/5">
                                  <div className={`h-full rounded-full ${sprint.status === 'Completed' ? 'bg-[#EAE7E0]/60' : sprint.status === 'Current' ? 'bg-[#EAE7E0]' : 'bg-[#EAE7E0]/20'}`} style={{width: `${epic.progress}%`}}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               </>
             )}

             {/* --- BUSINESS METRICS VIEW --- */}
             {liveKpiView === 'business' && (
               <>
                 {/* Top KPIs - Identical Grid Layout */}
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 shrink-0">
                    {[
                      { label: 'Live MRR', value: 'N/A', subtext: 'Current Run Rate', icon: DollarSign },
                      { label: 'Active Clients', value: '1', subtext: 'Live in Production', icon: Users },
                      { label: 'Avg Customer LTV', value: 'N/A', subtext: 'Projected Value', icon: Target },
                      { label: 'Effective CAC', value: 'N/A', subtext: 'Current Acquisition Cost', icon: Activity },
                      { label: 'Net Retention Rate', value: `102.5%`, subtext: 'Revenue Expansion', icon: Percent }
                    ].map((kpi, i) => (
                      <div key={i} className="bg-[#161412] border border-[#EAE7E0]/[0.06] rounded-lg p-4 flex flex-col justify-between h-[100px] min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-[10px] text-[#EAE7E0] uppercase tracking-wider font-medium truncate w-full">{kpi.label}</span>
                            <span className="text-[9px] text-[#A19D98] truncate w-full">{kpi.subtext}</span>
                          </div>
                          <kpi.icon size={14} className="text-[#EAE7E0]/50 shrink-0" />
                        </div>
                        <div className="text-2xl font-semibold text-[#EAE7E0] tracking-tight font-mono">
                          {kpi.value}
                        </div>
                      </div>
                    ))}
                 </div>

                 {/* Main Dashboard Area */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                    
                    {/* Left Column (Spans 2) - MRR & Clients */}
                    <div className="col-span-2 border border-[#EAE7E0]/[0.06] rounded-lg bg-[#161412] p-5 relative flex flex-col min-h-[300px]">
                      <h3 className="text-[13px] font-medium text-[#EAE7E0] mb-1">Trailing 6-Month Growth</h3>
                      <p className="text-[11px] text-[#A19D98] mb-6">Live MRR and Active User scaling</p>
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={liveBusinessData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,231,224,0.04)" vertical={false} />
                            <XAxis dataKey="month" stroke="rgba(234,231,224,0.1)" tick={{ fill: 'rgba(234,231,224,0.4)', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={5} />
                            <YAxis yAxisId="left" stroke="rgba(234,231,224,0.1)" tickFormatter={formatCurrency} tick={{ fill: 'rgba(234,231,224,0.4)', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} />
                            <YAxis yAxisId="right" orientation="right" stroke="rgba(234,231,224,0.1)" tickFormatter={formatNumber} tick={{ fill: 'rgba(234,231,224,0.4)', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#161412', borderColor: 'rgba(234,231,224,0.08)', borderRadius: '6px' }} itemStyle={{ color: 'rgba(234,231,224,0.9)', fontSize: '11px' }} labelStyle={{ color: 'rgba(234,231,224,0.5)', fontSize: '10px' }} formatter={(val, name) => [name === 'Clients' ? formatNumber(val) : formatCurrency(val), name]} />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '10px', color: '#A19D98', paddingBottom: '10px' }} iconType="circle" />
                            <Area yAxisId="left" type="monotone" dataKey="mrr" name="MRR" fill="rgba(234,231,224,0.08)" stroke="transparent" />
                            <Line yAxisId="left" type="monotone" dataKey="mrr" name="MRR" stroke="#EAE7E0" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#EAE7E0' }} />
                            <Line yAxisId="right" type="monotone" dataKey="clients" name="Clients" stroke="rgba(234,231,224,0.3)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-span-1 flex flex-col gap-4">
                      {/* Infra Margin Chart */}
                      <div className="border border-[#EAE7E0]/[0.06] rounded-lg bg-[#161412] p-5 relative flex flex-col flex-1 min-h-[190px]">
                        <h3 className="text-[13px] font-medium text-[#EAE7E0] mb-1">Infrastructure Load</h3>
                        <p className="text-[11px] text-[#A19D98] mb-4">Revenue vs DB Cost</p>
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={liveBusinessData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                              <XAxis dataKey="month" hide />
                              <YAxis tickFormatter={formatCurrency} stroke="rgba(234,231,224,0.1)" tick={{ fill: 'rgba(234,231,224,0.4)', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} />
                              <Tooltip contentStyle={{ backgroundColor: '#161412', borderColor: 'rgba(234,231,224,0.08)', borderRadius: '6px' }} itemStyle={{ color: 'rgba(234,231,224,0.9)', fontSize: '11px' }} formatter={(val) => formatCurrency(val)} />
                              <Area type="monotone" dataKey="mrr" name="Revenue" fill="rgba(234,231,224,0.05)" stroke="transparent" />
                              <Area type="monotone" dataKey="infra" name="DB Cost" fill="rgba(234,231,224,0.3)" stroke="#EAE7E0" strokeWidth={1} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Marketing Spend Chart */}
                      <div className="border border-[#EAE7E0]/[0.06] rounded-lg bg-[#161412] p-5 relative flex flex-col flex-1 min-h-[190px]">
                        <h3 className="text-[13px] font-medium text-[#EAE7E0] mb-1">Marketing Reinvestment</h3>
                        <p className="text-[11px] text-[#A19D98] mb-4">Capital deployed for acquisition</p>
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={liveBusinessData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                              <XAxis dataKey="month" hide />
                              <YAxis tickFormatter={formatCurrency} stroke="rgba(234,231,224,0.1)" tick={{ fill: 'rgba(234,231,224,0.4)', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} />
                              <Tooltip cursor={{fill: 'rgba(234,231,224,0.03)'}} contentStyle={{ backgroundColor: '#161412', borderColor: 'rgba(234,231,224,0.08)', borderRadius: '6px' }} itemStyle={{ color: 'rgba(234,231,224,0.9)', fontSize: '11px' }} formatter={(val) => formatCurrency(val)} />
                              <Bar dataKey="marketing" name="Marketing Spend" fill="rgba(234,231,224,0.15)" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                 </div>
               </>
             )}

          </div>
        )}

        {activeRoute === 'resources' && (
          <div className="pt-40 pb-32 px-6 max-w-6xl mx-auto z-10 relative w-full animate-in fade-in duration-500">
             <h1 className="text-5xl md:text-6xl font-medium text-[#EAE7E0] tracking-tighter mb-4 text-center">Resources</h1>
             <p className="text-[#A19D98] text-[17px] mb-16 text-center max-w-2xl mx-auto font-light leading-relaxed">
               Company documents, future roadmaps, and compliance materials.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <StatementWidget title="tax-documents.pdf" type="placeholder" isPlaceholder={true} onClick={() => setActiveRoute('tax_documents')} />
                <StatementWidget title="product-roadmap.md" type="placeholder" isPlaceholder={true} onClick={() => setActiveRoute('roadmap')} />
             </div>
          </div>
        )}

        {activeRoute === 'tax_documents' && (
           <StatementViewTemplate 
              title="Tax Documents" 
              subtitle="Annual filings and compliance material" 
              columns={[]} 
              onBack={() => setActiveRoute('resources')}
              rows={[
                { label: 'Data synchronization pending. Check back later.', values: [], isHeader: true }
              ]} 
           />
        )}

        {activeRoute === 'roadmap' && (
           <StatementViewTemplate 
              title="Product Road Map" 
              subtitle="Future feature timeline and deployment schedule" 
              columns={[]} 
              onBack={() => setActiveRoute('resources')}
              rows={[
                { label: 'Q3/Q4 Planning in progress. Check back later.', values: [], isHeader: true }
              ]} 
           />
        )}

        {activeRoute === 'financials' && (
          <div className="pt-40 pb-32 px-6 max-w-6xl mx-auto z-10 relative w-full animate-in fade-in duration-500">
             <h1 className="text-5xl md:text-6xl font-medium text-[#EAE7E0] tracking-tighter mb-4 text-center">Financial Statements</h1>
             <p className="text-[#A19D98] text-[17px] mb-16 text-center max-w-2xl mx-auto font-light leading-relaxed">
               5-year forecasted financial models driven dynamically by the active constraints of the simulation engine.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col gap-5">
                  <StatementWidget title="income-statement.csv" type="income" data={yearlyData} onClick={() => setActiveRoute('income')} />
                  <div className="px-1">
                    <h3 className="text-[#EAE7E0] text-[14px] font-medium mb-1.5">Income Statement</h3>
                    <p className="text-[#A19D98] text-[13px] leading-relaxed">
                      Tracks top-line revenue against variable cloud infrastructure costs (COGS) and operational scaling expenses to calculate net profitability.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <StatementWidget title="balance-sheet.csv" type="balance" data={yearlyData} onClick={() => setActiveRoute('balance')} />
                  <div className="px-1">
                    <h3 className="text-[#EAE7E0] text-[14px] font-medium mb-1.5">Balance Sheet</h3>
                    <p className="text-[#A19D98] text-[13px] leading-relaxed">
                      Models the accumulation of enterprise assets and retained earnings over 60 months, demonstrating capital retention and distributions.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-5">
                  <StatementWidget title="cash-flow.csv" type="cashflow" data={yearlyData} onClick={() => setActiveRoute('cashflow')} />
                  <div className="px-1">
                    <h3 className="text-[#EAE7E0] text-[14px] font-medium mb-1.5">Cash Flow Analysis</h3>
                    <p className="text-[#A19D98] text-[13px] leading-relaxed">
                      Details the liquidity profile of the SaaS operation, contrasting pure cash from operations against cash extracted via founder payouts.
                    </p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {activeRoute === 'income' && (
           <StatementViewTemplate 
              title="Income Statement" 
              subtitle="5-Year Consolidated P&L Forecast" 
              columns={yearlyData.map(d => d.year)} 
              onBack={() => setActiveRoute('financials')}
              rows={[
                { label: 'Top Line Revenue', values: yearlyData.map(d => d.revenue) },
                { label: 'Cost of Goods Sold (Infra)', values: yearlyData.map(d => d.cogs), indent: true },
                { label: 'Gross Profit', values: yearlyData.map(d => d.grossProfit), isTotal: true },
                { label: 'Gross Margin %', values: yearlyData.map(d => (d.grossProfit / d.revenue) * 100 || 0), format: 'percent' },
                { isSpacer: true },
                { label: 'Operating Expenses', values: yearlyData.map(() => null), isHeader: true }, 
                { label: 'Base OpEx & Support', values: yearlyData.map(d => d.baseAndSupportOpex), indent: true },
                { label: 'Sales & Marketing', values: yearlyData.map(d => d.marketingSpend), indent: true },
                { label: 'Total Operating Expenses', values: yearlyData.map(d => d.totalOpex), isTotal: true },
                { isSpacer: true },
                { label: 'Net Income', values: yearlyData.map(d => d.netIncome), isTotal: true },
                { label: 'Net Margin %', values: yearlyData.map(d => (d.netIncome / d.revenue) * 100 || 0), format: 'percent' },
              ]} 
           />
        )}

        {activeRoute === 'balance' && (
           <StatementViewTemplate 
              title="Balance Sheet" 
              subtitle="End of Period Forecast (100% Cash Sweep Distribution Model)" 
              columns={yearlyData.map(d => d.year)} 
              onBack={() => setActiveRoute('financials')}
              rows={[
                { label: 'Assets', values: yearlyData.map(() => null), isHeader: true }, 
                { label: 'Cash & Equivalents', values: yearlyData.map(() => 0), indent: true },
                { label: 'Total Assets', values: yearlyData.map(() => 0), isTotal: true },
                { isSpacer: true },
                { label: 'Liabilities', values: yearlyData.map(() => null), isHeader: true },
                { label: 'Total Liabilities', values: yearlyData.map(() => 0), isTotal: true },
                { isSpacer: true },
                { label: 'Shareholder Equity', values: yearlyData.map(() => null), isHeader: true },
                { label: 'Retained Earnings', values: yearlyData.map(() => 0), indent: true }, 
                { label: 'Total Equity', values: yearlyData.map(() => 0), isTotal: true },
                { isSpacer: true },
                { label: 'Memorandum Accounts', values: yearlyData.map(() => null), isHeader: true },
                { label: 'Cumulative Distributed Capital', values: yearlyData.map(d => d.cumulativeDraw), indent: true, isTotal: true },
              ]} 
           />
        )}

        {activeRoute === 'cashflow' && (
           <StatementViewTemplate 
              title="Statement of Cash Flows" 
              subtitle="5-Year Liquidity & Distribution Analysis" 
              columns={yearlyData.map(d => d.year)} 
              onBack={() => setActiveRoute('financials')}
              rows={[
                { label: 'Cash Flows from Operating Activities', values: yearlyData.map(() => null), isHeader: true },
                { label: 'Net Income', values: yearlyData.map(d => d.netIncome), indent: true },
                { label: 'Net Cash from Operations', values: yearlyData.map(d => d.netIncome), isTotal: true },
                { isSpacer: true },
                { label: 'Cash Flows from Investing Activities', values: yearlyData.map(() => null), isHeader: true },
                { label: 'Capital Expenditures', values: yearlyData.map(() => 0), indent: true },
                { label: 'Net Cash from Investing', values: yearlyData.map(() => 0), isTotal: true },
                { isSpacer: true },
                { label: 'Cash Flows from Financing Activities', values: yearlyData.map(() => null), isHeader: true },
                { label: 'Distributions to Owners', values: yearlyData.map(d => -d.ownerDraw), indent: true },
                { label: 'Net Cash from Financing', values: yearlyData.map(d => -d.ownerDraw), isTotal: true },
                { isSpacer: true },
                { label: 'Net Change in Cash', values: yearlyData.map(d => d.netChangeInCash), isTotal: true },
              ]} 
           />
        )}

        <Footer setActiveRoute={setActiveRoute} />
      </div>
    </>
  );
}
