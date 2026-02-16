
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from '../types';
import AdminDashboard from './AdminDashboard';
import AdminWorkerList from './AdminWorkerList';
import SiteFeed from './SiteFeed';
import Profile from './Profile';
import AdminMonthlyReport from './AdminMonthlyReport';
import { LayoutDashboard, Users, Rss, User as UserIcon, FileSpreadsheet } from 'lucide-react';
import { translations, Language } from '../translations';

interface AdminAppProps {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: Leave[];
  setLeaves: React.Dispatch<React.SetStateAction<Leave[]>>;
  workers: User[];
  setWorkers: React.Dispatch<React.SetStateAction<User[]>>;
  posts: SitePost[];
  setPosts: React.Dispatch<React.SetStateAction<SitePost[]>>;
  advanceRequests: AdvanceRequest[];
  setAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const AdminApp: React.FC<AdminAppProps> = ({ 
  user, shifts, setShifts, leaves, setLeaves, workers, setWorkers, posts, setPosts, 
  advanceRequests, setAdvanceRequests, announcements, setAnnouncements, onLogout,
  language, setLanguage
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workers' | 'reports' | 'feed' | 'profile'>('dashboard');
  const [hasNewAction, setHasNewAction] = useState(false);
  const prevActionCountRef = useRef(0);

  const t = translations[language];

  const pendingActionCount = useMemo(() => {
    const pendingAdvances = advanceRequests.filter(r => r.status === 'pending').length;
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const pendingAttendance = shifts.filter(s => s.status === 'pending' && !s.isApproved).length;
    return pendingAdvances + pendingLeaves + pendingAttendance;
  }, [shifts, leaves, advanceRequests]);

  useEffect(() => {
    if (pendingActionCount > prevActionCountRef.current) {
      setHasNewAction(true);
    }
    prevActionCountRef.current = pendingActionCount;
  }, [pendingActionCount]);

  useEffect(() => {
    if (activeTab === 'dashboard') setHasNewAction(false);
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'dashboard' && (
          <AdminDashboard 
            shifts={shifts} setShifts={setShifts} 
            leaves={leaves} setLeaves={setLeaves} 
            workers={workers} advanceRequests={advanceRequests} setAdvanceRequests={setAdvanceRequests}
            announcements={announcements} setAnnouncements={setAnnouncements}
          />
        )}
        {activeTab === 'workers' && (
          <AdminWorkerList workers={workers} setWorkers={setWorkers} shifts={shifts} leaves={leaves} advanceRequests={advanceRequests} />
        )}
        {activeTab === 'reports' && (
          <AdminMonthlyReport workers={workers} shifts={shifts} leaves={leaves} advanceRequests={advanceRequests} />
        )}
        {activeTab === 'feed' && (
          <SiteFeed user={user} posts={posts} setPosts={setPosts} language={language} />
        )}
        {activeTab === 'profile' && (
          <Profile user={user} onLogout={onLogout} language={language} setLanguage={setLanguage} />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto glass-nav px-4 py-3 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`relative flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[9px] font-black uppercase">{t.home}</span>
          {hasNewAction && pendingActionCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">{pendingActionCount}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('workers')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'workers' ? 'text-blue-600' : 'text-gray-400'}`}><Users size={20} /><span className="text-[9px] font-black uppercase">{t.workers}</span></button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'reports' ? 'text-green-600' : 'text-gray-400'}`}><FileSpreadsheet size={20} /><span className="text-[9px] font-black uppercase">{t.reports}</span></button>
        <button onClick={() => setActiveTab('feed')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-blue-600' : 'text-gray-400'}`}><Rss size={20} /><span className="text-[9px] font-black uppercase">{t.feed}</span></button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}><UserIcon size={20} /><span className="text-[9px] font-black uppercase">{t.profile}</span></button>
      </nav>
    </div>
  );
};

export default AdminApp;
