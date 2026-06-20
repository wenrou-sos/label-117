"use client";

import * as React from "react";
import {
  Plus,
  Edit2,
  Search,
  Clock,
  DollarSign,
  ArrowLeft,
  Timer,
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
import { cn, formatCurrency, formatDuration } from "@/lib/utils";
import type { TreatmentType } from "@/types";

const colorPresets = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#6366F1",
  "#F97316",
];

const categoryOptions = [
  "检查",
  "洁牙",
  "修复",
  "牙体牙髓",
  "外科",
  "种植",
  "正畸",
  "牙周",
  "儿童牙科",
  "其他",
];

interface TreatmentFormData {
  name: string;
  category: string;
  isRangeDuration: boolean;
  minDuration: number;
  maxDuration: number;
  price: number;
  color: string;
  description: string;
}

const initialFormData: TreatmentFormData = {
  name: "",
  category: "检查",
  isRangeDuration: false,
  minDuration: 30,
  maxDuration: 30,
  price: 0,
  color: colorPresets[0],
  description: "",
};

export default function TreatmentsPage() {
  const { treatmentTypes, addTreatmentType, updateTreatmentType } = useAppStore();
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTreatment, setEditingTreatment] = React.useState<TreatmentType | null>(null);
  const [formData, setFormData] = React.useState<TreatmentFormData>(initialFormData);

  const filteredTreatments = React.useMemo(() => {
    return treatmentTypes.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        if (!t.name.toLowerCase().includes(keyword) && !t.category.toLowerCase().includes(keyword)) {
          return false;
        }
      }
      return true;
    });
  }, [treatmentTypes, searchKeyword, categoryFilter]);

  const handleOpenModal = (item?: TreatmentType) => {
    if (item) {
      const isRange = item.minDuration !== item.maxDuration;
      setEditingTreatment(item);
      setFormData({
        name: item.name,
        category: item.category,
        isRangeDuration: isRange,
        minDuration: item.minDuration,
        maxDuration: item.maxDuration,
        price: item.price,
        color: item.color,
        description: item.description || "",
      });
    } else {
      setEditingTreatment(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTreatment(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      category: formData.category,
      minDuration: formData.minDuration,
      maxDuration: formData.isRangeDuration ? formData.maxDuration : formData.minDuration,
      price: formData.price,
      color: formData.color,
      description: formData.description || undefined,
    };
    if (editingTreatment) {
      updateTreatmentType(editingTreatment.id, data);
    } else {
      addTreatmentType(data);
    }
    handleCloseModal();
  };

  const categoryStats = React.useMemo(() => {
    const stats: Record<string, number> = { all: treatmentTypes.length };
    categoryOptions.forEach((cat) => {
      stats[cat] = treatmentTypes.filter((t) => t.category === cat).length;
    });
    return stats;
  }, [treatmentTypes]);

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
            <h1 className="text-xl font-semibold">治疗项目配置</h1>
            <p className="text-sm text-muted-foreground mt-1">
              共 {treatmentTypes.length} 个治疗项目
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" />
          新增项目
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索项目名称、分类..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              <Button
                variant={categoryFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
                className="h-8"
              >
                全部 {categoryStats.all}
              </Button>
              {categoryOptions.map((cat) => (
                (categoryStats[cat] || 0) > 0 && (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className="h-8"
                  >
                    {cat} {categoryStats[cat] || 0}
                  </Button>
                )
              ))}
            </div>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>项目名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>基础时长</TableHead>
                  <TableHead>是否区间时长</TableHead>
                  <TableHead>最短时长</TableHead>
                  <TableHead>最长时长</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>颜色标签</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      暂无项目数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTreatments.map((item) => {
                    const isRange = item.minDuration !== item.maxDuration;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 ml-5">
                              {item.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDuration(item.minDuration)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isRange ? (
                            <Badge variant="warning">是</Badge>
                          ) : (
                            <Badge variant="secondary">否</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDuration(item.minDuration)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDuration(item.maxDuration)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-success">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-md border border-input shadow-sm"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-muted-foreground font-mono">
                              {item.color}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">启用</Badge>
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
            <ModalTitle>{editingTreatment ? "编辑治疗项目" : "新增治疗项目"}</ModalTitle>
            <ModalDescription>
              {editingTreatment ? "修改治疗项目配置" : "配置治疗项目信息"}
            </ModalDescription>
          </ModalHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">项目名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：初诊检查"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">项目分类 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>治疗时长</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRangeDuration"
                      checked={formData.isRangeDuration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isRangeDuration: e.target.checked,
                          maxDuration: e.target.checked
                            ? Math.max(formData.maxDuration, formData.minDuration + 15)
                            : formData.minDuration,
                        })
                      }
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isRangeDuration" className="cursor-pointer text-sm font-normal text-muted-foreground">
                      区间时长
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minDuration">
                      {formData.isRangeDuration ? "最短时长（分钟）*" : "时长（分钟）*"}
                    </Label>
                    <Input
                      id="minDuration"
                      type="number"
                      min={15}
                      step={15}
                      value={formData.minDuration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minDuration: Math.max(15, parseInt(e.target.value) || 15),
                        })
                      }
                      required
                    />
                  </div>
                  {formData.isRangeDuration && (
                    <div className="space-y-2">
                      <Label htmlFor="maxDuration">最长时长（分钟）*</Label>
                      <Input
                        id="maxDuration"
                        type="number"
                        min={formData.minDuration}
                        step={15}
                        value={formData.maxDuration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDuration: Math.max(
                              formData.minDuration,
                              parseInt(e.target.value) || formData.minDuration
                            ),
                          })
                        }
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">价格（元）*</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={10}
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Math.max(0, parseFloat(e.target.value) || 0) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>颜色标签 *</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "w-8 h-8 rounded-md border-2 transition-all",
                        formData.color === color
                          ? "border-primary ring-2 ring-primary/30 scale-110"
                          : "border-input hover:border-primary/50"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground font-mono">
                      {formData.color}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">项目描述</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="可选，简要描述项目内容"
                />
              </div>
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                取消
              </Button>
              <Button type="submit">
                {editingTreatment ? "保存修改" : "确认新增"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
