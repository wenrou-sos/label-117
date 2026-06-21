export type UserRole = "admin" | "clinic_admin" | "doctor" | "receptionist" | "inventory_manager";

export type AppointmentStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

export type ScheduleType = "clinic" | "surgery" | "rest";

export type InventoryCategory = "implant" | "orthodontics" | "anesthesia" | "suture" | "impression" | "other";

export type PointsTxType = "earn" | "spend" | "expire";

export type InstallmentStatus = "active" | "completed" | "overdue";

export type MemberLevel = "normal" | "silver" | "gold" | "platinum";

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  isMain: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  role: UserRole;
  clinicId: string;
  phone: string;
  email?: string;
  avatar?: string;
  title?: string;
  specialty?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  gender: "male" | "female";
  birthday?: string;
  idCard?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface TreatmentType {
  id: string;
  name: string;
  minDuration: number;
  maxDuration: number;
  price: number;
  description?: string;
  color: string;
  category: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  staffId: string;
  clinicId: string;
  treatmentTypeId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  staffId: string;
  clinicId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ScheduleType;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  brand: string;
  model?: string;
  unit: string;
  currentStock: number;
  safetyStock: number;
  price: number;
  clinicId: string;
  createdAt: string;
}

export interface InventoryBatch {
  id: string;
  itemId: string;
  batchNo: string;
  quantity: number;
  expireDate?: string;
  supplier: string;
  clinicId: string;
  createdAt: string;
}

export interface TraceCode {
  id: string;
  code: string;
  itemId: string;
  batchId: string;
  status: "in_stock" | "used" | "returned";
  usedByPatientId?: string;
  usedAt?: string;
  appointmentId?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  orderDate: string;
  clinicId: string;
  remark?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  batchNo: string;
  quantity: number;
  unitPrice: number;
  expireDate?: string;
  traceCodes?: string[];
}

export interface ConsumeOrder {
  id: string;
  patientId?: string;
  appointmentId?: string;
  consumeDate: string;
  clinicId: string;
  items: ConsumeOrderItem[];
  createdAt: string;
}

export interface ConsumeOrderItem {
  id: string;
  itemId: string;
  batchId?: string;
  quantity: number;
  traceCode?: string;
  purpose?: string;
}

export interface TraceRecord {
  id: string;
  traceCode: string;
  action: "inbound" | "outbound" | "used" | "returned";
  itemId: string;
  batchId?: string;
  patientId?: string;
  appointmentId?: string;
  operatorId?: string;
  clinicId: string;
  remark?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  patientId: string;
  memberNo: string;
  level: MemberLevel;
  balance: number;
  points: number;
  joinDate: string;
  expiryDate?: string;
}

export interface InstallmentPlan {
  id: string;
  memberId: string;
  appointmentId?: string;
  totalAmount: number;
  periods: number;
  periodAmount: number;
  paidPeriods: number;
  status: InstallmentStatus;
  startDate: string;
  nextDueDate: string;
  description?: string;
  createdAt: string;
}

export interface PointsTx {
  id: string;
  memberId: string;
  type: PointsTxType;
  points: number;
  description: string;
  referenceId?: string;
  staffId?: string;
  createdAt: string;
}

export interface StoredValueTx {
  id: string;
  memberId: string;
  amount: number;
  type: "recharge" | "consume";
  description: string;
  referenceId?: string;
  staffId?: string;
  createdAt: string;
}
