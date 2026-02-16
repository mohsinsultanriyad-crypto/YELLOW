
export type Role = 'worker' | 'supervisor' | 'admin';

export interface User {
  id: string;
  workerId?: string;
  email?: string;
  name: string;
  role: Role;
  trade?: string;
  monthlySalary: number;
  phone: string;
  photoUrl: string;
  password?: string;
  isActive: boolean;
  iqamaExpiry?: string;
  passportExpiry?: string;
}

export type ShiftStatus = 'none' | 'pending' | 'completed';
export type OTStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface OTHistoryItem {
  actionType: "SUBMIT_NEW_HOURS" | "APPROVE" | "REJECT" | "EDIT_OT_HOURS";
  timestamp: number;
  supervisorId: string;
  supervisorName: string;
  previousOtHours: number | null;
  newOtHours: number;
}

export interface Shift {
  id: string;
  workerId: string;
  date: string; // ISO string YYYY-MM-DD
  startTime: number; // timestamp
  endTime: number; // timestamp
  status: ShiftStatus;
  breakMinutes: number;
  notes?: string;
  isApproved: boolean;
  
  // OT Logic Fields
  totalHours: number;
  approvedHours: number; // Base hours (usually max 10 for workers)
  otRequestedHours: number;
  otApprovedHours: number;
  otStatus: OTStatus;
  supervisorId?: string;
  supervisorName?: string;
  otReason?: string;
  supervisorProposedOtHours?: number;
  proposedUpdatedAt?: number;
  supervisorDecisionAt?: number;
  otHistory?: OTHistoryItem[];
  
  estimatedEarnings: number;
  approvedEarnings: number;
  advanceTaken?: number;
}

export interface Leave {
  id: string;
  workerId: string;
  date: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'deduction_proposed' | 'approved_with_deduction' | 'cancelled_by_worker';
  deductionProposedByAdmin?: number;
  finalDeductionAmount?: number;
  workerDecisionAt?: number;
}

export interface AdvanceRequest {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled';
  paymentDate?: string;
}

export interface SitePost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
}

export interface Announcement {
  id: string;
  content: string;
  priority: 'low' | 'high';
  timestamp: number;
}
