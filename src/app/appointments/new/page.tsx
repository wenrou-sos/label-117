"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/store";
import { formatDate, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from "@/components/ui/Modal";
import {
  Search,
  UserPlus,
  Calendar,
  Clock,
  Stethoscope,
  MapPin,
  User,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const { clinics, staff, patients, treatmentTypes, selectedClinicId, selectedDate, addAppointment, addPatient } = useAppStore();

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string>(selectedClinicId || (clinics.length > 0 ? clinics[0].id : ""));
  const [staffId, setStaffId] = useState<string>("");
  const [treatmentTypeId, setTreatmentTypeId] = useState<string>("");
  const [date, setDate] = useState<string>(selectedDate || formatDate(new Date()));
  const [startTime, setStartTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(30);
  const [notes, setNotes] = useState<string>("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    phone: "",
    gender: "male" as "male" | "female",
    birthday: "",
  });

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return [];
    const keyword = patientSearch.toLowerCase();
    return patients.filter(
      (p) => p.name.toLowerCase().includes(keyword) || p.phone.includes(keyword)
    ).slice(0, 10);
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => s.clinicId === clinicId && (s.role === "doctor" || s.role === "admin"));
  }, [staff, clinicId]);

  const selectedTreatment = useMemo(() => {
    return treatmentTypes.find((t) => t.id === treatmentTypeId) || null;
  }, [treatmentTypes, treatmentTypeId]);

  const durationOptions = useMemo(() => {
    if (!selectedTreatment) return [];
    const options: number[] = [];
    for (let m = selectedTreatment.minDuration; m <= selectedTreatment.maxDuration; m += 15) {
      options.push(m);
    }
    if (options.length === 0) {
      options.push(selectedTreatment.minDuration);
    }
    return options;
  }, [selectedTreatment]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setPatientSearch(patients.find((p) => p.id === patientId)?.name || "");
    setShowPatientDropdown(false);
  };

  const handleTreatmentChange = (id: string) => {
    setTreatmentTypeId(id);
    const treatment = treatmentTypes.find((t) => t.id === id);
    if (treatment) {
      setDuration(treatment.minDuration);
    }
  };

  const handleCreatePatient = () => {
    if (!newPatientForm.name || !newPatientForm.phone) return;
    const patientData = {
      name: newPatientForm.name,
      phone: newPatientForm.phone,
      gender: newPatientForm.gender,
      birthday: newPatientForm.birthday || undefined,
    };
    addPatient(patientData);
    const newPatient = patients[patients.length - 1];
    if (newPatient) {
      setSelectedPatientId(newPatient.id);
      setPatientSearch(newPatient.name);
    }
    setShowNewPatient(false);
    setNewPatientForm({ name: "", phone: "", gender: "male", birthday: "" });
  };

  const handleSubmit = () => {
    if (!selectedPatientId) {
      alert("请选择患者");
      return;
    }
    if (!clinicId) {
      alert("请选择门店");
      return;
    }
    if (!staffId) {
      alert("请选择医生");
      return;
    }
    if (!treatmentTypeId) {
      alert("请选择治疗项目");
      return;
    }
    if (!date || !startTime) {
      alert("请选择日期和时间");
      return;
    }

    const endTime = addMinutesToTime(startTime, duration);

    addAppointment({
      patientId: selectedPatientId,
      staffId,
      clinicId,
      treatmentTypeId,
      date,
      startTime,
      endTime,
      duration,
      status: "pending",
      notes: notes || undefined,
    });

    alert("预约创建成功！");
    router.push("/appointments");
  };

  const endTime = addMinutesToTime(startTime, duration);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/appointments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">新建预约</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-auto">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                患者信息
              </h2>

              {selectedPatient ? (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{selectedPatient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedPatient.phone}
                          {selectedPatient.birthday && ` · ${selectedPatient.birthday}`}
                          {selectedPatient.gender && ` · ${selectedPatient.gender === "male" ? "男" : "女"}`}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedPatientId(null);
                      setPatientSearch("");
                    }}>
                      <X className="h-4 w-4" />
                      更换
                    </Button>
                  </div>
                  {selectedPatient.notes && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      备注：{selectedPatient.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索患者姓名或手机号"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="pl-9"
                    />
                    {showPatientDropdown && patientSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg bg-background shadow-lg z-20 max-h-60 overflow-auto">
                        {filteredPatients.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            未找到匹配的患者
                          </div>
                        ) : (
                          filteredPatients.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 hover:bg-muted cursor-pointer flex items-center gap-3 border-b last:border-b-0"
                              onClick={() => handleSelectPatient(p.id)}
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                                {p.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.phone}</div>
                              </div>
                              <Check className="h-4 w-4 text-primary opacity-0" />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setShowNewPatient(true)}>
                    <UserPlus className="h-4 w-4" />
                    新建患者
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                门店与医生
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">选择门店</label>
                  <Select value={clinicId} onValueChange={(v) => {
                    setClinicId(v);
                    setStaffId("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择门店" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">选择医生</label>
                  <Select value={staffId} onValueChange={setStaffId} disabled={!clinicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择医生" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStaff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.title ? `(${s.title})` : ""}
                          {s.specialty ? ` - ${s.specialty}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                治疗项目
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">选择项目</label>
                  <Select value={treatmentTypeId} onValueChange={handleTreatmentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择治疗项目" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatmentTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              ¥{t.price} · {t.minDuration === t.maxDuration ? `${t.minDuration}分钟` : `${t.minDuration}-${t.maxDuration}分钟`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTreatment && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTreatment.color }} />
                          {selectedTreatment.name}
                        </div>
                        {selectedTreatment.description && (
                          <div className="text-sm text-muted-foreground mt-1">{selectedTreatment.description}</div>
                        )}
                        <div className="text-sm text-muted-foreground mt-1">分类：{selectedTreatment.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-primary">¥{selectedTreatment.price}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                预约时间
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">预约日期</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">开始时间</label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    治疗时长
                    {selectedTreatment && (
                      <span className="text-muted-foreground font-normal ml-2">
                        （{selectedTreatment.minDuration === selectedTreatment.maxDuration
                          ? `固定 ${selectedTreatment.minDuration} 分钟`
                          : `可选 ${selectedTreatment.minDuration}-${selectedTreatment.maxDuration} 分钟`}）
                      </span>
                    )}
                  </label>
                  {durationOptions.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {durationOptions.map((d) => (
                        <Button
                          key={d}
                          variant={duration === d ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDuration(d)}
                        >
                          {formatDuration(d)}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-9 flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatDuration(duration)}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    预约时段：<span className="font-medium">{startTime}</span> - <span className="font-medium">{endTime}</span>
                    <Badge variant="secondary" className="ml-2">{formatDuration(duration)}</Badge>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">备注</h2>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                placeholder="请输入预约备注信息..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-0 lg:h-fit">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">预约摘要</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">患者</span>
                  <span className="font-medium text-right">{selectedPatient?.name || "未选择"}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">门店</span>
                  <span className="font-medium text-right">{clinics.find((c) => c.id === clinicId)?.name || "未选择"}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">医生</span>
                  <span className="font-medium text-right">{staff.find((s) => s.id === staffId)?.name || "未选择"}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">项目</span>
                  <span className="font-medium text-right">{selectedTreatment?.name || "未选择"}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">日期</span>
                  <span className="font-medium text-right">{date || "未选择"}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">时间</span>
                  <span className="font-medium text-right">{startTime} - {endTime}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-muted-foreground">时长</span>
                  <span className="font-medium text-right">{formatDuration(duration)}</span>
                </div>
                {selectedTreatment && (
                  <>
                    <div className="border-t pt-3 my-3" />
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground">项目费用</span>
                      <span className="font-semibold text-primary text-base">¥{selectedTreatment.price}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Link href="/appointments" className="flex-1">
              <Button variant="outline" className="w-full">取消</Button>
            </Link>
            <Button className="flex-1" onClick={handleSubmit}>
              <Check className="h-4 w-4" />
              确认预约
            </Button>
          </div>
        </div>
      </div>

      <Modal open={showNewPatient} onOpenChange={setShowNewPatient}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>新建患者</ModalTitle>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">姓名 *</label>
              <Input
                placeholder="请输入患者姓名"
                value={newPatientForm.name}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">手机号 *</label>
              <Input
                placeholder="请输入手机号"
                value={newPatientForm.phone}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">性别</label>
                <Select
                  value={newPatientForm.gender}
                  onValueChange={(v: "male" | "female") => setNewPatientForm({ ...newPatientForm, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">出生日期</label>
                <Input
                  type="date"
                  value={newPatientForm.birthday}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, birthday: e.target.value })}
                />
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowNewPatient(false)}>取消</Button>
            <Button onClick={handleCreatePatient} disabled={!newPatientForm.name || !newPatientForm.phone}>
              <Check className="h-4 w-4" />
              创建
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
