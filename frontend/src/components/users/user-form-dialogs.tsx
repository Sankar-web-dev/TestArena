"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CircleAlertIcon,
  Loader2Icon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { ApiError } from "@/lib/api/client";
import type { ManagedUser } from "@/lib/api/types";
import {
  useCreateStudent,
  useResetStudentPassword,
  useUpdateStudent,
  useUpdateStudentStatus,
} from "@/hooks/mutations/use-user-mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

// ---------- create ----------

export function CreateUserDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createStudent = useCreateStudent();

  function reset() {
    setName("");
    setEmail("");
    setError(null);
  }

  function validate() {
    if (name.trim().length < 2)
      return "Enter the full name (min 2 characters)";
    if (!EMAIL_RE.test(email.trim()))
      return "Enter a valid email address";
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = validate();
    setError(message);
    if (message) return;

    createStudent.mutate(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
      {
        onSuccess: () => {
          toast.success("Student account created successfully.");
          onClose();
          reset();
        },
        onError: (err: unknown) => {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not create the account. Please try again.",
          );
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-electric/30 bg-electric/10 text-electric"
            >
              <ShieldCheckIcon />
              Role: Student
            </Badge>
            <span>set by the server</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error} />

          <div className="space-y-1.5">
            <Label htmlFor="cu-name">Full name</Label>
            <Input
              id="cu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-email">Email</Label>
            <Input
              id="cu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              autoComplete="off"
            />
          </div>

          <Alert>
            <ShieldCheckIcon />
            <AlertDescription>
              The username is generated from the name and the
              password is set to{" "}
              <span className="font-mono font-medium text-foreground">
                Saec@1234
              </span>{" "}
              — the student can change both after signing in.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStudent.isPending}
            >
              {createStudent.isPending && (
                <Loader2Icon className="animate-spin" />
              )}
              Create Student
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- edit ----------

export function EditUserDialog({
  user,
  onClose,
}: {
  user: ManagedUser | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!user}
      onOpenChange={(o) => !o && onClose()}
    >
      {user && (
        <EditUserForm
          key={user.id}
          user={user}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function EditUserForm({
  user,
  onClose,
}: {
  user: ManagedUser;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username ?? "");
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string | null>(null);

  const mutation = useUpdateStudent();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (name.trim().length < 2)
      return setError("Enter the full name (min 2 characters)");
    if (!USERNAME_RE.test(username.trim().toLowerCase()))
      return setError(
        "Username must be 3-30 chars: lowercase letters, numbers, _ . -",
      );
    if (!EMAIL_RE.test(email.trim()))
      return setError("Enter a valid email address");
    setError(null);

    mutation.mutate(
      {
        id: user.id,
        input: {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Student updated.");
          onClose();
        },
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not save changes. Please try again.",
          );
        },
      },
    );
  }

  return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update {user?.name}&apos;s profile details. Role
            cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error} />

          <div className="space-y-1.5">
            <Label htmlFor="eu-name">Full name</Label>
            <Input
              id="eu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eu-username">Username</Label>
            <Input
              id="eu-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eu-email">Email</Label>
            <Input
              id="eu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2Icon className="animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
  );
}

// ---------- reset password ----------

export function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: ManagedUser | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!user}
      onOpenChange={(o) => !o && onClose()}
    >
      {user && (
        <ResetPasswordForm
          key={user.id}
          user={user}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
}

function ResetPasswordForm({
  user,
  onClose,
}: {
  user: ManagedUser;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useResetStudentPassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!PASSWORD_RE.test(password))
      return setError(
        "Password must be 8+ chars with a letter and a number",
      );
    if (password !== confirm)
      return setError("Passwords do not match");
    setError(null);

    mutation.mutate(
      { id: user.id, password },
      {
        onSuccess: () => {
          toast.success("Password reset successfully.");
          onClose();
        },
        onError: (err) => {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not reset the password.",
          );
        },
      },
    );
  }

  return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <UserRoundIcon className="size-3.5" />
            Student: {user?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <CircleAlertIcon />
            <AlertDescription>
              This will change the student&apos;s
              login password and sign them out of all devices.
            </AlertDescription>
          </Alert>

          <FormError message={error} />

          <div className="space-y-1.5">
            <Label htmlFor="rp-password">New password</Label>
            <Input
              id="rp-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-confirm">
              Confirm password
            </Label>
            <Input
              id="rp-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending && <Loader2Icon className="animate-spin" />}
              Reset password
            </Button>
          </div>
        </form>
      </DialogContent>
  );
}

// ---------- activate / deactivate ----------

export function UserStatusDialog({
  user,
  onClose,
}: {
  user: ManagedUser | null;
  onClose: () => void;
}) {
  const mutation = useUpdateStudentStatus();

  const deactivating = user?.status === "ACTIVE";

  function handleConfirm() {
    if (!user) return;
    mutation.mutate(
      {
        id: user.id,
        status: deactivating ? "INACTIVE" : "ACTIVE",
      },
      {
        onSuccess: () => {
          toast.success(
            deactivating
              ? "Student deactivated."
              : "Student activated.",
          );
          onClose();
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Could not update the account status.",
          );
          onClose();
        },
      },
    );
  }

  return (
    <AlertDialog
      open={!!user}
      onOpenChange={(o) => !o && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deactivating ? "Deactivate" : "Activate"} this{" "}
            student?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deactivating
              ? `${user?.name} will no longer be able to sign in or access the platform. Their data is kept and the account can be reactivated later.`
              : `${user?.name} will regain access to the platform and can sign in again.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={deactivating ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            {deactivating ? "Deactivate" : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
