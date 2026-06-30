import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";

import { fetchUsers, updateUserRole, type UserRow } from "@/services/users";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { RoleBadge } from "@/components/ui/role-badge";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "User Management · Nimbus CRM" }] }),
  component: UsersPage,
});

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Sales Executive" },
  { value: "viewer", label: "Viewer" },
] as const;

function UsersPage() {
  const { user, role } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<typeof ROLE_OPTIONS[number]["value"]>("member");

  const usersQuery = useQuery({ queryKey: ["users"], queryFn: fetchUsers });
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role as any),
    onSuccess: () => {
      usersQuery.refetch();
      toast.success("Role updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to update role");
    },
  });

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-lg p-8 text-center">
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="mt-3 text-sm text-muted-foreground">Only administrators can manage users.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm shadow-slate-200/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Admin control</p>
            <h1 className="mt-2 text-2xl font-semibold">User management</h1>
            <p className="mt-2 text-sm text-muted-foreground">Review users, adjust roles, and keep your team organized.</p>
          </div>
          <div className="grid gap-3 sm:auto-cols-max sm:grid-flow-col">
            <Button variant="secondary" onClick={() => usersQuery.refetch()}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="h-14 px-4 py-3 bg-slate-100" colSpan={5} />
                  </tr>
                ))
              ) : (
                usersQuery.data?.map((userRow) => (
                  <tr key={userRow.user_id} className="border-t border-border/60 hover:bg-muted/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {userRow.full_name?.slice(0, 2).toUpperCase() ?? "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{userRow.full_name ?? userRow.email.split("@")[0]}</p>
                          <p className="truncate text-xs text-muted-foreground">{userRow.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={userRow.role} />
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {userRow.created_at ? new Date(userRow.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">Active</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Change role
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Change role for {userRow.full_name ?? userRow.email}</AlertDialogTitle>
                              <AlertDialogDescription>
                                Select the new role and confirm to update the user's access level.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="mt-4 space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="role-select">Role</Label>
                                <Select
                                  value={selectedUser?.user_id === userRow.user_id ? selectedRole : userRow.role}
                                  onValueChange={(value) => {
                                    setSelectedUser(userRow);
                                    setSelectedRole(value as any);
                                  }}
                                >
                                  <SelectTrigger id="role-select">
                                    <SelectValue placeholder={ROLE_LABELS[userRow.role]} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ROLE_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  const roleValue = selectedUser?.user_id === userRow.user_id ? selectedRole : userRow.role;
                                  updateRoleMutation.mutate({ userId: userRow.user_id, role: roleValue });
                                }}
                              >
                                {updateRoleMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
