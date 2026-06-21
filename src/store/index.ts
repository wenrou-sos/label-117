import { create } from "zustand";
import { generateId } from "@/lib/utils";
import {
  clinics as mockClinics,
  staff as mockStaff,
  patients as mockPatients,
  treatmentTypes as mockTreatmentTypes,
  appointments as mockAppointments,
  schedules as mockSchedules,
  inventoryItems as mockInventoryItems,
  inventoryBatches as mockInventoryBatches,
  traceCodes as mockTraceCodes,
  purchaseOrders as mockPurchaseOrders,
  consumeOrders as mockConsumeOrders,
  traceRecords as mockTraceRecords,
  members as mockMembers,
  installmentPlans as mockInstallmentPlans,
  pointsTxs as mockPointsTxs,
  storedValueTxs as mockStoredValueTxs,
} from "@/data/mockData";
import type {
  Clinic,
  Staff,
  Patient,
  TreatmentType,
  Appointment,
  Schedule,
  InventoryItem,
  InventoryBatch,
  TraceCode,
  PurchaseOrder,
  ConsumeOrder,
  TraceRecord,
  Member,
  InstallmentPlan,
  PointsTx,
  StoredValueTx,
  AppointmentStatus,
  Settlement,
} from "@/types";

interface AppState {
  clinics: Clinic[];
  staff: Staff[];
  patients: Patient[];
  treatmentTypes: TreatmentType[];
  appointments: Appointment[];
  schedules: Schedule[];
  inventoryItems: InventoryItem[];
  inventoryBatches: InventoryBatch[];
  traceCodes: TraceCode[];
  purchaseOrders: PurchaseOrder[];
  consumeOrders: ConsumeOrder[];
  traceRecords: TraceRecord[];
  members: Member[];
  installmentPlans: InstallmentPlan[];
  pointsTxs: PointsTx[];
  storedValueTxs: StoredValueTx[];
  settlements: Settlement[];
  selectedClinicId: string | null;
  selectedDate: string;

  setSelectedClinicId: (id: string | null) => void;
  setSelectedDate: (date: string) => void;

  addAppointment: (data: Omit<Appointment, "id" | "createdAt">) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;

