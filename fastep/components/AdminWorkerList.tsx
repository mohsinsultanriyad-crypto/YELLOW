
import React, { useState, useMemo } from 'react';
import { User, Shift, Leave, AdvanceRequest } from '../types';
import { Search, Download, FileText, Edit2, X, CheckCircle, Loader2, History, UserPlus, Zap, AlertTriangle, Trash2, AlertCircle, ShieldCheck, XCircle, Star } from 'lucide-react';
import { DAYS_IN_MONTH, BASE_HOURS } from '../constants';
import WorkerHistory from './WorkerHistory';

interface AdminWorkerListProps {
  workers: User[];
  setWorkers: React.Dispatch<React.SetStateAction<User[]>>;
  shifts: Shift[];
  setShifts?: React.Dispatch<React.SetStateAction<Shift[]>>;
  leaves: Leave[];
  setLeaves?: React.Dispatch<React.SetStateAction<Leave[]>>;
  advanceRequests: AdvanceRequest[];
}

const AdminWorkerList: React.FC<AdminWorkerListProps> = ({ workers, setWorkers, shifts, leaves, advanceRequests, setLeaves }) => {
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [salaryModalWorker, setSalaryModalWorker] = useState<{worker: User, payroll: any} | null>(null);
  const [historyWorker, setHistoryWorker] = useState<User | null>(null);
  const [workerToDelete, setWorkerToDelete] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newWorker, setNewWorker] = useState({
    name: '', workerId: '', trade: '', monthlySalary: '', phone: '', password: 'password123', iqamaExpiry: '', passportExpiry: '', role: 'worker' as const
  });

  const filteredWorkers = useMemo(() => {
    return workers.filter(w => 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      w.workerId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workers, searchQuery]);

  const calculateSalary = (worker: User) => {
    const workerShifts = shifts.filter(s => s.workerId === worker.id && s.isApproved);
    const workerLeaves = leaves.filter(l => l.workerId === worker.id);
    const workerAdvances = advanceRequests.filter(r => r.workerId === worker.id && r.status === 'approved');
    const totalApprovedAdvances = workerAdvances.reduce((acc, r) => acc + r.amount, 0);

    // FORMULA: HourlyRate = basicSalary / 30 / 10
    const basicSalary = worker.monthlySalary;
    const dailyRate = basicSalary / 30;
    const hourlyRate = dailyRate / 10;
    const otRate = hourlyRate * 1.5;
    
    let totalNormalHrs = 0;
    let totalOtHrs = 0;
    let rejectedOTCount = 0;
    
    workerShifts.forEach(s => {
      totalNormalHrs += s.approvedHours;
      totalOtHrs += s.otApprovedHours;
      if (s.otStatus === 'rejected') rejectedOTCount++;
    });

    // OTAmount = OTHours * OTRate
    const otAmount = totalOtHrs * otRate;

    // absentDeduction:
    // 1. Rejected leaves = absent days
    const rejectedLeavesCount = workerLeaves.filter(l => l.status === 'rejected').length;
    const rejectedLeavesDeduction = rejectedLeavesCount * dailyRate;

    // 2. Approved with deduction leaves
    const leaveFinalDeductions = workerLeaves
      .filter(l => l.status === 'approved_with_deduction')
      .reduce((acc, l) => acc + (l.finalDeductionAmount || 0), 0);

    const totalAbsentDeduction = rejectedLeavesDeduction + leaveFinalDeductions;

    // FinalSalary = basicSalary + OTAmount - advanceTotal - absentDeduction
    const finalPay = basicSalary + otAmount - totalApprovedAdvances - totalAbsentDeduction;
    
    return { 
        dailyRate, hourlyRate, otRate, 
        totalNormalHrs, totalOtHrs, 
        regularEarnings: basicSalary, // Showing basic salary as starting point
        totalOtPay: otAmount, 
        leaveDeductions: totalAbsentDeduction, 
        rejectedLeavesCount, 
        totalAdvances: totalApprovedAdvances, 
        finalPay, 
        totalHours: totalNormalHrs + totalOtHrs,
        rejectedOTCount
    };
  };

  const generateSheet = (worker: User) => {
    setIsGenerating(worker.id);
    const payroll = calculateSalary(worker);
    setTimeout(() => { setIsGenerating(null); setSalaryModalWorker({ worker, payroll }); }, 800);
  };

  const handleUpdateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorker) setWorkers(prev => prev.map(w => w.id === editingWorker.id ? editingWorker : w));
    setEditingWorker(null);
  };

  const handleDeleteWorker = () => {
    if (workerToDelete) { setWorkers(prev => prev.filter(w => w.id !== workerToDelete.id)); setWorkerToDelete(null); }
  };

  const handleCreateWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newWorker.name,
      workerId: newWorker.workerId,
      trade: newWorker.trade,
      monthlySalary: Number(newWorker.monthlySalary),
      phone: newWorker.phone,
      password: newWorker.password,
      role: newWorker.role,
      photoUrl: `https://picsum.photos/seed/${newWorker.workerId}/200`,
      isActive: true,
      iqamaExpiry: newWorker.iqamaExpiry,
      passportExpiry: newWorker.passportExpiry
    };
    setWorkers(prev => [...prev, newUser]);
    setShowAddModal(false);
    setNewWorker({ name: '', workerId: '', trade: '', monthlySalary: '', phone: '', password: 'password123', iqamaExpiry: '', passportExpiry: '', role: 'worker' });
  };

  return (
    <div className="px-6 pt-10 pb-6 space-y-8 bg-gray-50/50 min-h-screen">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Personnel</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Directory Management</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
          <UserPlus size={20} />
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter workers..." className="w-full bg-white border-2 border-gray-100 pl-12 pr-4 py-4 rounded-2xl text-sm font-bold shadow-sm focus:border-blue-300 outline-none" />
      </div>

      <div className="space-y-4">
        {filteredWorkers.map(worker => {
          const loading = isGenerating === worker.id;
          const isSupervisor = worker.role === 'supervisor';
          return (
            <div key={worker.id} className={`bg-white rounded-[2rem] p-6 border-2 shadow-sm space-y-5 transition-all ${isSupervisor ? 'border-amber-100 bg-amber-50/30' : 'border-gray-100'} ${!worker.isActive ? 'opacity-60 grayscale' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gray-50 overflow-hidden shadow-inner border-2 ${isSupervisor ? 'border-amber-300' : 'border-gray-100'}`}>
                    <img src={worker.photoUrl} className="w-full h-full object-cover" alt={worker.name} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                      {worker.name}
                      {isSupervisor && <ShieldCheck size={14} className="text-amber-500" />}
                    </h4>
                    <p className={`text-[9px] font-black uppercase tracking-wider ${isSupervisor ? 'text-amber-600' : 'text-blue-600'}`}>
                      {isSupervisor ? '⭐ Supervisor' : worker.trade} • {worker.workerId}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setEditingWorker(worker)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => setHistoryWorker(worker)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-blue-600 transition-colors"><History size={18} /></button>
                  <button onClick={() => setWorkerToDelete(worker)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
              <button 
                onClick={() => generateSheet(worker)} 
                disabled={loading} 
                className={`w-full text-xs font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${isSupervisor ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-blue-600 text-white shadow-blue-50'}`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Generate Salary Sheet
              </button>
            </div>
          );
        })}
      </div>

      {/* Salary Modal */}
      {salaryModalWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div className="w-full max-sm bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-2 ${salaryModalWorker.worker.role === 'supervisor' ? 'bg-amber-500' : 'bg-blue-600'}`} />
            <div className="flex justify-between items-center pt-2">
              <h3 className="text-xl font-black text-gray-900">Salary Statement</h3>
              <button onClick={() => setSalaryModalWorker(null)} className="p-2 bg-gray-50 text-gray-400 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Employee</span><span className="text-sm font-black text-gray-900">{salaryModalWorker.worker.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-gray-400 uppercase">Basic Monthly</span><span className="text-sm font-black text-gray-900">{salaryModalWorker.worker.monthlySalary} SAR</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-6">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase">Hourly Rate</span>
                <p className="text-base font-black text-gray-900">{salaryModalWorker.payroll.hourlyRate.toFixed(2)} <span className="text-[10px]">SAR</span></p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[9px] font-bold text-amber-500 uppercase flex items-center justify-end gap-1">OT Rate (1.5x) <Zap size={10} /></span>
                <p className="text-base font-black text-amber-600">{salaryModalWorker.payroll.otRate.toFixed(2)} <span className="text-[10px]">SAR</span></p>
              </div>
            </div>

            <div className="space-y-3 px-1">
              <div className="flex justify-between text-[11px] font-bold"><span className="text-gray-400 uppercase">Basic Salary</span><span className="text-gray-900">+{salaryModalWorker.payroll.regularEarnings.toFixed(0)} SAR</span></div>
              <div className="flex justify-between text-[11px] font-bold"><span className="text-amber-500 uppercase">OT Amount ({salaryModalWorker.payroll.totalOtHrs.toFixed(1)}h)</span><span className="text-amber-600">+{salaryModalWorker.payroll.totalOtPay.toFixed(0)} SAR</span></div>
              <div className="flex justify-between text-[11px] font-bold text-red-600"><span className="uppercase">Absent Deductions</span><span>-{salaryModalWorker.payroll.leaveDeductions.toFixed(0)} SAR</span></div>
              <div className="flex justify-between text-[11px] font-bold text-gray-500"><span className="text-gray-400 uppercase">Advances Taken</span><span className="text-gray-900">-{salaryModalWorker.payroll.totalAdvances.toFixed(0)} SAR</span></div>
            </div>

            <div className="bg-gray-900 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-gray-100">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-80">Final Salary</p>
                <p className="text-3xl font-black">{salaryModalWorker.payroll.finalPay.toFixed(0)} <span className="text-sm font-normal">SAR</span></p>
              </div>
              <CheckCircle size={32} className="text-blue-400" />
            </div>
            <button onClick={() => setSalaryModalWorker(null)} className="w-full bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl">Done</button>
          </div>
        </div>
      )}

      {/* Profile Creation Modal */}
      {showAddModal && (
        <div className={`fixed inset-0 z-[110] flex flex-col animate-in slide-in-from-bottom duration-300 transition-all ${newWorker.role === 'supervisor' ? 'bg-amber-50 border-4 border-amber-300 shadow-2xl' : 'bg-white'}`}>
          <div className={`px-6 py-6 flex items-center justify-between border-b transition-all ${newWorker.role === 'supervisor' ? 'border-amber-200 bg-amber-100/50' : 'border-gray-100'}`}>
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                {newWorker.role === 'supervisor' && <Star size={20} className="fill-amber-400 text-amber-500" />}
                Add Personnel
              </h3>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${newWorker.role === 'supervisor' ? 'text-amber-600' : 'text-gray-400'}`}>Set Profile & Access Role</p>
            </div>
            <button onClick={() => setShowAddModal(false)} className="p-3 bg-gray-50 text-gray-400 rounded-full"><X size={24} /></button>
          </div>
          <form onSubmit={handleCreateWorker} className="flex-1 p-6 space-y-6 pb-24 overflow-y-auto">
            <div className="space-y-4">
               <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${newWorker.role === 'supervisor' ? 'text-amber-500' : 'text-gray-400'}`}>Access Role</label>
               <div className={`flex p-1 rounded-2xl transition-colors ${newWorker.role === 'supervisor' ? 'bg-amber-200/50' : 'bg-gray-100'}`}>
                  <button type="button" onClick={() => setNewWorker({...newWorker, role: 'worker'})} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${newWorker.role === 'worker' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>WORKER</button>
                  <button type="button" onClick={() => setNewWorker({...newWorker, role: 'supervisor'})} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${newWorker.role === 'supervisor' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400'}`}>
                    <Star size={12} className={newWorker.role === 'supervisor' ? 'fill-amber-400' : ''} /> SUPERVISOR
                  </button>
               </div>
            </div>

            <div className="space-y-4">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${newWorker.role === 'supervisor' ? 'text-amber-500' : 'text-gray-400'}`}>Identity Details</label>
              <input required value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} type="text" className={`w-full p-4 rounded-2xl text-sm font-bold border-2 transition-colors ${newWorker.role === 'supervisor' ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`} placeholder="Full Name" />
              <div className="grid grid-cols-2 gap-4">
                <input required value={newWorker.workerId} onChange={e => setNewWorker({...newWorker, workerId: e.target.value})} type="text" className={`w-full p-4 rounded-2xl text-sm font-bold border-2 transition-colors ${newWorker.role === 'supervisor' ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`} placeholder="FS1001" />
                <input required value={newWorker.password} onChange={e => setNewWorker({...newWorker, password: e.target.value})} type="text" className={`w-full p-4 rounded-2xl text-sm font-bold border-2 transition-colors ${newWorker.role === 'supervisor' ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`} placeholder="Password" />
              </div>
            </div>

            <div className="space-y-4">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${newWorker.role === 'supervisor' ? 'text-amber-500' : 'text-gray-400'}`}>Professional Details</label>
              <input required value={newWorker.trade} onChange={e => setNewWorker({...newWorker, trade: e.target.value})} type="text" className={`w-full p-4 rounded-2xl text-sm font-bold border-2 transition-colors ${newWorker.role === 'supervisor' ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`} placeholder="Trade (e.g. Mason)" />
              <div className="grid grid-cols-2 gap-4">
                <input required value={newWorker.monthlySalary} onChange={e => setNewWorker({...newWorker, monthlySalary: e.target.value})} type="number" className={`w-full p-4 rounded-2xl text-sm font-bold border-2 transition-colors ${newWorker.role === 'supervisor' ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`} placeholder="Salary (SAR)" />
                <input required value={newWorker.phone} onChange={e => setNewWorker({...newWorker, phone: e.target.value})} type="tel" className={`w-full p-4 rounded-2xl text-sm font-bold border-2 transition-colors ${newWorker.role === 'supervisor' ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`} placeholder="Phone" />
              </div>
            </div>

            <div className="space-y-4">
              <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${newWorker.role === 'supervisor' ? 'text-amber-500' : 'text-gray-400'}`}>Documents</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><span className={`text-[8px] font-bold ${newWorker.role === 'supervisor' ? 'text-amber-500' : 'text-gray-400'}`}>IQAMA</span><input value={newWorker.iqamaExpiry} onChange={e => setNewWorker({...newWorker, iqamaExpiry: e.target.value})} type="date" className={`w-full p-4 rounded-2xl text-xs font-bold border-2 transition-colors ${newWorker.role === 'supervisor' ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`} /></div>
                <div className="space-y-1"><span className={`text-[8px] font-bold ${newWorker.role === 'supervisor' ? 'text-amber-500' : 'text-gray-400'}`}>PASSPORT</span><input value={newWorker.passportExpiry} onChange={e => setNewWorker({...newWorker, passportExpiry: e.target.value})} type="date" className={`w-full p-4 rounded-2xl text-xs font-bold border-2 transition-colors ${newWorker.role === 'supervisor' ? 'bg-white border-amber-200' : 'bg-gray-50 border-gray-100'}`} /></div>
              </div>
            </div>

            <button type="submit" className={`w-full text-white font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-all mt-4 uppercase tracking-widest text-xs ${newWorker.role === 'supervisor' ? 'bg-amber-600 shadow-amber-200' : 'bg-gray-900 shadow-gray-200'}`}>Create Profile</button>
          </form>
        </div>
      )}

      {/* Editing Modal */}
      {editingWorker && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="w-full max-sm bg-white rounded-[2.5rem] p-8 space-y-5 animate-in zoom-in duration-200 relative shadow-2xl">
            <button onClick={() => setEditingWorker(null)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 transition-colors"><X size={20} /></button>
            <h3 className="text-xl font-black text-gray-900">Edit Profile</h3>
            <form onSubmit={handleUpdateWorker} className="space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button type="button" onClick={() => setEditingWorker({...editingWorker, role: 'worker'})} className={`flex-1 py-2 text-[10px] font-black rounded-xl ${editingWorker.role === 'worker' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>WORKER</button>
                <button type="button" onClick={() => setEditingWorker({...editingWorker, role: 'supervisor'})} className={`flex-1 py-2 text-[10px] font-black rounded-xl ${editingWorker.role === 'supervisor' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400'}`}>SUPERVISOR</button>
              </div>
              <input required value={editingWorker.trade} onChange={e => setEditingWorker({...editingWorker, trade: e.target.value})} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border-2 border-gray-100" />
              <input type="number" required value={editingWorker.monthlySalary} onChange={e => setEditingWorker({...editingWorker, monthlySalary: Number(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border-2 border-gray-100" />
              <button type="submit" className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {workerToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl text-center">
            <div className="p-4 bg-red-50 text-red-600 rounded-full w-fit mx-auto"><AlertCircle size={40} /></div>
            <div><h3 className="text-xl font-black text-gray-900">Remove Employee?</h3><p className="text-xs text-gray-500 mt-2">Deleting <span className="font-bold">{workerToDelete.name}</span> will erase all their shift and payroll history.</p></div>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteWorker} className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl">Delete Permanently</button>
              <button onClick={() => setWorkerToDelete(null)} className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {historyWorker && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-white animate-in slide-in-from-right duration-300">
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
            <div><h3 className="text-xl font-bold text-gray-900">Personnel History</h3><p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{historyWorker.name}</p></div>
            <button onClick={() => setHistoryWorker(null)} className="p-3 bg-gray-50 text-gray-400 rounded-full"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <WorkerHistory user={historyWorker} shifts={shifts.filter(s => s.workerId === historyWorker.id)} leaves={leaves.filter(l => l.workerId === historyWorker.id)} setLeaves={setLeaves} advanceRequests={advanceRequests.filter(r => r.workerId === historyWorker.id)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkerList;
