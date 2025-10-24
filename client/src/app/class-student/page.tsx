"use client";

import { useEffect, useState, useTransition } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ky from "ky";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Home,
  ChevronDown,
  Trash2,
  CheckCircle,
  Users,
  GraduationCap,
  BookOpen,
  Edit,
  X,
  Save,
  GripVertical,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { API_URL } from "@/constants/url";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
type Student = { id: number; name: string; age: number };
type ClassType = { id: number; name: string };
type SectionType = { id: number; name: string };
type AllotmentPayload = {
  studentId: number;
  classId: number;
  sectionId: number;
};

type Allotment = {
  id: number;
  createdAt: string;
  studentId: number;
  studentName: string;
  studentAge: number;
  classId: number;
  className: string;
  sectionId: number;
  sectionName: string;
};

type ApiResponse<T> = { success: boolean; data: T[] };

// Sortable Row Component for Allotment Table
function SortableAllotmentRow({
  allotment,
  editingAllotment,
  newClassId,
  newSectionId,
  classes,
  sections,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
  onClassChange,
  onSectionChange,
  updateAllotmentMutation,
  deleteAllotmentMutation,
}: {
  allotment: Allotment;
  editingAllotment: number | null;
  newClassId: number | null;
  newSectionId: number | null;
  classes: ClassType[];
  sections: SectionType[];
  onStartEdit: (allotment: Allotment) => void;
  onCancelEdit: () => void;
  onSaveEdit: (allotmentId: number) => void;
  onRemove: (allotmentId: number) => void;
  onClassChange: (classId: number) => void;
  onSectionChange: (sectionId: number) => void;
  updateAllotmentMutation: any;
  deleteAllotmentMutation: any;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: allotment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center gap-2">
          <GripVertical
            className="h-4 w-4 cursor-grab text-gray-400 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          />
          <span className="font-mono text-sm">{allotment.studentId}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium">{allotment.studentName}</TableCell>
      <TableCell>{allotment.studentAge}</TableCell>
      <TableCell>
        {editingAllotment === allotment.id ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                {classes.find((c) => c.id === newClassId)?.name ||
                  "Select Class"}
                <ChevronDown size={14} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {classes.map((cls) => (
                <DropdownMenuItem
                  key={cls.id}
                  onClick={() => onClassChange(cls.id)}
                >
                  {cls.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          allotment.className
        )}
      </TableCell>
      <TableCell>
        {editingAllotment === allotment.id ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                {sections.find((s) => s.id === newSectionId)?.name ||
                  "Select Section"}
                <ChevronDown size={14} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {sections.map((section) => (
                <DropdownMenuItem
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                >
                  {section.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          allotment.sectionName
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {editingAllotment === allotment.id ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSaveEdit(allotment.id)}
                disabled={updateAllotmentMutation.isPending}
              >
                <Save size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                <X size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStartEdit(allotment)}
              >
                <Edit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(allotment.id)}
                disabled={deleteAllotmentMutation.isPending}
              >
                <Trash2 size={14} />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function StudentAllotment() {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionType | null>(
    null,
  );
  const [allottedStudents, setAllottedStudents] = useState<Student[]>([]);
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [editingAllotment, setEditingAllotment] = useState<number | null>(null);
  const [newClassId, setNewClassId] = useState<number | null>(null);
  const [newSectionId, setNewSectionId] = useState<number | null>(null);
  const [activeAllotment, setActiveAllotment] = useState<Allotment | null>(
    null,
  );

  // Queries
  const { data: students } = useQuery<ApiResponse<Student>>({
    queryKey: ["students"],
    queryFn: async () =>
      ky.get(`${API_URL}/api/students`).json<ApiResponse<Student>>(),
  });

  const { data: classes } = useQuery<ApiResponse<ClassType>>({
    queryKey: ["classes"],
    queryFn: async () =>
      ky.get(`${API_URL}/api/classes`).json<ApiResponse<ClassType>>(),
  });

  const { data: sections } = useQuery<ApiResponse<SectionType>>({
    queryKey: ["sections"],
    queryFn: async () =>
      ky.get(`${API_URL}/api/sections`).json<ApiResponse<SectionType>>(),
  });

  const { data: allotments, isLoading: isLoadingAllotments } = useQuery<
    ApiResponse<Allotment>
  >({
    queryKey: ["allotments"],
    queryFn: async () =>
      ky.get(`${API_URL}/api/allotments`).json<ApiResponse<Allotment>>(),
  });

  // Get current class-section allotments (sortable state)
  const [sortedAllotments, setSortedAllotments] = useState<Allotment[]>([]);

  // Update sorted allotments when data changes or filters change
  const currentAllotments =
    allotments?.data.filter(
      (allotment) =>
        allotment.classId === selectedClass?.id &&
        allotment.sectionId === selectedSection?.id,
    ) || [];

  // Update sortedAllotments when currentAllotments change
  useState(() => {
    setSortedAllotments(currentAllotments);
  });

  // Check if there are filters applied
  const hasFilters = selectedClass !== null || selectedSection !== null;

  // Mutations
  const createAllotmentMutation = useMutation({
    mutationFn: async (allotmentData: AllotmentPayload) => {
      const response = await ky
        .post(`${API_URL}/api/create-allotment`, {
          json: allotmentData,
        })
        .json();
      return response;
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ["allotments"] });
      });
      toast.success("Student allotted successfully");
    },
    onError: (error: any) => {
      console.error("Allotment error:", error);
      toast.error("Failed to allot student");
    },
  });

  const bulkAllotmentMutation = useMutation({
    mutationFn: async (allotments: AllotmentPayload[]) => {
      const results = await Promise.allSettled(
        allotments.map((allotment) =>
          ky
            .post(`${API_URL}/api/create-allotment`, { json: allotment })
            .json(),
        ),
      );
      return results;
    },
    onSuccess: (results) => {
      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ["allotments"] });
        setAllottedStudents([]);
      });
      const successCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      toast.success(
        `${successCount} student${successCount !== 1 ? "s" : ""} allotted successfully`,
      );
    },
    onError: () => {
      toast.error("Failed to allot students");
    },
  });

  const deleteAllotmentMutation = useMutation({
    mutationFn: async (allotmentId: number) => {
      const response = await ky
        .delete(`${API_URL}/api/allotments/${allotmentId}`)
        .json();
      return response;
    },
    onSuccess: (data: any) => {
      if (data.success) {
        startTransition(() => {
          queryClient.invalidateQueries({ queryKey: ["allotments"] });
        });
        toast.success(data.message || "Student removed from class-section");
      } else {
        toast.error(data.message || "Failed to remove student");
      }
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast.error("Failed to remove student");
    },
  });

  const updateAllotmentMutation = useMutation({
    mutationFn: async ({
      allotmentId,
      classId,
      sectionId,
    }: {
      allotmentId: number;
      classId: number;
      sectionId: number;
    }) => {
      const response = await ky
        .put(`${API_URL}/api/allotments/${allotmentId}`, {
          json: { classId, sectionId },
        })
        .json();
      return response;
    },
    onSuccess: (data: any) => {
      if (data.success) {
        startTransition(() => {
          queryClient.invalidateQueries({ queryKey: ["allotments"] });
        });
        setEditingAllotment(null);
        setNewClassId(null);
        setNewSectionId(null);
        toast.success(data.message || "Allotment updated successfully");
      } else {
        toast.error(data.message || "Failed to update allotment");
      }
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast.error("Failed to update allotment");
    },
  });

  // DnD Sensors for sortable
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Drag handlers for student to allotment
  const handleDragStart = (e: React.DragEvent, student: Student) => {
    setDraggedStudent(student);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (
      draggedStudent &&
      !allottedStudents.find((s) => s.id === draggedStudent.id) &&
      !currentAllotments?.find((a) => a.studentId === draggedStudent.id)
    ) {
      setAllottedStudents([...allottedStudents, draggedStudent]);
    }
    setDraggedStudent(null);
  };

  // Sortable handlers for allotment reordering
  const handleSortableDragStart = (event: DragStartEvent) => {
    const allotment = sortedAllotments.find((a) => a.id === event.active.id);
    setActiveAllotment(allotment || null);
  };

  const handleSortableDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAllotment(null);

    if (active.id !== over?.id) {
      setSortedAllotments((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Actions
  const handleRemoveStudent = (student: Student) => {
    setAllottedStudents(allottedStudents.filter((s) => s.id !== student.id));
  };

  const handleRemoveAllottedStudent = (allotmentId: number) => {
    deleteAllotmentMutation.mutate(allotmentId);
  };

  const handleStartEdit = (allotment: Allotment) => {
    setEditingAllotment(allotment.id);
    setNewClassId(allotment.classId);
    setNewSectionId(allotment.sectionId);
  };

  const handleCancelEdit = () => {
    setEditingAllotment(null);
    setNewClassId(null);
    setNewSectionId(null);
  };

  const handleSaveEdit = (allotmentId: number) => {
    if (newClassId !== null && newSectionId !== null) {
      updateAllotmentMutation.mutate({
        allotmentId,
        classId: newClassId,
        sectionId: newSectionId,
      });
    }
  };

  const handleSubmitAllotments = () => {
    if (!selectedClass || !selectedSection || allottedStudents.length === 0)
      return;

    const allotmentPayloads = allottedStudents.map((student) => ({
      studentId: student.id,
      classId: selectedClass.id,
      sectionId: selectedSection.id,
    }));

    bulkAllotmentMutation.mutate(allotmentPayloads);
  };

  const handleDirectAllot = (student: Student) => {
    if (!selectedClass || !selectedSection) return;

    createAllotmentMutation.mutate({
      studentId: student.id,
      classId: selectedClass.id,
      sectionId: selectedSection.id,
    });
  };

  const handleRefreshFilters = () => {
    setSelectedClass(null);
    setSelectedSection(null);
    setAllottedStudents([]);
    setSortedAllotments(allotments?.data || []);
    toast.success("Filters cleared");
  };

  // Update sortedAllotments when currentAllotments change
  useEffect(() => {
    setSortedAllotments(currentAllotments);
  }, [currentAllotments.length, selectedClass?.id, selectedSection?.id]);

  const isSelectionValid = selectedClass && selectedSection;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Student Allotment System</h1>
            <p className="text-muted-foreground mt-1">
              Assign students to classes and sections
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <Home size={16} /> Home
            </Link>
          </Button>
        </div>
        {/* Selection Panel */}
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Selection</h2>

          <div className="flex flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[180px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap size={16} />
                    {selectedClass?.name || "Select Class"}
                  </span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]">
                {classes?.data.map((cls) => (
                  <DropdownMenuItem
                    key={cls.id}
                    onClick={() => {
                      setSelectedClass(cls);
                      setAllottedStudents([]);
                    }}
                  >
                    {cls.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[180px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={16} />
                    {selectedSection?.name || "Select Section"}
                  </span>
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[180px]">
                {sections?.data.map((sec) => (
                  <DropdownMenuItem
                    key={sec.id}
                    onClick={() => {
                      setSelectedSection(sec);
                      setAllottedStudents([]);
                    }}
                  >
                    {sec.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh Button */}
            {hasFilters && (
              <Button
                onClick={handleRefreshFilters}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Clear Filters
              </Button>
            )}

            <div className="flex-1" />

            <Button
              onClick={handleSubmitAllotments}
              disabled={
                !isSelectionValid ||
                allottedStudents.length === 0 ||
                bulkAllotmentMutation.isPending ||
                isPending
              }
            >
              <CheckCircle size={16} className="mr-2" />
              {bulkAllotmentMutation.isPending || isPending
                ? "Submitting..."
                : `Submit ${allottedStudents.length > 0 ? `(${allottedStudents.length})` : ""}`}
            </Button>

            <Button
              onClick={() => setAllottedStudents([])}
              disabled={allottedStudents.length === 0}
              variant="outline"
            >
              Clear All
            </Button>
          </div>
        </div>
        {/* Tables Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Available Students */}
          <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="bg-muted/50 border-b px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Users size={20} />
                Available Students
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Students not allotted to{" "}
                {selectedClass?.name || "selected class"} -{" "}
                {selectedSection?.name || "selected section"}
              </p>
            </div>
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[80px]">Age</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.data
                    ?.filter(
                      (student) =>
                        !allottedStudents.find((s) => s.id === student.id) &&
                        !currentAllotments?.find(
                          (a) => a.studentId === student.id,
                        ),
                    )
                    .map((student) => (
                      <TableRow
                        key={student.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, student)}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <TableCell className="font-mono text-sm">
                          {student.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setAllottedStudents([
                                  ...allottedStudents,
                                  student,
                                ])
                              }
                              disabled={!isSelectionValid}
                            >
                              Add
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDirectAllot(student)}
                              disabled={
                                !isSelectionValid ||
                                createAllotmentMutation.isPending ||
                                isPending
                              }
                            >
                              Allot
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Allotment Zone with Sortable */}
          <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="bg-muted/50 border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {selectedClass?.name || "Class"} -{" "}
                {selectedSection?.name || "Section"}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {allottedStudents.length} student
                {allottedStudents.length !== 1 ? "s" : ""} ready to allot
                {sortedAllotments &&
                  sortedAllotments.length > 0 &&
                  ` • ${sortedAllotments.length} already allotted (drag to reorder)`}
              </p>
            </div>
            <div
              className={`max-h-[600px] min-h-[400px] overflow-auto transition-colors ${
                allottedStudents.length === 0 &&
                (!sortedAllotments || sortedAllotments.length === 0)
                  ? "bg-muted/20"
                  : ""
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleSortableDragStart}
                onDragEnd={handleSortableDragEnd}
              >
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[80px]">Age</TableHead>
                      <TableHead className="w-[150px]">Class</TableHead>
                      <TableHead className="w-[150px]">Section</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* New students to be allotted */}
                    {allottedStudents.map((student) => (
                      <TableRow
                        key={`new-${student.id}`}
                        className="bg-blue-50/50"
                      >
                        <TableCell className="font-mono text-sm">
                          {student.id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.name}
                        </TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {selectedClass?.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {selectedSection?.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStudent(student)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Existing allotted students - Sortable */}
                    <SortableContext
                      items={sortedAllotments.map((a) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sortedAllotments.map((allotment) => (
                        <SortableAllotmentRow
                          key={allotment.id}
                          allotment={allotment}
                          editingAllotment={editingAllotment}
                          newClassId={newClassId}
                          newSectionId={newSectionId}
                          classes={classes?.data || []}
                          sections={sections?.data || []}
                          onStartEdit={handleStartEdit}
                          onCancelEdit={handleCancelEdit}
                          onSaveEdit={handleSaveEdit}
                          onRemove={handleRemoveAllottedStudent}
                          onClassChange={setNewClassId}
                          onSectionChange={setNewSectionId}
                          updateAllotmentMutation={updateAllotmentMutation}
                          deleteAllotmentMutation={deleteAllotmentMutation}
                        />
                      ))}
                    </SortableContext>

                    {allottedStudents.length === 0 &&
                      (!sortedAllotments || sortedAllotments.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-24">
                            <div className="text-muted-foreground flex flex-col items-center gap-3">
                              <Users size={48} className="opacity-50" />
                              <p className="text-lg font-medium">
                                Drop students here
                              </p>
                              <p className="text-sm">or use the Add buttons</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>

                {/* Drag Overlay for Sortable */}
                <DragOverlay>
                  {activeAllotment ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {activeAllotment.studentName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {activeAllotment.className} -{" "}
                          {activeAllotment.sectionName}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
        {/* Current Allotments Summary */}

        <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-muted/50 border-b px-6 py-4">
            <h2 className="text-lg font-semibold">All Allotments Summary</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              View all student allotments across all classes and sections
            </p>
          </div>
          <div className="p-6">
            {isLoadingAllotments ? (
              <div className="text-muted-foreground py-12 text-center">
                Loading allotments...
              </div>
            ) : !allotments?.data || allotments.data.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                No allotments yet
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(
                  allotments.data.reduce(
                    (acc, allotment) => {
                      const key = `${allotment.className}-${allotment.sectionName}`;
                      if (!acc[key]) {
                        acc[key] = {
                          className: allotment.className,
                          sectionName: allotment.sectionName,
                          students: [],
                        };
                      }
                      acc[key].students.push(allotment);
                      return acc;
                    },
                    {} as Record<
                      string,
                      {
                        className: string;
                        sectionName: string;
                        students: Allotment[];
                      }
                    >,
                  ),
                ).map(([key, group]) => (
                  <div
                    key={key}
                    className="bg-muted/30 rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="bg-primary/10 text-primary rounded-lg px-3 py-1 text-sm font-semibold">
                        {group.className}
                      </div>
                      <div className="bg-secondary/10 text-secondary-foreground rounded-lg px-3 py-1 text-sm font-semibold">
                        {group.sectionName}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        {group.students.length} Student
                        {group.students.length !== 1 ? "s" : ""}
                      </div>
                      <div className="max-h-[200px] space-y-1 overflow-y-auto">
                        {group.students.map((allotment) => (
                          <div
                            key={allotment.id}
                            className="bg-card flex items-center justify-between rounded px-3 py-2 text-sm"
                          >
                            <span className="font-medium">
                              {allotment.studentName}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              Age {allotment.studentAge}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

{
  /* {!isSelectionValid && (
            <Alert className="mt-4">
              <AlertDescription>
                Please select both class and section to begin allotting students
              </AlertDescription>
            </Alert>
          )} */
}
