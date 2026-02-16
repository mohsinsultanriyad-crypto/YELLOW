
import React, { useState, useMemo } from 'react';
import { User, Shift, Leave, AdvanceRequest } from '../types';
import { FileSpreadsheet, ChevronLeft, ChevronRight, Download, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminMonthlyReportProps {
  workers: User[];
  shifts: Shift[];
  leaves: Leave[];
  advanceRequests: AdvanceRequest[];
}

const AdminMonthlyReport: React.FC<AdminMonthlyReportProps> = ({ workers, shifts, leaves, advanceRequests }) => {
  const [reportDate, setReportDate] = useState(new Date());

  const year = reportDate.getFullYear();
  const month = reportDate.getMonth();
  const monthStr = (month + 1).toString().padStart(2, '0');
  const targetYearMonth = `${year}-${monthStr}`;

  const handlePrevMonth = () => {
    setReportDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setReportDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const reportData = useMemo(() => {
    return workers.map(worker => {
      const monthShifts = shifts.filter(s => s.workerId === worker.id && s.date.startsWith(targetYearMonth));
      const monthLeaves = leaves.filter(l => l.workerId === worker.id && l.date.startsWith(targetYearMonth) && l.status === 'accepted');
      const monthAdvances = advanceRequests.filter(r => r.workerId === worker.id && r.requestDate.startsWith(targetYearMonth) && r.status === 'approved');

      const totalWorkedHours = monthShifts.reduce((acc, s) => acc + s.totalHours, 0);
      const totalApprovedOT = monthShifts.reduce((acc, s) => acc + (s.otStatus === 'approved' ? s.otApprovedHours : 0), 0);
      const totalAdvances = monthAdvances.reduce((acc, r) => acc + r.amount, 0);
      const totalPayableHours = totalWorkedHours + totalApprovedOT;

      return {
        id: worker.id,
        workerId: worker.workerId || 'N/A',
        name: worker.name,
        trade: worker.trade || 'Admin',
        monthlySalary: worker.monthlySalary,
        totalWorkedHours,
        totalApprovedOT,
        totalLeaves: monthLeaves.length,
        totalAdvances,
        totalPayableHours
      };
    });
  }, [workers, shifts, leaves, advanceRequests, targetYearMonth]);

  const exportToExcel = () => {
    const fileName = `Monthly_Report_${year}_${monthStr}.xlsx`;
    
    // Prepare data for Excel with readable headers
    const excelData = reportData.map(item => ({
      'Worker ID': item.workerId,
      'Name': item.name,
      'Trade': item.trade,
      'Monthly Salary (SAR)': item.monthlySalary,
      'Total Worked Hours': item.totalWorkedHours.toFixed(1),
      'Approved OT Hours': item.totalApprovedOT.toFixed(1),
      'Total Leave Days': item.totalLeaves,
      'Advance Taken (SAR)': item.totalAdvances,
      'Total Payable Hours': item.totalPayableHours.toFixed(1)
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");

    // Fix column widths for better readability
    const wscols = [
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 18 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="px-6 pt-10 pb-24 space-y-6 bg-gray-50 min-h-full">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-50 text-green-600 rounded-xl">
            <FileSpreadsheet size={24} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Monthly Report</h1>
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Export Performance & Payout Data</p>
      </header>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <button 
          onClick={handlePrevMonth}
          className="flex items-center gap-1 text-xs font-black text-gray-400 hover:text-blue-600 transition-all uppercase"
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <div className="text-sm font-black text-gray-900 uppercase tracking-widest">
          {reportDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button 
          onClick={handleNextMonth}
          className="flex items-center gap-1 text-xs font-black text-gray-400 hover:text-blue-600 transition-all uppercase"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all"
        >
          <Download size={18} /> Download Excel
        </button>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center gap-2">
          <TableIcon size={16} className="text-gray-400" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Data Preview</h3>
        </div>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-tighter">ID</th>
                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-tighter">Name</th>
                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-tighter">Trade</th>
                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-tighter">Worked</th>
                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-tighter">OT</th>
                <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-tighter">Advances</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs text-gray-400 font-bold uppercase">No records for this month</td>
                </tr>
              ) : (
                reportData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-[10px] font-black text-gray-500">{item.workerId}</td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-black text-gray-900 leading-none">{item.name}</p>
                    </td>
                    <td className="px-4 py-4 text-[10px] font-bold text-blue-600 uppercase">{item.trade}</td>
                    <td className="px-4 py-4 text-[10px] font-black text-gray-900">{item.totalWorkedHours.toFixed(1)}h</td>
                    <td className="px-4 py-4 text-[10px] font-black text-amber-600">{item.totalApprovedOT.toFixed(1)}h</td>
                    <td className="px-4 py-4 text-[10px] font-black text-red-500">{item.totalAdvances} <span className="text-[8px]">SAR</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMonthlyReport;
