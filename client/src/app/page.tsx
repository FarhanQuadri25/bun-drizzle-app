"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ky from "ky";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  UserPlus,
  Users,
  Loader2,
  Edit2,
  Trash2,
  X,
  Mail,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type User = {
  id: number;
  name: string;
  age: number;
  email: string;
};

type UsersResponse = { success: boolean; data: User[] };
type CreateUserResponse = { success: boolean; data: User; message: string };

const API_URL = "http://localhost:4000";

const userFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  age: z
    .number()
    .min(1, "Age must be at least 1")
    .max(120, "Age must be less than 120"),
  email: z.string().email("Invalid email address"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function Home() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: "", age: 0, email: "" },
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response: UsersResponse = await ky
        .get(`${API_URL}/api/users`)
        .json();
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (user: UserFormValues) => {
      if (editingUserId) {
        const response: CreateUserResponse = await ky
          .put(`${API_URL}/api/user/${editingUserId}`, { json: user })
          .json();
        return response.data;
      } else {
        const response: CreateUserResponse = await ky
          .post(`${API_URL}/api/create-user`, { json: user })
          .json();
        return response.data;
      }
    },
    onSuccess: (data) => {
      form.reset();
      setEditingUserId(null);
      toast.success(
        editingUserId
          ? `User updated successfully!`
          : `${data.name} has been added!`,
      );
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      toast.error(
        editingUserId ? "Failed to update user" : "Failed to add user",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await ky.delete(`${API_URL}/api/user/${id}`);
      return id;
    },
    onSuccess: (id) => {
      toast.success("User deleted successfully");
      queryClient.setQueryData<User[]>(["users"], (old = []) =>
        old.filter((u) => u.id !== id),
      );
    },
    onError: () => {
      toast.error("Failed to delete user");
    },
  });

  const onSubmit = (data: UserFormValues) => mutation.mutate(data);

  const handleEdit = (user: User) => {
    form.reset({ name: user.name, age: user.age, email: user.email });
    setEditingUserId(user.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    form.reset({ name: "", age: 0, email: "" });
    setEditingUserId(null);
  };

  const openDeleteDialog = (id: number) => {
    setDeleteUserId(id);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deleteUserId) {
      deleteMutation.mutate(deleteUserId);
    }
    setIsAlertOpen(false);
    setDeleteUserId(null);
  };

  if (!mounted) return null;

  return (
    <div className="from-background via-background to-muted/10 min-h-screen bg-linear-to-br">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              User Management System
            </h1>
            <p className="text-muted-foreground text-base">
              Create, update, and manage user accounts efficiently
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-11 w-11 rounded-full border-2 shadow-sm transition-all hover:scale-105"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Form Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl">
              <CardHeader className="space-y-3 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/15 rounded-xl p-3 shadow-sm">
                      {editingUserId ? (
                        <Edit2 className="text-primary h-6 w-6" />
                      ) : (
                        <UserPlus className="text-primary h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        {editingUserId ? "Edit User" : "Add New User"}
                      </CardTitle>
                      <CardDescription className="mt-1.5 text-base">
                        {editingUserId
                          ? "Update user information"
                          : "Fill in the details below"}
                      </CardDescription>
                    </div>
                  </div>
                  {editingUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter full name"
                              {...field}
                              className="bg-background/60 focus:bg-background h-11 backdrop-blur-sm transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Age
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter age"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              className="bg-background/60 focus:bg-background h-11 backdrop-blur-sm transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
                              className="bg-background/60 focus:bg-background h-11 backdrop-blur-sm transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-3 pt-2">
                      {editingUserId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className="h-11 flex-1 shadow-lg"
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingUserId ? "Updating..." : "Adding..."}
                          </>
                        ) : editingUserId ? (
                          <>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Update User
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add User
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Users Directory - Takes 3 columns */}
          <div className="lg:col-span-3">
            <Card className="border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl">
              <CardHeader className="space-y-3 pb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/15 rounded-xl p-3 shadow-sm">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">
                      Users Directory
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base">
                      {users
                        ? `Total: ${users.length} ${users.length === 1 ? "user" : "users"}`
                        : "Loading users..."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Loader2 className="text-primary mx-auto mb-4 h-10 w-10 animate-spin" />
                      <p className="text-muted-foreground text-sm">
                        Loading users...
                      </p>
                    </div>
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="max-h-[calc(100vh-300px)] space-y-3 overflow-y-auto pr-2">
                    {users.map((user) => (
                      <Card
                        key={user.id}
                        className={`group bg-background/60 border-border/50 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${
                          editingUserId === user.id
                            ? "ring-primary/50 border-primary/50 ring-2"
                            : "hover:border-primary/30"
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-1 items-start gap-4">
                              <div className="from-primary/20 to-primary/10 ring-primary/20 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1 transition-all group-hover:scale-105">
                                <span className="text-primary text-xl font-bold">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 space-y-2">
                                <h3 className="text-lg leading-tight font-bold">
                                  {user.name}
                                </h3>
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <Mail className="text-muted-foreground h-3.5 w-3.5" />
                                    <p className="text-muted-foreground text-sm">
                                      {user.email}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                                    <span className="bg-muted/80 rounded-lg px-2.5 py-1 text-xs font-medium">
                                      {user.age} years old
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(user)}
                                className="border-border/60 hover:border-primary/50 hover:bg-primary/10 h-9 w-9 shadow-sm transition-all hover:scale-105"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openDeleteDialog(user.id)}
                                className="h-9 w-9 border-red-200 text-red-600 shadow-sm transition-all hover:scale-105 hover:border-red-400 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="bg-muted/30 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full">
                      <Users className="text-muted-foreground h-10 w-10 opacity-50" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      No users found
                    </h3>
                    <p className="text-muted-foreground mb-6 text-sm">
                      Get started by adding your first user
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => document.querySelector("input")?.focus()}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Your First User
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="border-border/50 bg-card/95 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
              <Trash2 className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              This action cannot be undone. The user will be permanently removed
              from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="flex-1 bg-red-600 text-white shadow-lg hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
