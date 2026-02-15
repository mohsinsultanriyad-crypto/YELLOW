
import React, { useState, useEffect, useRef } from 'react';
import { User, Shift, Leave, SitePost, AdvanceRequest, Announcement } from './types';
import { MOCK_WORKERS, MOCK_ADMIN } from './constants';
import WorkerApp from './components/WorkerApp';
import AdminApp from './components/AdminApp';
import Login from './components/Login';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fw_currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [posts, setPosts] = useState<SitePost[]>([]);
  const [workers, setWorkers] = useState<User[]>(MOCK_WORKERS);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const saveTimer = useRef<number | null>(null);

  // Load from backend (fallback to localStorage if backend unavailable)
  // Polling logic added below
  useEffect(() => {
    let mounted = true;
    let pollingInterval: number | null = null;
    let isFetching = false;

    const load = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const res = await fetch(`${API_BASE}/api/data`);
        if (!res.ok) throw new Error('no backend');
        const data = await res.json();
        if (!mounted) return;
        // Only update state if data differs
        if (data.shifts && JSON.stringify(data.shifts) !== JSON.stringify(shifts)) setShifts(data.shifts);
        if (data.leaves && JSON.stringify(data.leaves) !== JSON.stringify(leaves)) setLeaves(data.leaves);
        if (data.posts && JSON.stringify(data.posts) !== JSON.stringify(posts)) setPosts(data.posts);
        if (data.workers && data.workers.length && JSON.stringify(data.workers) !== JSON.stringify(workers)) setWorkers(data.workers);
        if (data.advances && JSON.stringify(data.advances) !== JSON.stringify(advanceRequests)) setAdvanceRequests(data.advances);
        if (data.announcements && JSON.stringify(data.announcements) !== JSON.stringify(announcements)) setAnnouncements(data.announcements);
      } catch (err) {
        // Fallback to localStorage for local dev
        const savedShifts = localStorage.getItem('fw_shifts');
        const savedLeaves = localStorage.getItem('fw_leaves');
        const savedPosts = localStorage.getItem('fw_posts');
        const savedWorkers = localStorage.getItem('fw_workers');
        const savedAdvance = localStorage.getItem('fw_advance');
        const savedAnnouncements = localStorage.getItem('fw_announcements');
        if (savedShifts && JSON.stringify(JSON.parse(savedShifts)) !== JSON.stringify(shifts)) setShifts(JSON.parse(savedShifts));
        if (savedLeaves && JSON.stringify(JSON.parse(savedLeaves)) !== JSON.stringify(leaves)) setLeaves(JSON.parse(savedLeaves));
        if (savedPosts && JSON.stringify(JSON.parse(savedPosts)) !== JSON.stringify(posts)) setPosts(JSON.parse(savedPosts));
        if (savedWorkers && JSON.stringify(JSON.parse(savedWorkers)) !== JSON.stringify(workers)) setWorkers(JSON.parse(savedWorkers));
        if (savedAdvance && JSON.stringify(JSON.parse(savedAdvance)) !== JSON.stringify(advanceRequests)) setAdvanceRequests(JSON.parse(savedAdvance));
        if (savedAnnouncements && JSON.stringify(JSON.parse(savedAnnouncements)) !== JSON.stringify(announcements)) setAnnouncements(JSON.parse(savedAnnouncements));
      } finally {
        if (mounted) setIsLoaded(true);
        isFetching = false;
      }
    };

    // Initial load
    load();

    // Setup polling if user is logged in
    if (currentUser) {
      const intervalMs = currentUser.role === 'admin' ? 3000 : 5000;
      pollingInterval = window.setInterval(load, intervalMs);
    }

    return () => {
      mounted = false;
      if (pollingInterval) window.clearInterval(pollingInterval);
    };
  }, [currentUser]);

  // Save sync to backend (debounced); skip until loaded
  useEffect(() => {
    if (!isLoaded) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await fetch(`${API_BASE}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shifts, leaves, posts, workers, advances: advanceRequests, announcements })
        });
      } catch (err) {
        // If offline, persist to localStorage as temporary fallback
        localStorage.setItem('fw_shifts', JSON.stringify(shifts));
        localStorage.setItem('fw_leaves', JSON.stringify(leaves));
        localStorage.setItem('fw_posts', JSON.stringify(posts));
        localStorage.setItem('fw_workers', JSON.stringify(workers));
        localStorage.setItem('fw_advance', JSON.stringify(advanceRequests));
        localStorage.setItem('fw_announcements', JSON.stringify(announcements));
      }
    }, 800) as unknown as number;
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [isLoaded, shifts, leaves, posts, workers, advanceRequests, announcements]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('fw_currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fw_currentUser');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} workers={workers} />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden flex flex-col">
      {currentUser.role === 'worker' ? (
        <WorkerApp 
          user={currentUser} 
          shifts={shifts} 
          setShifts={setShifts} 
          leaves={leaves} 
          setLeaves={setLeaves}
          posts={posts}
          setPosts={setPosts}
          advanceRequests={advanceRequests}
          setAdvanceRequests={setAdvanceRequests}
          announcements={announcements}
          onLogout={handleLogout}
        />
      ) : (
        <AdminApp 
          user={currentUser} 
          shifts={shifts} 
          setShifts={setShifts} 
          leaves={leaves} 
          setLeaves={setLeaves}
          workers={workers}
          setWorkers={setWorkers}
          posts={posts}
          setPosts={setPosts}
          advanceRequests={advanceRequests}
          setAdvanceRequests={setAdvanceRequests}
          announcements={announcements}
          setAnnouncements={setAnnouncements}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
