
import React, { useState, useMemo } from 'react';
import { User, Shift, Leave, AdvanceRequest, Announcement } from '../types';
import { Users, AlertCircle, CheckCircle2, X, Calendar, Wallet, Trophy, Megaphone, Bell, CheckCircle, AlertTriangle, ShieldCheck, Zap, XCircle, Info, ArrowRight, Hourglass, DollarSign } from 'lucide-react';

interface AdminDashboardProps {
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: Leave[];
  setLeaves: React.Dispatch<React.SetStateAction<Leave[]>>;
  workers: User[];
  advanceRequests: AdvanceRequest[];
  setAdvanceRequests: React.Dispatch<React.SetStateAction<AdvanceRequest[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  shifts, setShifts, leaves, setLeaves, workers, advanceRequests, setAdvanceRequests, announcements, setAnnouncements 
}) => {
  const [showPresentModal, setShowPresentModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnounce, setNewAnnounce] = useState('');
  const [announcePriority, setAnnouncePriority] = useState<'low' | 'high'>('low');
  const [schedulingReqId, setSchedulingReqId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for rejection deduction proposal
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [deductionAmount, setDeductionAmount] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  
  const presentTodayCount = shifts.filter(s => s.date === todayStr).length;
  const pendingAdvances = advanceRequests.filter(r => r.status === 'pending');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const pendingAttendance = shifts.filter(s => s.status === 'pending' && !s.isApproved);

  const dueScheduledPayments = useMemo(() => {
    return advanceRequests.filter(r => r.status === 'scheduled' && r.paymentDate && r.paymentDate <= todayStr);
  }, [advanceRequests, todayStr]);

  const handleAddAnnouncement = () => {
    if (!newAnnounce.trim()) return;
    setAnnouncements([{ id: Math.random().toString(36).substr(2, 9), content: newAnnounce, priority: announcePriority, timestamp: Date.now() }, ...announcements]);
    setNewAnnounce('');
    setShowAnnounceModal(false);
  };

  const decideAdvance = (id: string, status: 'approved' | 'rejected' | 'scheduled', date?: string) => {
    setAdvanceRequests(prev => prev.map(r => r.id === id ? { ...r, status, paymentDate: status === 'scheduled' ? date : r.paymentDate } : r));
    setSchedulingReqId(null);
  };

  const decideLeave = (id: string, status: 'accepted' | 'rejected' | 'deduction_proposed', amount?: number) => {
    setLeaves(prev => prev.map(l => {
      if (l.id === id) {
        if (status === 'deduction_proposed') {
          return { ...l, status, deductionProposedByAdmin: amount };
        }
        return { ...l, status };
      }
      return l;
    }));
    setRejectingLeaveId(null);
    setDeductionAmount('');
  };

  const approveShift = (id: string) => {
    setShifts(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, isApproved: true, status: 'completed' };
      }
      return s;
    }));
  };

  const getWorker = (id: string) => workers.find(w => w.id === id);

  return (
    <div className="px-6 pt-10 pb-6 space-y-8 bg-gray-50/50 min-h-screen">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-xs font-black text-blue-600 uppercase tracking-widest">Administrator Hub</h2>
          <h1 className="text-2xl font-black text-gray-900">Operations Control</h1>
        </div>
        <button onClick={() => setShowAnnounceModal(true)} className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all"><Megaphone size={20} /></button>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setShowPresentModal(true)} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm text-left active:bg-gray-50 transition-all">
          <div className="flex justify-between items-start mb-4"><div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl"><Users size={20} /></div></div>
          <p className="text-3xl font-black text-gray-900">{presentTodayCount}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">On Site Today</p>
        </button>
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl mb-4 w-fit"><Bell size={20} /></div>
          <p className="text-3xl font-black text-gray-900">{pendingAdvances.length + pendingLeaves.length + pendingAttendance.length}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Pending Actions</p>
        </div>
      </div>

      {/* Verification Queue (Attendance) */}
      {pendingAttendance.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-blue-700 uppercase flex items-center gap-2 ml-1"><CheckCircle size={14} /> Verification Queue</h3>
          <div className="space-y-3">
            {pendingAttendance.map(s => {
              const worker = getWorker(s.workerId);
              const isRejected = s.otStatus === 'rejected';
              const isSupervisorPending = s.otStatus === 'pending';
              const billable = s.approvedHours + s.otApprovedHours;
              
              return (
                <div key={s.id} className={`bg-white p-5 rounded-[2rem] border-2 shadow-sm space-y-4 transition-all ${isRejected ? 'bg-red-50/30 border-red-100' : isSupervisorPending ? 'border-amber-100 bg-amber-50/10' : 'border-blue-50'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src={worker?.photoUrl} className="w-9 h-9 rounded-xl object-cover" alt="" />
                      <div><h4 className="text-sm font-black text-gray-900">{worker?.name}</h4><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{s.date}</p></div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-600 tabular-nums">{billable.toFixed(1)} <span className="text-[9px]">hrs</span></p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">Final Billable</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Worker Report</p>
                      <p className="text-xs font-black">{s.totalHours.toFixed(1)}h Worked</p>
                      <p className="text-[9px] font-medium text-gray-500">Req OT: {s.otRequestedHours.toFixed(1)}h</p>
                    </div>
                    
                    {isSupervisorPending ? (
                      <div className="bg-amber-100/50 p-3 rounded-2xl border border-amber-200 flex flex-col items-center justify-center">
                        <Hourglass size={16} className="text-amber-600 mb-1" />
                        <p className="text-[9px] font-black text-amber-700 uppercase">Awaiting Supervisor</p>
                        <p className="text-[7px] font-bold text-amber-500 uppercase">{s.supervisorName?.split(' ')[0]}</p>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-2xl border ${isRejected ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Supervisor Decision</p>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] text-gray-400 line-through">{s.otRequestedHours.toFixed(1)}h</span>
                           <ArrowRight size={10} className="text-amber-400" />
                           <span className="text-xs font-black text-amber-900">{s.otApprovedHours.toFixed(1)}h OT</span>
                        </div>
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">⭐ {s.supervisorName?.split(' ')[0]}</p>
                      </div>
                    )}
                  </div>

                  {s.otReason && <div className="flex gap-2 items-start bg-gray-50/50 p-3 rounded-xl"><Info size={12} className="text-gray-400 mt-0.5" /><p className="text-[10px] text-gray-600 leading-tight italic">Reason: "{s.otReason}"</p></div>}

                  <button 
                    onClick={() => approveShift(s.id)} 
                    disabled={isSupervisorPending}
                    className={`w-full text-[10px] font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg uppercase tracking-widest transition-all ${isSupervisorPending ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white shadow-blue-50 active:scale-95'}`}
                  >
                    <CheckCircle2 size={16} /> {isSupervisorPending ? 'Waiting for SV Review' : 'Finalize Attendance'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advance Requests Section */}
      {pendingAdvances.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-green-700 uppercase flex items-center gap-2 ml-1"><Wallet size={14} /> Advance Requests</h3>
          <div className="space-y-3">
            {pendingAdvances.map(r => {
              const worker = getWorker(r.workerId);
              return (
                <div key={r.id} className="bg-white p-5 rounded-[2rem] border-2 border-green-50 shadow-sm space-y-4 transition-all">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src={worker?.photoUrl} className="w-9 h-9 rounded-xl object-cover" alt="" />
                      <div><h4 className="text-sm font-black text-gray-900">{worker?.name}</h4><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{r.requestDate}</p></div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-green-600">{r.amount} <span className="text-[9px]">SAR</span></p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-[11px] text-gray-600 italic">"{r.reason}"</div>
                  
                  {schedulingReqId === r.id ? (
                    <div className="flex gap-2 animate-in slide-in-from-right">
                      <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="flex-1 bg-gray-50 border-gray-100 rounded-xl px-3 text-xs font-bold outline-none" />
                      <button onClick={() => decideAdvance(r.id, 'scheduled', scheduleDate)} className="bg-blue-600 text-white p-3 rounded-xl"><CheckCircle2 size={18} /></button>
                      <button onClick={() => setSchedulingReqId(null)} className="bg-gray-100 text-gray-400 p-3 rounded-xl"><X size={18} /></button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => decideAdvance(r.id, 'rejected')} className="bg-red-50 text-red-600 font-black py-3 rounded-xl text-[9px] uppercase">Reject</button>
                      <button onClick={() => setSchedulingReqId(r.id)} className="bg-blue-50 text-blue-600 font-black py-3 rounded-xl text-[9px] uppercase">Schedule</button>
                      <button onClick={() => decideAdvance(r.id, 'approved')} className="bg-green-600 text-white font-black py-3 rounded-xl text-[9px] uppercase shadow-lg shadow-green-100">Approve</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leave Requests Section */}
      {pendingLeaves.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-orange-700 uppercase flex items-center gap-2 ml-1"><Calendar size={14} /> Leave Requests</h3>
          <div className="space-y-3">
            {pendingLeaves.map(l => {
              const worker = getWorker(l.workerId);
              const isRejecting = rejectingLeaveId === l.id;
              
              return (
                <div key={l.id} className="bg-white p-5 rounded-[2rem] border-2 border-orange-50 shadow-sm space-y-4 transition-all">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src={worker?.photoUrl} className="w-9 h-9 rounded-xl object-cover" alt="" />
                      <div><h4 className="text-sm font-black text-gray-900">{worker?.name}</h4><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{l.date}</p></div>
                    </div>
                    <div className="bg-orange-50 px-3 py-1 rounded-full"><p className="text-[8px] font-black text-orange-600 uppercase">TIME OFF</p></div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl text-[11px] text-gray-600 italic">"{l.reason}"</div>
                  
                  {isRejecting ? (
                    <div className="space-y-3 p-3 bg-red-50 rounded-2xl animate-in slide-in-from-right duration-200">
                      <p className="text-[10px] font-black text-red-600 uppercase flex items-center gap-1"><DollarSign size={10} /> Propose Deduction</p>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          value={deductionAmount} 
                          onChange={(e) => setDeductionAmount(e.target.value)}
                          placeholder="Amount (SAR)"
                          className="flex-1 bg-white border border-red-100 p-3 rounded-xl text-xs font-bold outline-none" 
                        />
                        <button 
                          onClick={() => decideLeave(l.id, 'deduction_proposed', Number(deductionAmount))}
                          className="bg-red-600 text-white p-3 rounded-xl active:scale-95 transition-all shadow-lg shadow-red-100"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button 
                          onClick={() => setRejectingLeaveId(null)}
                          className="bg-gray-100 text-gray-400 p-3 rounded-xl"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <p className="text-[8px] text-gray-400">Proposing a deduction will ask the worker for confirmation before final salary deduction.</p>
                      <button 
                        onClick={() => decideLeave(l.id, 'rejected')}
                        className="w-full bg-red-100 text-red-600 font-black py-2 rounded-xl text-[9px] uppercase mt-2 border border-red-200"
                      >
                        Skip Deduction & Reject Only
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setRejectingLeaveId(l.id)} className="bg-gray-100 text-gray-500 font-black py-4 rounded-xl text-[9px] uppercase border border-gray-200">Reject / Deduct</button>
                      <button onClick={() => decideLeave(l.id, 'accepted')} className="bg-orange-600 text-white font-black py-4 rounded-xl text-[9px] uppercase shadow-lg shadow-orange-100">Approve Leave</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Due Scheduled Payments Section */}
      {dueScheduledPayments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-blue-700 uppercase flex items-center gap-2 ml-1"><Hourglass size={14} /> Payouts Due Today</h3>
          <div className="space-y-3">
            {dueScheduledPayments.map(r => {
              const worker = getWorker(r.workerId);
              return (
                <div key={r.id} className="bg-blue-600 p-5 rounded-[2rem] shadow-xl text-white space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img src={worker?.photoUrl} className="w-9 h-9 rounded-xl object-cover border border-white/20" alt="" />
                      <div><h4 className="text-sm font-black">{worker?.name}</h4><p className="text-[9px] opacity-70 font-bold uppercase">Scheduled: {r.paymentDate}</p></div>
                    </div>
                    <p className="text-xl font-black">{r.amount} SAR</p>
                  </div>
                  <button onClick={() => decideAdvance(r.id, 'approved')} className="w-full bg-white text-blue-600 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner">
                    <CheckCircle2 size={16} /> Confirm Payout
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
