
import React, { useState, useMemo } from 'react';
import { User, Shift, Leave, AdvanceRequest } from '../types';
import { CheckCircle2, Clock, Calendar as CalendarIcon, History, Wallet, Info, XCircle, AlertCircle, DollarSign, ArrowRight, X } from 'lucide-react';
import { BASE_HOURS } from '../constants';

interface WorkerHistoryProps {
  user: User;
  shifts: Shift[];
  leaves: Leave[];
  setLeaves?: React.Dispatch<React.SetStateAction<Leave[]>>;
  advanceRequests?: AdvanceRequest[];
}

const WorkerHistory: React.FC<WorkerHistoryProps> = ({ user, shifts, leaves, setLeaves, advanceRequests = [] }) => {
  const [view, setView] = useState<'attendance' | 'calendar' | 'leaves' | 'advances'>('attendance');

  const sortedShifts = useMemo(() => [...shifts].sort((a, b) => b.startTime - a.startTime), [shifts]);
  const sortedLeaves = useMemo(() => [...leaves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [leaves]);
  const sortedAdvances = useMemo(() => [...advanceRequests].sort((a, b) => {
    const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
    const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
    return dateB - dateA;
  }), [advanceRequests]);

  const stats = useMemo(() => {
    return {
      leave: {
        total: leaves.length,
        accepted: leaves.filter(l => l.status === 'accepted' || l.status === 'approved_with_deduction').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        pending: leaves.filter(l => l.status === 'pending' || l.status === 'deduction_proposed').length,
      },
      advance: {
        total: advanceRequests.length,
        approved: advanceRequests.filter(r => r.status === 'approved').length,
        pending: advanceRequests.filter(r => r.status === 'pending').length,
        totalPaid: advanceRequests.filter(r => r.status === 'approved').reduce((acc, r) => acc + r.amount, 0),
      }
    };
  }, [leaves, advanceRequests]);

  const handleLeaveDecision = (leaveId: string, accepted: boolean) => {
    if (!setLeaves) {
      console.warn('handleLeaveDecision: setLeaves prop is missing');
      return;
    }
    
    console.log(`Worker ${user.name} decision for leave ${leaveId}: ${accepted ? 'ACCEPT' : 'DECLINE'}`);
    
    setLeaves(prev => {
      const updated = prev.map(l => {
        if (l.id === leaveId) {
          const newStatus = accepted ? 'approved_with_deduction' : 'cancelled_by_worker';
          console.log(`Updating leave ${leaveId} status to: ${newStatus}`);
          return { 
            ...l, 
            status: newStatus, 
            finalDeductionAmount: accepted ? l.deductionProposedByAdmin : l.finalDeductionAmount,
            workerDecisionAt: Date.now()
          };
        }
        return l;
      });
      console.log('New leaves state prepared for sync:', updated);
      return updated;
    });
  };

  const now = new Date();
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(now.getFullYear(), now.getMonth()) }, (_, i) => i + 1);

  return (
    <div className="px-6 pt-10 pb-6 space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Worker Audit</h1>
          <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">{user.workerId}</span>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto hide-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setView('attendance')}
            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${view === 'attendance' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Work
          </button>
          <button 
            onClick={() => setView('calendar')}
            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Calendar
          </button>
          <button 
            onClick={() => setView('leaves')}
            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${view === 'leaves' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Leaves
          </button>
          <button 
            onClick={() => setView('advances')}
            className={`px-4 py-2 text-[10px] font-bold uppercase rounded-xl transition-all ${view === 'advances' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            Advances
          </button>
        </div>
      </header>

      {view === 'attendance' && (
        <div className="space-y-4">
          {sortedShifts.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No shift records found</p>
            </div>
          )}
          {sortedShifts.map(shift => {
            const isRejected = shift.otStatus === 'rejected';
            const finalAppr = shift.approvedHours + shift.otApprovedHours;
            return (
              <div key={shift.id} className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${isRejected ? 'bg-red-50 border-red-100 shadow-red-50' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isRejected ? 'bg-red-100 text-red-600' : shift.isApproved ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                    {isRejected ? <XCircle size={24} /> : (shift.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {new Date(shift.startTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </h4>
                    <div className="flex flex-col mt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{finalAppr.toFixed(1)} hrs approved</span>
                        {shift.totalHours > BASE_HOURS && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${isRejected ? 'bg-red-200 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isRejected ? 'OT Rejected' : 'OT ' + shift.otStatus.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {isRejected && (
                         <p className="text-[9px] font-bold text-red-400 uppercase mt-0.5">
                           Requested: {shift.totalHours.toFixed(1)}h → Final Paid: {finalAppr.toFixed(1)}h
                         </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black ${isRejected ? 'text-red-600' : shift.isApproved ? 'text-blue-600' : 'text-gray-900'}`}>
                    {shift.isApproved ? `+${finalAppr.toFixed(1)}` : 'Pending'}
                  </div>
                  {shift.isApproved && !isRejected && <div className="text-[10px] font-bold text-blue-400 flex items-center justify-end gap-1 uppercase">Finalized <CheckCircle2 size={10} /></div>}
                  {isRejected && <div className="text-[9px] font-black text-red-400 uppercase">10h Base Only</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'calendar' && (
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="font-bold text-gray-900">{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1 uppercase">{d}</div>
            ))}
            {days.map(day => {
              const dayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const shift = shifts.find(s => s.date === dayStr);
              const leave = leaves.find(l => l.date === dayStr);
              
              let statusClass = 'text-gray-900';
              let badge = null;

              if (shift) {
                const isRejected = shift.otStatus === 'rejected';
                statusClass = isRejected ? 'bg-red-400 text-white rounded-full' : 'bg-blue-600 text-white rounded-full';
                if (shift.isApproved) badge = <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full ring-2 ring-white"><CheckCircle2 size={8} /></div>;
              } else if (leave) {
                statusClass = 'bg-orange-500 text-white rounded-full';
                badge = <div className="absolute -bottom-1 -right-1 bg-white text-orange-500 text-[8px] font-bold px-1 rounded shadow-sm border border-orange-100">{leave.status.includes('accepted') || leave.status.includes('approved') ? 'L-A' : 'L-R'}</div>;
              }

              return (
                <div key={day} className="relative aspect-square flex items-center justify-center">
                  <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-all ${statusClass}`}>
                    {day}
                  </div>
                  {badge}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'leaves' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
              <p className="text-[7px] font-bold text-gray-400 uppercase mb-1">Total</p>
              <p className="text-sm font-black text-gray-900">{stats.leave.total}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 shadow-sm text-center">
              <p className="text-[7px] font-bold text-orange-600 uppercase mb-1">Pending</p>
              <p className="text-sm font-black text-orange-700">{stats.leave.pending}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl border border-green-100 shadow-sm text-center">
              <p className="text-[7px] font-bold text-green-600 uppercase mb-1">Appr.</p>
              <p className="text-sm font-black text-green-700">{stats.leave.accepted}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-2xl border border-red-100 shadow-sm text-center">
              <p className="text-[7px] font-bold text-red-600 uppercase mb-1">Rej.</p>
              <p className="text-sm font-black text-red-700">{stats.leave.rejected}</p>
            </div>
          </div>

          <div className="space-y-4">
            {sortedLeaves.length === 0 && <p className="text-center py-10 text-gray-400 text-xs">No leaves submitted.</p>}
            {sortedLeaves.map(leave => (
              <div key={leave.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  leave.status === 'accepted' || leave.status === 'approved_with_deduction' ? 'bg-green-500' :
                  leave.status === 'rejected' || leave.status === 'cancelled_by_worker' ? 'bg-red-500' :
                  'bg-orange-400'
                }`} />
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-gray-400" />
                    <h4 className="text-sm font-bold text-gray-900">{new Date(leave.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</h4>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    leave.status.includes('accepted') || leave.status.includes('approved') ? 'bg-green-100 text-green-700' :
                    leave.status.includes('rejected') || leave.status.includes('cancelled') ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>{leave.status.replace(/_/g, ' ')}</div>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-xl text-xs text-gray-600 italic">"{leave.reason}"</div>
                
                {leave.status === 'deduction_proposed' && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl space-y-4 animate-in zoom-in duration-200">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-blue-600" />
                      <h4 className="text-xs font-black text-blue-700 uppercase">Admin Proposed Deduction</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-gray-600">The administrator proposed a deduction of <span className="font-black text-blue-700">{leave.deductionProposedByAdmin} SAR</span> to approve this leave request. Would you like to accept?</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleLeaveDecision(leave.id, false)}
                        className="bg-white text-gray-500 border border-gray-100 font-bold py-3 rounded-xl text-[10px] uppercase flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        <X size={14} /> Decline
                      </button>
                      <button 
                        onClick={() => handleLeaveDecision(leave.id, true)}
                        className="bg-blue-600 text-white font-black py-3 rounded-xl text-[10px] uppercase flex items-center justify-center gap-1 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                      >
                        <CheckCircle2 size={14} /> Accept
                      </button>
                    </div>
                  </div>
                )}
                
                {leave.status === 'approved_with_deduction' && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-green-700 bg-green-50 p-3 rounded-xl">
                    <CheckCircle2 size={14} />
                    Final deduction applied: {leave.finalDeductionAmount} SAR
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'advances' && (
        <div className="space-y-6">
          <div className="bg-blue-600 p-6 rounded-[2rem] text-white space-y-4 shadow-lg shadow-blue-100">
            <div className="flex justify-between items-center">
               <div>
                 <p className="text-[10px] font-bold uppercase opacity-70">Approved Total</p>
                 <p className="text-3xl font-black">{stats.advance.totalPaid} SAR</p>
               </div>
               <div className="bg-white/20 p-3 rounded-2xl"><Wallet size={28} /></div>
            </div>
            <div className="flex gap-4 pt-3 border-t border-white/10">
               <div>
                  <p className="text-[8px] font-black opacity-60 uppercase">Pending Req.</p>
                  <p className="text-sm font-black">{stats.advance.pending} Requests</p>
               </div>
               <div>
                  <p className="text-[8px] font-black opacity-60 uppercase">Total Approved</p>
                  <p className="text-sm font-black">{stats.advance.approved} Requests</p>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            {sortedAdvances.length === 0 && <p className="text-center py-10 text-gray-400 text-xs">No advance requests found.</p>}
            {sortedAdvances.map(r => (
              <div key={r.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  r.status === 'approved' ? 'bg-green-500' :
                  r.status === 'rejected' ? 'bg-red-500' :
                  r.status === 'scheduled' ? 'bg-blue-500' :
                  'bg-orange-400'
                }`} />
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{r.amount} SAR</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{r.requestDate}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase ${
                    r.status === 'approved' ? 'bg-green-100 text-green-600' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    r.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>{r.status}</div>
                </div>
                {r.status === 'scheduled' && r.paymentDate && (
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <CalendarIcon size={12} />
                    Scheduled for: {r.paymentDate}
                  </div>
                )}
                {r.reason && <p className="text-[11px] text-gray-500 font-medium border-l-2 border-gray-100 pl-3">"{r.reason}"</p>}
                {r.status === 'approved' && (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-orange-600 bg-orange-50 p-2 rounded-xl">
                    <Info size={12} />
                    Auto-deducted from next salary sheet.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerHistory;
