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
import { Moon, Sun, UserPlus, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type User = {
  name: string;
  age: number;
  email: string;
};

type UsersResponse = {
  success: boolean;
  data: User[];
};

type CreateUserResponse = {
  success: boolean;
  data: User;
  message: string;
};

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

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      age: 0,
      email: "",
    },
  });

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response: UsersResponse = await ky
        .get(`${API_URL}/api/users`)
        .json();
      return response.data;
    },
  });

  // Create new user mutation with optimistic updates
  const createUserMutation = useMutation({
    mutationFn: async (newUser: User) => {
      const response: CreateUserResponse = await ky
        .post(`${API_URL}/api/create-user`, { json: newUser })
        .json();
      return response.data;
    },
    onMutate: async (newUser: User) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users"] });

      // Snapshot the previous value
      const previousUsers = queryClient.getQueryData<User[]>(["users"]);

      // Optimistically update to the new value
      queryClient.setQueryData<User[]>(["users"], (old = []) => [
        ...old,
        newUser,
      ]);

      // Show optimistic toast
      toast.loading("Adding user...", { id: "add-user" });

      // Return a context object with the snapshotted value
      return { previousUsers };
    },
    onError: (err, newUser, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["users"], context?.previousUsers);
      toast.error("Failed to add user", { id: "add-user" });
    },
    onSuccess: (data) => {
      form.reset();
      toast.success(`${data.name} has been added successfully!`, {
        id: "add-user",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const onSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="from-background via-background to-muted/20 min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage and create user accounts
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Add User Form */}
          <Card className="border-muted/40 bg-card/50 shadow-xl backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 rounded-lg p-2">
                  <UserPlus className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Add New User</CardTitle>
                  <CardDescription>Create a new user account</CardDescription>
                </div>
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
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            {...field}
                            className="bg-background/50"
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
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25"
                            {...field}
                            className="bg-background/50"
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                            className="bg-background/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding User...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="border-muted/40 bg-card/50 shadow-xl backdrop-blur-sm lg:row-span-2">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Users className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Users Directory</CardTitle>
                  <CardDescription>
                    {users ? `${users.length} total users` : "Loading users..."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : users && users.length > 0 ? (
                <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
                  {users.map((user) => (
                    <Card
                      key={user.email}
                      className="bg-background/50 border-muted/40 hover:border-primary/40 transition-all duration-200 hover:shadow-md"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 items-start gap-3">
                            <div className="bg-primary/10 mt-1 rounded-full p-2">
                              <span className="text-primary text-sm font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 space-y-1">
                              <h3 className="text-lg leading-none font-semibold">
                                {user.name}
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                {user.email}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="bg-muted rounded-md px-2 py-1 text-xs">
                                  Age: {user.age}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="text-muted-foreground">No users found</p>
                  <p className="text-muted-foreground/60 mt-1 text-sm">
                    Add your first user to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
