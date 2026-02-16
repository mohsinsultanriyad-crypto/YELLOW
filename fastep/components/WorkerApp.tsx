
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from '../types';
import WorkerDashboard from './WorkerDashboard';
import WorkerHistory from './WorkerHistory';
import SiteFeed from './SiteFeed';
import Profile from './Profile';
import { LayoutDashboard, History, Rss, User as UserIcon, ShieldCheck } from 'lucide-react';
import { translations, Language } from '../translations';

interface WorkerAppProps {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: Leave[];
  setLeaves: React.Dispatch<React.SetStateAction<Leave[]>>;
  posts: SitePost[];
  setPosts: React.Dispatch<React.SetStateAction<SitePost[]>>;
  advanceRequests: AdvanceRequest[];
  setAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>>;
  announcements: Announcement[];
  workers: User[];
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const WorkerApp: React.FC<WorkerAppProps> = ({ 
  user, shifts, setShifts, leaves, setLeaves, posts, setPosts, 
  advanceRequests, setAdvanceRequests, announcements, workers, onLogout,
  language, setLanguage
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'feed' | 'profile' | 'approvals'>('dashboard');
  const [hasNewOT, setHasNewOT] = useState(false);
  const prevCountRef = useRef(0);

  const t = translations[language];

  const workerShifts = useMemo(() => shifts.filter(s => s.workerId === user.id), [shifts, user.id]);
  const workerLeaves = useMemo(() => leaves.filter(l => l.workerId === user.id), [leaves, user.id]);
  const workerAdvances = useMemo(() => advanceRequests.filter(r => r.workerId === user.id), [advanceRequests, user.id]);

  const pendingOTCount = useMemo(() => {
    if (user.role !== 'supervisor') return 0;
    return shifts.filter(s => s.supervisorId === user.id && s.otStatus === 'pending').length;
  }, [shifts, user.id, user.role]);

  // Notification Sound & Badge logic
  useEffect(() => {
    if (user.role === 'supervisor') {
      if (pendingOTCount > prevCountRef.current) {
        setHasNewOT(true);
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
          console.warn('Audio feedback failed', e);
        }
      }
      prevCountRef.current = pendingOTCount;
    }
  }, [pendingOTCount, user.role]);

  useEffect(() => {
    if (activeTab === 'approvals') {
      setHasNewOT(false);
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'dashboard' && (
          <WorkerDashboard 
            user={user} 
            shifts={shifts} 
            setShifts={setShifts} 
            leaves={leaves}
            advanceRequests={workerAdvances}
            announcements={announcements}
            workers={workers}
            language={language}
          />
        )}
        {activeTab === 'approvals' && user.role === 'supervisor' && (
          <WorkerDashboard 
            user={user} 
            shifts={shifts} 
            setShifts={setShifts} 
            leaves={leaves}
            advanceRequests={workerAdvances}
            announcements={announcements}
            workers={workers}
            viewMode="approvals"
            language={language}
          />
        )}
        {activeTab === 'history' && (
          <WorkerHistory 
            user={user} 
            shifts={workerShifts} 
            leaves={workerLeaves} 
            setLeaves={setLeaves}
            advanceRequests={workerAdvances} 
            language={language}
          />
        )}
        {activeTab === 'feed' && (
          <SiteFeed user={user} posts={posts} setPosts={setPosts} language={language} />
        )}
        {activeTab === 'profile' && (
          <Profile 
            user={user} 
            onLogout={onLogout} 
            leaves={leaves} 
            setLeaves={setLeaves} 
            advanceRequests={advanceRequests}
            setAdvanceRequests={setAdvanceRequests}
            language={language}
            setLanguage={setLanguage}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-nav px-4 py-3 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}><LayoutDashboard size={22} /><span className="text-[10px] font-medium">{t.dashboard}</span></button>
        
        {user.role === 'supervisor' && (
          <button onClick={() => setActiveTab('approvals')} className={`relative flex flex-col items-center gap-1 transition-colors ${activeTab === 'approvals' ? 'text-amber-600' : 'text-gray-400'}`}>
            <ShieldCheck size={22} />
            <span className="text-[10px] font-medium">OT</span>
            {hasNewOT && pendingOTCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {pendingOTCount}
              </span>
            )}
          </button>
        )}
        
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-blue-600' : 'text-gray-400'}`}><History size={22} /><span className="text-[10px] font-medium">{t.history}</span></button>
        <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-blue-600' : 'text-gray-400'}`}><Rss size={22} /><span className="text-[10px] font-medium">{t.feed}</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}><UserIcon size={22} /><span className="text-[10px] font-medium">{t.profile}</span></button>
      </nav>
    </div>
  );
};

export default WorkerApp;