  addSchedule: (data: Omit<Schedule, "id" | "createdAt">) => void;
  updateSchedule: (id: string, data: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;

  addPatient: (data: Omit<Patient, "id" | "createdAt">) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;

  addInventoryItem: (data: Omit<InventoryItem, "id" | "createdAt">) => void;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => void;
  addInventoryBatch: (data: Omit<InventoryBatch, "id" | "createdAt">) => void;
  addTraceCode: (data: Omit<TraceCode, "id" | "createdAt">) => void;
  updateTraceCode: (code: string, data: Partial<TraceCode>) => void;

  addPurchaseOrder: (data: Omit<PurchaseOrder, "id" | "createdAt" | "totalAmount">) => void;
  addConsumeOrder: (data: Omit<ConsumeOrder, "id" | "createdAt">) => void;
  addTraceRecord: (data: Omit<TraceRecord, "id" | "createdAt">) => void;

  updateMember: (id: string, data: Partial<Member>) => void;
  addPointsTx: (data: Omit<PointsTx, "id" | "createdAt">) => void;
  addStoredValueTx: (data: Omit<StoredValueTx, "id" | "createdAt">) => void;
  addSettlement: (data: Omit<Settlement, "id" | "createdAt" | "status" | "amountPaid">) => void;
  addInstallmentPlan: (data: Omit<InstallmentPlan, "id" | "createdAt">) => void;
  updateInstallmentPlan: (id: string, data: Partial<InstallmentPlan>) => void;

  addTreatmentType: (data: Omit<TreatmentType, "id" | "createdAt">) => void;
  updateTreatmentType: (id: string, data: Partial<TreatmentType>) => void;

  addStaff: (data: Omit<Staff, "id" | "createdAt">) => void;
  updateStaff: (id: string, data: Partial<Staff>) => void;

  addClinic: (data: Omit<Clinic, "id" | "createdAt">) => void;
  updateClinic: (id: string, data: Partial<Clinic>) => void;
}

export const useAppStore = create<AppState>((set) => {
  return {
    clinics: mockClinics,
    staff: mockStaff,
    patients: mockPatients,
    treatmentTypes: mockTreatmentTypes,
    appointments: mockAppointments,
    schedules: mockSchedules,
    inventoryItems: mockInventoryItems,
    inventoryBatches: mockInventoryBatches,
    traceCodes: mockTraceCodes,
    purchaseOrders: mockPurchaseOrders,
    consumeOrders: mockConsumeOrders,
    traceRecords: mockTraceRecords,
    members: mockMembers,
    installmentPlans: mockInstallmentPlans,
    pointsTxs: mockPointsTxs,
    storedValueTxs: mockStoredValueTxs,
    settlements: [],
    selectedClinicId: null,
    selectedDate: new Date().toISOString().split("T")[0],

    setSelectedClinicId: (id) => set({ selectedClinicId: id }),
    setSelectedDate: (date) => set({ selectedDate: date }),

    addAppointment: (data) =>
      set((state) => ({
        appointments: [
          ...state.appointments,
          { ...data, id: generateId("apt-"), createdAt: new Date().toISOString() },
        ],
      })),
    updateAppointmentStatus: (id, status) =>
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? { ...a, status } : a
        ),
      })),
    deleteAppointment: (id) =>
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== id),
      })),

    addSchedule: (data) =>
      set((state) => ({
        schedules: [
          ...state.schedules,
          { ...data, id: generateId("sch-"), createdAt: new Date().toISOString() },
        ],
      })),
    updateSchedule: (id, data) =>
      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === id ? { ...s, ...data } : s
        ),
      })),
    deleteSchedule: (id) =>
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
      })),

    addPatient: (data) =>
      set((state) => ({
        patients: [
          ...state.patients,
          { ...data, id: generateId("p-"), createdAt: new Date().toISOString() },
        ],
      })),
    updatePatient: (id, data) =>
      set((state) => ({
        patients: state.patients.map((p) =>
          p.id === id ? { ...p, ...data } : p
        ),
      })),

    addInventoryItem: (data) =>
      set((state) => ({
        inventoryItems: [
          ...state.inventoryItems,
          { ...data, id: generateId("inv-"), createdAt: new Date().toISOString() },
        ],
      })),
    updateInventoryItem: (id, data) =>
      set((state) => ({
        inventoryItems: state.inventoryItems.map((i) =>
          i.id === id ? { ...i, ...data } : i
        ),
      })),
    addInventoryBatch: (data) =>
      set((state) => ({
        inventoryBatches: [
          ...state.inventoryBatches,
          { ...data, id: generateId("batch-"), createdAt: new Date().toISOString() },
        ],
      })),
    addTraceCode: (data) =>
      set((state) => ({
        traceCodes: [
          ...state.traceCodes,
          { ...data, id: generateId("tc-"), createdAt: new Date().toISOString() },
        ],
      })),
    updateTraceCode: (code, data) =>
      set((state) => ({
        traceCodes: state.traceCodes.map((tc) =>
          tc.code === code ? { ...tc, ...data } : tc
        ),
      })),
    addPurchaseOrder: (data) =>
      set((state) => {
        const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const newOrder: PurchaseOrder = {
          ...data,
          id: generateId("po-"),
          totalAmount,
          createdAt: new Date().toISOString(),
        };
        const updatedItems = state.inventoryItems.map((item) => {
          const orderItem = data.items.find((oi) => oi.itemId === item.id);
          if (!orderItem) return item;
          return { ...item, currentStock: item.currentStock + orderItem.quantity };
        });
        const newBatches = data.items.map((item) => ({
          id: generateId("batch-"),
          itemId: item.itemId,
          batchNo: item.batchNo,
          quantity: item.quantity,
          expireDate: item.expireDate,
          supplier: data.supplier,
          clinicId: data.clinicId,
          createdAt: new Date().toISOString(),
        }));
        const newTraceCodes: TraceCode[] = [];
        const newTraceRecords: TraceRecord[] = [];
        data.items.forEach((item) => {
          const invItem = state.inventoryItems.find((i) => i.id === item.itemId);
          if (invItem?.category === "implant" && item.traceCodes) {
            item.traceCodes.forEach((code) => {
              newTraceCodes.push({
                id: generateId("tc-"),
                code,
                itemId: item.itemId,
                batchId: newBatches.find((b) => b.batchNo === item.batchNo)?.id || "",
                status: "in_stock" as const,
                createdAt: new Date().toISOString(),
              });
              newTraceRecords.push({
                id: generateId("tr-"),
                traceCode: code,
                action: "inbound" as const,
                itemId: item.itemId,
                batchId: newBatches.find((b) => b.batchNo === item.batchNo)?.id,
                clinicId: data.clinicId,
                remark: "采购入库",
                createdAt: new Date().toISOString(),
              });
            });
          }
        });
        return {
          purchaseOrders: [...state.purchaseOrders, newOrder],
          inventoryItems: updatedItems,
          inventoryBatches: [...state.inventoryBatches, ...newBatches],
          traceCodes: [...state.traceCodes, ...newTraceCodes],
          traceRecords: [...state.traceRecords, ...newTraceRecords],
        };
      }),
    addConsumeOrder: (data) =>
      set((state) => {
        const newOrder: ConsumeOrder = {
          ...data,
          id: generateId("co-"),
          createdAt: new Date().toISOString(),
        };
        const updatedItems = state.inventoryItems.map((item) => {
          const orderItem = data.items.find((oi) => oi.itemId === item.id);
          if (!orderItem) return item;
          return { ...item, currentStock: Math.max(0, item.currentStock - orderItem.quantity) };
        });
        const updatedTraceCodes = state.traceCodes.map((tc) => {
          const orderItem = data.items.find((oi) => oi.traceCode === tc.code);
          if (!orderItem) return tc;
          return {
            ...tc,
            status: "used" as const,
            usedByPatientId: data.patientId,
            usedAt: new Date().toISOString(),
            appointmentId: data.appointmentId,
          };
        });
        const newTraceRecords: TraceRecord[] = [];
        data.items.forEach((item) => {
          if (item.traceCode) {
            newTraceRecords.push({
              id: generateId("tr-"),
              traceCode: item.traceCode,
              action: "outbound" as const,
              itemId: item.itemId,
              batchId: item.batchId,
              patientId: data.patientId,
              appointmentId: data.appointmentId,
              clinicId: data.clinicId,
              remark: item.purpose || "消耗出库",
              createdAt: new Date().toISOString(),
            });
            newTraceRecords.push({
              id: generateId("tr-"),
              traceCode: item.traceCode,
              action: "used" as const,
              itemId: item.itemId,
              batchId: item.batchId,
              patientId: data.patientId,
              appointmentId: data.appointmentId,
              clinicId: data.clinicId,
              remark: "已使用",
              createdAt: new Date().toISOString(),
            });
          }
        });
        return {
          consumeOrders: [...state.consumeOrders, newOrder],
          inventoryItems: updatedItems,
          traceCodes: updatedTraceCodes,
          traceRecords: [...state.traceRecords, ...newTraceRecords],
        };
      }),
    addTraceRecord: (data) =>
      set((state) => ({
        traceRecords: [
          ...state.traceRecords,
          { ...data, id: generateId("tr-"), createdAt: new Date().toISOString() },
        ],
      })),

    updateMember: (id, data) =>
      set((state) => ({
        members: state.members.map((m) =>
          m.id === id ? { ...m, ...data } : m
        ),
      })),
    addPointsTx: (data) =>
      set((state) => {
        const newTx: PointsTx = {
          ...data,
          id: generateId("pt-"),
          createdAt: new Date().toISOString(),
        };
        const updatedMembers = state.members.map((m) => {
          if (m.id !== data.memberId) return m;
          const pointChange = data.type === "earn" ? data.points : -data.points;
          return { ...m, points: Math.max(0, m.points + pointChange) };
        });
        return {
          pointsTxs: [...state.pointsTxs, newTx],
          members: updatedMembers,
        };
      }),
    addStoredValueTx: (data) =>
      set((state) => {
        const newTx: StoredValueTx = {
          ...data,
          id: generateId("sv-"),
          createdAt: new Date().toISOString(),
        };
        const updatedMembers = state.members.map((m) => {
          if (m.id !== data.memberId) return m;
          const balanceChange = data.type === "recharge" ? data.amount : -data.amount;
          return { ...m, balance: Math.max(0, m.balance + balanceChange) };
        });
        return {
          storedValueTxs: [...state.storedValueTxs, newTx],
          members: updatedMembers,
        };
      }),
    addSettlement: (data) =>
      set((state) => {
        const existingSettled = state.settlements.find(
          (s) => s.appointmentId === data.appointmentId && s.status === "settled"
        );
        if (existingSettled) {
          throw new Error("该预约已结清，不能重复结算");
        }

        const amountPaid =
          data.cashAmount +
          data.cardAmount +
          data.wechatAlipayAmount +
          data.storedValueUsed +
          data.pointsDeduction +
          data.installmentAmount;

        const receivableAmount = data.totalAmount - data.discountAmount;

        const newSettlement: Settlement = {
          ...data,
          id: generateId("set-"),
          amountPaid,
          status: amountPaid >= receivableAmount - 0.01 ? "settled" : "partial",
          createdAt: new Date().toISOString(),
        };

        let updatedMembers = [...state.members];
        const newStoredValueTxs = [...state.storedValueTxs];
        const newPointsTxs = [...state.pointsTxs];
        const newInstallmentPlans = [...state.installmentPlans];

        if (data.memberId && data.storedValueUsed > 0) {
          const member = updatedMembers.find((m) => m.id === data.memberId);
          if (!member || member.balance < data.storedValueUsed) {
            throw new Error("储值卡余额不足");
          }
          updatedMembers = updatedMembers.map((m) => {
            if (m.id !== data.memberId) return m;
            return { ...m, balance: m.balance - data.storedValueUsed };
          });
          newStoredValueTxs.push({
            id: generateId("sv-"),
            memberId: data.memberId,
            amount: data.storedValueUsed,
            type: "consume",
            description: `消费扣款-${state.treatmentTypes.find((t) => t.id === state.appointments.find((a) => a.id === data.appointmentId)?.treatmentTypeId)?.name || "诊疗项目"}`,
            referenceId: data.appointmentId,
            staffId: data.operatorId,
            createdAt: new Date().toISOString(),
          });
        }

        if (data.memberId && data.pointsUsed > 0) {
          const member = updatedMembers.find((m) => m.id === data.memberId);
          if (!member || member.points < data.pointsUsed) {
            throw new Error("积分不足");
          }
          updatedMembers = updatedMembers.map((m) => {
            if (m.id !== data.memberId) return m;
            return { ...m, points: m.points - data.pointsUsed };
          });
          newPointsTxs.push({
            id: generateId("pt-"),
            memberId: data.memberId,
            type: "spend",
            points: data.pointsUsed,
            description: `积分抵扣诊疗费用`,
            referenceId: data.appointmentId,
            staffId: data.operatorId,
            createdAt: new Date().toISOString(),
          });
        }

        if (data.memberId && data.installmentAmount > 0 && data.primaryPaymentMethod === "installment") {
          const apt = state.appointments.find((a) => a.id === data.appointmentId);
          if (data.installmentId) {
            const idx = newInstallmentPlans.findIndex((ip) => ip.id === data.installmentId);
            if (idx >= 0) {
              const existingPlan = newInstallmentPlans[idx];
              const newTotalAmount = existingPlan.totalAmount + data.installmentAmount;
              const newPeriodAmount = Math.ceil((newTotalAmount / existingPlan.periods) * 100) / 100;
              newInstallmentPlans[idx] = {
                ...existingPlan,
                totalAmount: newTotalAmount,
                periodAmount: newPeriodAmount,
                description: `${existingPlan.description}（追加）`,
              };
            }
            newSettlement.installmentId = data.installmentId;
          } else {
            const periods = data.installmentPeriods || 6;
            const periodAmount = Math.ceil((data.installmentAmount / periods) * 100) / 100;
            const newInstallment: InstallmentPlan = {
              id: generateId("ip-"),
              memberId: data.memberId,
              appointmentId: data.appointmentId,
              totalAmount: data.installmentAmount,
              periods,
              periodAmount,
              paidPeriods: 0,
              status: "active",
              startDate: new Date().toISOString().split("T")[0],
              nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              description: apt
                ? `${state.treatmentTypes.find((t) => t.id === apt.treatmentTypeId)?.name || "诊疗项目"}分期(${periods}期)`
                : `诊疗分期(${periods}期)`,
              createdAt: new Date().toISOString(),
            };
            newInstallmentPlans.push(newInstallment);
            newSettlement.installmentId = newInstallment.id;
          }
        }

        return {
          settlements: [...state.settlements, newSettlement],
          members: updatedMembers,
          storedValueTxs: newStoredValueTxs,
          pointsTxs: newPointsTxs,
          installmentPlans: newInstallmentPlans,
        };
      }),
    addInstallmentPlan: (data) =>
      set((state) => ({
        installmentPlans: [
          ...state.installmentPlans,
          { ...data, id: generateId("ip-"), createdAt: new Date().toISOString() },
        ],
      })),
    updateInstallmentPlan: (id, data) =>
      set((state) => ({
        installmentPlans: state.installmentPlans.map((p) =>
          p.id === id ? { ...p, ...data } : p
        ),
      })),

    addTreatmentType: (data) =>
      set((state) => ({
        treatmentTypes: [
          ...state.treatmentTypes,
          { ...data, id: generateId("tt-"), createdAt: new Date().toISOString() },
        ],
      })),
    updateTreatmentType: (id, data) =>
      set((state) => ({
        treatmentTypes: state.treatmentTypes.map((t) =>
          t.id === id ? { ...t, ...data } : t
        ),
      })),

    addStaff: (data) =>
      set((state) => ({
        staff: [
          ...state.staff,
          { ...data, id: generateId("staff-"), createdAt: new Date().toISOString() },
        ],
      })),
    updateStaff: (id, data) =>
      set((state) => ({
        staff: state.staff.map((s) =>
          s.id === id ? { ...s, ...data } : s
        ),
      })),

    addClinic: (data) =>
      set((state) => ({
        clinics: [
          ...state.clinics,
          { ...data, id: generateId("clinic-"), createdAt: new Date().toISOString() },
        ],
      })),
    updateClinic: (id, data) =>
      set((state) => ({
        clinics: state.clinics.map((c) =>
          c.id === id ? { ...c, ...data } : c
        ),
      })),
  };
});
