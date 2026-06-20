"use client";

import * as React from "react";
import {
  Plus,
  Edit2,
  Search,
  User,
  Phone,
  Mail,
  Building2,
  ArrowLeft,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalDescription,
} from "@/components/ui/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import type { Staff, UserRole } from "@/types";

const roleMap: Record<UserRole, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" }> = {
  admin: { label: "集团管理员", variant: "default" },
  clinic_admin: { label: "门店管理员", variant: "warning" },
  doctor: { label: "医生", variant: "success" },
  receptionist: { label: "前台", variant: "secondary" },
  inventory_manager: { label: "物资管理员", variant: "secondary" },
};

interface StaffFormData {
  name: string;
  role: UserRole;
  clinicId: string;
  phone: string;
  email: string;
  title: string;
  specialty: string;
}

const initialFormData: StaffFormData = {
  name: "",
  role: "doctor",
  clinicId: "",
  phone: "",
  email: "",
  title: "",
  specialty: "",
};

export default function StaffPage() {
  const { clinics, staff, addStaff, updateStaff } = useAppStore();
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<Staff | null>(null);
  const [formData, setFormData] = React.useState<StaffFormData>(initialFormData);

  const filteredStaff = React.useMemo(() => {
    return staff.filter((s) => {
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchName = s.name.toLowerCase().includes(keyword);
        const matchPhone = s.phone.includes(keyword);
        const matchEmail = s.email?.toLowerCase().includes(keyword);
        if (!matchName && !matchPhone && !matchEmail) return false;
      }
      return true;
    });
  }, [staff, searchKeyword, roleFilter]);

  const handleOpenModal = (item?: Staff) => {
    if (item) {
      setEditingStaff(item);
      setFormData({
        name: item.name,
        role: item.role,
        clinicId: item.clinicId,
        phone: item.phone,
        email: item.email || "",
        title: item.title || "",
        specialty: item.specialty || "",
      });
    } else {
      setEditingStaff(null);
      setFormData({
        ...initialFormData,
        clinicId: clinics.length > 0 ? clinics[0].id : "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      role: formData.role,
      clinicId: formData.clinicId,
      phone: formData.phone,
      email: formData.email || undefined,
      title: formData.title || undefined,
      specialty: formData.specialty || undefined,
    };
    if (editingStaff) {
      updateStaff(editingStaff.id, data);
    } else {
      addStaff(data);
    }
    handleCloseModal();
  };

  const getClinicName = (clinicId: string) => {
    return clinics.find((c) => c.id === clinicId)?.name || "未知";
  };

  const roleStats = React.useMemo(() => {
    const stats: Record<string, number> = { all: staff.length };
    Object.keys(roleMap).forEach((role) => {
      stats[role] = staff.filter((s) => s.role === role).length;
    });
    return stats;
  }, [staff]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold">人员管理</h1>
            <p className="text-sm text-muted-foreground mt-1">
              共 {staff.length} 名员工
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" />
          新增员工
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名、电话、邮箱..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                <Button
                  variant={roleFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRoleFilter("all")}
                  className="h-8"
                >
                  全部 {roleStats.all}
                </Button>
                {Object.entries(roleMap).map(([role, info]) => (
                  <Button
                    key={role}
                    variant={roleFilter === role ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setRoleFilter(role)}
                    className="h-8"
                  >
                    {info.label} {roleStats[role] || 0}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>所属门店</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      暂无员工数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((item) => {
                    const roleInfo = roleMap[item.role];
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {(item.title || item.specialty) && (
                                <div className="text-xs text-muted-foreground">
                                  {item.title} {item.specialty}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{getClinicName(item.clinicId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{item.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.email ? (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{item.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">在职</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                            编辑
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-xl">
          <ModalHeader>
            <ModalTitle>{editingStaff ? "编辑员工" : "新增员工"}</ModalTitle>
            <ModalDescription>
              {editingStaff ? "修改员工信息" : "填写员工基本信息"}
            </ModalDescription>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入姓名"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">角色 *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleMap).map(([role, info]) => (
                        <SelectItem key={role} value={role}>
                          {info.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicId">所属门店 *</Label>
                <Select
                  value={formData.clinicId}
                  onValueChange={(v) => setFormData({ ...formData, clinicId: v })}
                >
                  <SelectTrigger id="clinicId">
                    <SelectValue placeholder="请选择门店" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">电话 *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入联系电话"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">职称</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="如：主任医师"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">专长</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="如：口腔种植"
                  />
                </div>
              </div>
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                取消
              </Button>
              <Button type="submit">
                {editingStaff ? "保存修改" : "确认新增"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
