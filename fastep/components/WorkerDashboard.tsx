
import React, { useState, useMemo, useEffect } from 'react';
import { User, Shift, Announcement, AdvanceRequest, OTHistoryItem } from '../types';
import { DAYS_IN_MONTH, BASE_HOURS } from '../constants';
import { Clock, Save, Edit3, Zap, Coffee, Calendar, Info, ShieldCheck, CheckCircle2, MessageCircle, XCircle, ListChecks, History as HistoryIcon } from 'lucide-react';
import { translations, Language } from '../translations';

interface WorkerDashboardProps {
  user: User;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: any[];
  advanceRequests: AdvanceRequest[];
  announcements: Announcement[];
  workers: User[];
  viewMode?: 'dashboard' | 'approvals';
  language?: Language;
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ user, shifts, setShifts, leaves, announcements, advanceRequests, workers, viewMode = 'dashboard', language = 'en' }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [approvalTab, setApprovalTab] = useState<'pending' | 'history'>('pending');
  const [manualOtHours, setManualOtHours] = useState<Record<string, string>>({});
  const t = translations[language];
  const supervisors = useMemo<User[]>(() => workers.filter(w => w.role === 'supervisor'), [workers]);

  const selectedShift = useMemo(() => 
    shifts.find(s => s.workerId === user.id && s.date === selectedDate),
    [shifts, user.id, selectedDate]
  );

  const [inTime, setInTime] = useState('08:00');
  const [outTime, setOutTime] = useState('18:30');
  const [breakMins, setBreakMins] = useState('30');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [supervisorId, setSupervisorId] = useState('');
  const [otReason, setOtReason] = useState('');

  const pendingOTRequests = useMemo(() => 
    shifts.filter(s => s.supervisorId === user.id && s.otStatus === 'pending'),
    [shifts, user.id]
  );

  const historyOTRequests = useMemo(() => 
    shifts.filter(s => s.supervisorId === user.id && (s.otStatus === 'approved' || s.otStatus === 'rejected')),
    [shifts, user.id]
  );

  useEffect(() => {
    if (selectedShift) {
      setInTime(new Date(selectedShift.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
      setOutTime(new Date(selectedShift.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
      setBreakMins(selectedShift.breakMinutes.toString());
      setNotes(selectedShift.notes || '');
      setSupervisorId(selectedShift.supervisorId || '');
      setOtReason(selectedShift.otReason || '');
      setIsEditing(false);
    } else {
      setInTime('08:00');
      setOutTime('18:30');
      setBreakMins('30');
      setNotes('');
      setSupervisorId('');
      setOtReason('');
      setIsEditing(false);
    }
  }, [selectedShift, selectedDate]);

  const dailyPay = user.monthlySalary / DAYS_IN_MONTH;
  const hourlyPay = dailyPay / 10;
  const otRate = hourlyPay * 1.5;

  const calculateBreakdown = (inT: string, outT: string, brk: string) => {
    const [inH, inM] = inT.split(':').map(Number);
    const [outH, outM] = outT.split(':').map(Number);
    let totalMs = (outH * 3600000 + outM * 60000) - (inH * 3600000 + inM * 60000);
    if (totalMs < 0) totalMs += 24 * 3600000;
    const workHrs = (totalMs / 3600000) - (Number(brk) / 60);
    const regHrs = Math.min(BASE_HOURS, workHrs);
    const otHrs = Math.max(0, workHrs - BASE_HOURS);
    return { 
      total: Math.max(0, workHrs), 
      reg: Math.max(0, regHrs), 
      ot: Math.max(0, otHrs),
      totalEarnings: (regHrs * hourlyPay) + (otHrs * otRate)
    };
  };

  const currentBreakdown = calculateBreakdown(inTime, outTime, breakMins);
  const isOTRequired = currentBreakdown.total > BASE_HOURS;

  const handleSave = () => {
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    const startTime = new Date(new Date(selectedDate).setHours(inH, inM, 0, 0)).getTime();
    const endTime = new Date(new Date(selectedDate).setHours(outH, outM, 0, 0)).getTime();
    const sv = supervisors.find(s => s.id === supervisorId);

    const isWorker = user.role === 'worker';
    const hasOT = currentBreakdown.total > BASE_HOURS;

    const newShift: Shift = {
      id: selectedShift?.id || Math.random().toString(36).substr(2, 9),
      workerId: user.id,
      date: selectedDate,
      startTime,
      endTime,
      breakMinutes: Number(breakMins),
      notes,
      status: 'pending',
      isApproved: false,
      totalHours: currentBreakdown.total,
      approvedHours: Math.min(BASE_HOURS, currentBreakdown.total),
      otRequestedHours: Math.max(0, currentBreakdown.total - BASE_HOURS),
      otApprovedHours: user.role === 'supervisor' ? Math.max(0, currentBreakdown.total - BASE_HOURS) : 0,
      otStatus: hasOT ? (user.role === 'supervisor' ? 'approved' : 'pending') : 'none',
      supervisorId: isWorker ? sv?.id : undefined,
      supervisorName: isWorker ? sv?.name : 'Auto-Admin',
      otReason: otReason,
      estimatedEarnings: currentBreakdown.totalEarnings,
      approvedEarnings: 0,
      otHistory: []
    };

    setShifts(prev => {
      const filtered = prev.filter(s => s.id !== newShift.id);
      return [...filtered, newShift];
    });
    setIsEditing(false);
  };

  const handleSupervisorDecision = (shiftId: string, decision: 'approved' | 'rejected') => {
    const manualVal = manualOtHours[shiftId];
    
    setShifts(prev => prev.map(s => {
      if (s.id === shiftId) {
        const finalOt = decision === 'approved' 
          ? (manualVal !== undefined && manualVal !== '' ? Number(manualVal) : s.otRequestedHours) 
          : 0;
        
        const historyItem: OTHistoryItem = {
          actionType: decision === 'approved' ? 'APPROVE' : 'REJECT',
          timestamp: Date.now(),
          supervisorId: user.id,
          supervisorName: user.name,
          previousOtHours: s.otRequestedHours,
          newOtHours: finalOt
        };

        return {
          ...s,
          otStatus: decision,
          otApprovedHours: finalOt,
          supervisorDecisionAt: Date.now(),
          otHistory: [...(s.otHistory || []), historyItem]
        };
      }
      return s;
    }));

    setManualOtHours(prev => {
      const n = {...prev};
      delete n[shiftId];
      return n;
    });
  };

  const stats = useMemo(() => {
    const workerShifts = shifts.filter(s => s.workerId === user.id);
    let appTotalEarnings = 0;
    let totalWorkHours = 0;
    let totalApprovedBillableHours = 0;

    workerShifts.forEach(s => {
      totalWorkHours += s.totalHours;
      if (s.isApproved) {
        const hourly = (user.monthlySalary / 30) / 10;
        appTotalEarnings += (s.approvedHours * hourly) + (s.otApprovedHours * hourly * 1.5);
        totalApprovedBillableHours += (s.approvedHours + s.otApprovedHours);
      }
    });

    return { appTotalEarnings, totalWorkHours, totalApprovedBillableHours };
  }, [shifts, user.id, user.monthlySalary]);

  const getWorker = (id: string) => workers.find(w => w.id === id);

  if (viewMode === 'approvals') {
    return (
      <div className="px-6 pt-10 pb-6 space-y-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Supervisor View</h2>
          <h1 className="text-2xl font-black text-gray-900">{t.pendingApprovals}</h1>
        </header>

        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button onClick={() => setApprovalTab('pending')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black rounded-xl transition-all ${approvalTab === 'pending' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><ListChecks size={14} /> PENDING</button>
          <button onClick={() => setApprovalTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black rounded-xl transition-all ${approvalTab === 'history' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}><HistoryIcon size={14} /> PROCESSED</button>
        </div>

        <div className="space-y-4">
          {approvalTab === 'pending' ? (
            pendingOTRequests.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-xs font-bold uppercase">{t.noPending}</p>
              </div>
            ) : (
              pendingOTRequests.map(s => {
                const worker = getWorker(s.workerId);
                return (
                  <div key={s.id} className="bg-white p-5 rounded-[2rem] border-2 border-blue-50 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img src={worker?.photoUrl} className="w-10 h-10 rounded-xl object-cover border border-gray-100" alt="" />
                        <div><h4 className="text-sm font-black text-gray-900">{worker?.name}</h4><p className="text-[9px] text-gray-400 font-bold uppercase">{s.date}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-blue-600">{s.totalHours.toFixed(1)} <span className="text-[10px]">HRS</span></p>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] font-bold text-amber-600 uppercase">OT Requested: {s.otRequestedHours.toFixed(1)}h</p>
                        <Zap size={14} className="text-amber-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Verify OT:</span>
                        <input 
                          type="number" 
                          placeholder={s.otRequestedHours.toFixed(1)}
                          value={manualOtHours[s.id] || ''}
                          onChange={(e) => setManualOtHours(prev => ({...prev, [s.id]: e.target.value}))}
                          className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-1 text-xs font-black outline-none"
                        />
                      </div>
                    </div>

                    {s.otReason && <div className="flex gap-2 items-start bg-gray-50/50 p-3 rounded-xl border border-gray-100"><MessageCircle size={12} className="text-gray-400 mt-0.5" /><p className="text-[10px] text-gray-600 italic">"{s.otReason}"</p></div>}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button onClick={() => handleSupervisorDecision(s.id, 'rejected')} className="bg-red-50 text-red-600 font-black py-4 rounded-xl text-[10px] uppercase flex items-center justify-center gap-2">Reject OT</button>
                      <button onClick={() => handleSupervisorDecision(s.id, 'approved')} className="bg-blue-600 text-white font-black py-4 rounded-xl text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-50">Approve OT</button>
                    </div>
                  </div>
                )
              })
            )
          ) : (
            historyOTRequests.map(s => {
              const worker = getWorker(s.workerId);
              const isApproved = s.otStatus === 'approved';
              return (
                <div key={s.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 flex items-center justify-between opacity-80">
                  <div className="flex items-center gap-3">
                    <img src={worker?.photoUrl} className="w-8 h-8 rounded-lg object-cover grayscale" alt="" />
                    <div><h4 className="text-xs font-black text-gray-700">{worker?.name}</h4><p className="text-[8px] text-gray-400 font-bold uppercase">{s.date}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-900">{s.otApprovedHours.toFixed(1)}h Approved</p>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase inline-block ${isApproved ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{isApproved ? 'APPROVED' : 'REJECTED'}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-10 pb-6 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 overflow-hidden border-2 shadow-sm border-white">
            <img src={user.photoUrl} alt="profile" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{t.hello}, {user.name.split(' ')[0]}</h1>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{user.trade}</span>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.worked}</span>
            <div className="text-4xl font-black text-gray-900 tabular-nums">{stats.totalWorkHours.toFixed(1)}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Clock size={28} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{t.earned}</p>
            <p className="text-lg font-black text-gray-900">{stats.appTotalEarnings.toFixed(0)} <span className="text-xs text-gray-400">SAR</span></p>
          </div>
          <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100">
            <p className="text-[9px] font-bold text-green-600 uppercase mb-1">{t.billable}</p>
            <p className="text-lg font-black text-green-700">{stats.totalApprovedBillableHours.toFixed(1)} <span className="text-xs">HRS</span></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Working Date</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="date" value={selectedDate} max={todayStr} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-gray-50 border border-gray-100 pl-11 pr-4 py-4 rounded-2xl text-sm font-bold outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">{t.total}</p>
            <p className="text-xs font-black text-gray-900">{currentBreakdown.total.toFixed(1)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">{t.regular}</p>
            <p className="text-xs font-black text-gray-900">{currentBreakdown.reg.toFixed(1)}</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-2xl text-center border border-amber-100">
            <p className="text-[8px] font-bold text-amber-600 uppercase mb-1">{t.ot}</p>
            <p className="text-xs font-black text-amber-700">{currentBreakdown.ot.toFixed(1)}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-2xl text-center border border-blue-100">
            <p className="text-[8px] font-bold text-blue-600 uppercase mb-1">{t.lunch}</p>
            <p className="text-xs font-black text-blue-700">{breakMins}</p>
          </div>
        </div>

        {(!selectedShift || isEditing) ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.in}</label><input type="time" value={inTime} onChange={e => setInTime(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border border-gray-100 outline-none" /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.out}</label><input type="time" value={outTime} onChange={e => setOutTime(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border border-gray-100 outline-none" /></div>
            </div>
            <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.lunch} ({t.mins})</label><input type="number" value={breakMins} onChange={e => setBreakMins(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border border-gray-100 outline-none" /></div>

            {isOTRequired && user.role === 'worker' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-amber-600 uppercase ml-1">{t.supervisor}</label>
                  <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)} className="w-full bg-amber-50 border border-amber-100 p-4 rounded-2xl text-sm font-bold outline-none">
                    <option value="">{t.selectSupervisor}</option>
                    {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-bold text-amber-600 uppercase ml-1">{t.reason} {t.optional}</label><textarea value={otReason} onChange={e => setOtReason(e.target.value)} placeholder="Reason..." className="w-full bg-amber-50 border border-amber-100 p-4 rounded-2xl text-sm min-h-[80px]" /></div>
              </div>
            )}

            <button onClick={handleSave} disabled={isOTRequired && user.role === 'worker' && !supervisorId} className="w-full bg-gray-900 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95 shadow-xl disabled:opacity-50 transition-all"><Save size={18} /> {t.submitHours}</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-900 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
               <div><p className="text-[10px] font-bold opacity-60 uppercase">Reported Total</p><p className="text-3xl font-black">{selectedShift.totalHours.toFixed(1)} <span className="text-sm font-normal">HRS</span></p></div>
               <div className="text-right">
                 <p className="text-[10px] font-bold opacity-60 uppercase">Status</p>
                 <span className="text-xs font-black px-3 py-1 rounded-full bg-white/10 text-white">
                    {selectedShift.isApproved ? t.verified : 
                     selectedShift.otStatus === 'approved' ? t.pendingAdmin :
                     selectedShift.otStatus === 'pending' ? t.pendingSupervisor :
                     selectedShift.otStatus === 'rejected' ? t.otRejected : 'PENDING'}
                 </span>
               </div>
            </div>
            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2.5 rounded-xl shadow-sm"><Info size={16} className="text-gray-400" /></div>
                <div><p className="text-[10px] font-bold text-gray-400 uppercase">{t.supervisor}</p><p className="text-xs font-black text-gray-900">{selectedShift.supervisorName || 'System'}</p></div>
              </div>
              <button onClick={() => setIsEditing(true)} className="p-3 bg-white text-gray-400 rounded-xl border border-gray-100 shadow-sm active:scale-90 transition-all"><Edit3 size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
