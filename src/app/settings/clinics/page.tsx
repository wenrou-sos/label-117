"use client";

import * as React from "react";
import {
  Plus,
  Edit2,
  Search,
  Building2,
  Phone,
  MapPin,
  Clock,
  Crown,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
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
import { Label } from "@/components/ui/Label";
import type { Clinic } from "@/types";

interface ClinicFormData {
  name: string;
  address: string;
  phone: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  isMain: boolean;
}

const initialFormData: ClinicFormData = {
  name: "",
  address: "",
  phone: "",
  workingHoursStart: "09:00",
  workingHoursEnd: "21:00",
  isMain: false,
};

export default function ClinicsPage() {
  const { clinics, addClinic, updateClinic, staff } = useAppStore();
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingClinic, setEditingClinic] = React.useState<Clinic | null>(null);
  const [formData, setFormData] = React.useState<ClinicFormData>(initialFormData);

  const filteredClinics = React.useMemo(() => {
    if (!searchKeyword) return clinics;
    const keyword = searchKeyword.toLowerCase();
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(keyword) ||
        c.address.toLowerCase().includes(keyword) ||
        c.phone.includes(keyword)
    );
  }, [clinics, searchKeyword]);

  const handleOpenModal = (clinic?: Clinic) => {
    if (clinic) {
      setEditingClinic(clinic);
      setFormData({
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        workingHoursStart: clinic.workingHours.start,
        workingHoursEnd: clinic.workingHours.end,
        isMain: clinic.isMain,
      });
    } else {
      setEditingClinic(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClinic(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      workingHours: {
        start: formData.workingHoursStart,
        end: formData.workingHoursEnd,
      },
      isMain: formData.isMain,
    };
    if (editingClinic) {
      updateClinic(editingClinic.id, data);
    } else {
      addClinic(data);
    }
    handleCloseModal();
  };

  const getStaffCount = (clinicId: string) => {
    return staff.filter((s) => s.clinicId === clinicId).length;
  };

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
            <h1 className="text-xl font-semibold">门店管理</h1>
            <p className="text-sm text-muted-foreground mt-1">
              共 {clinics.length} 家门店
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" />
          新增门店
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索门店名称、地址、电话..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>门店名称</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>营业时间</TableHead>
                  <TableHead>员工数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClinics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      暂无门店数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClinics.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{clinic.name}</span>
                          {clinic.isMain && (
                            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                              <Crown className="h-3 w-3 mr-0.5" />
                              总店
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-sm">{clinic.address}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{clinic.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {clinic.workingHours.start} - {clinic.workingHours.end}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getStaffCount(clinic.id)} 人</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">营业中</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(clinic)}
                        >
                          <Edit2 className="h-4 w-4" />
                          编辑
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{editingClinic ? "编辑门店" : "新增门店"}</ModalTitle>
            <ModalDescription>
              {editingClinic ? "修改门店信息" : "填写门店基本信息"}
            </ModalDescription>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">门店名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入门店名称"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">门店地址 *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="请输入门店地址"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">联系电话 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入联系电话"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workingHoursStart">营业开始时间</Label>
                  <Input
                    id="workingHoursStart"
                    type="time"
                    value={formData.workingHoursStart}
                    onChange={(e) =>
                      setFormData({ ...formData, workingHoursStart: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingHoursEnd">营业结束时间</Label>
                  <Input
                    id="workingHoursEnd"
                    type="time"
                    value={formData.workingHoursEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, workingHoursEnd: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMain"
                  checked={formData.isMain}
                  onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <Label htmlFor="isMain" className="cursor-pointer">
                  设为主店
                </Label>
              </div>
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                取消
              </Button>
              <Button type="submit">
                {editingClinic ? "保存修改" : "确认新增"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
