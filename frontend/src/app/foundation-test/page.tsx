"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, ApiError } from "@/lib/api/client";
import { useAuth } from "@/components/providers/auth-provider";

type HealthResponse = {
  success: boolean;
  message: string;
};

export default function FoundationTestPage() {
  const { user, isPending } = useAuth();
  const [inputValue, setInputValue] = useState("");

  // useQuery demo — hits the real backend /api/health endpoint
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: () => apiRequest<HealthResponse>("/api/health"),
    retry: 0,
  });

  // useMutation demo — re-hits /api/health as a fake "action"
  const pingMutation = useMutation({
    mutationFn: () =>
      apiRequest<HealthResponse>("/api/health"),
    onSuccess: (data) => {
      toast.success("Mutation succeeded", {
        description: data.message,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? `${error.status}: ${error.message}`
          : "Mutation failed",
      );
    },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold">
        Foundation Test — shadcn/ui + TanStack Query
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>TanStack Query — useQuery</CardTitle>
          <CardDescription>
            Fetches GET /api/health from the NestJS backend
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          {healthQuery.isPending && (
            <Badge variant="secondary">Loading…</Badge>
          )}
          {healthQuery.isError && (
            <Badge variant="destructive">
              {healthQuery.error instanceof ApiError
                ? `${healthQuery.error.status} ${healthQuery.error.message}`
                : "Request failed"}
            </Badge>
          )}
          {healthQuery.data && (
            <>
              <Badge>OK</Badge>
              <span className="text-sm">
                {healthQuery.data.message}
              </span>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => healthQuery.refetch()}
          >
            Refetch
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>TanStack Query — useMutation</CardTitle>
          <CardDescription>
            Fires a request and shows a Sonner toast
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button
            onClick={() => pingMutation.mutate()}
            disabled={pingMutation.isPending}
          >
            {pingMutation.isPending ? "Pinging…" : "Ping backend"}
          </Button>
          {pingMutation.isSuccess && (
            <Badge variant="secondary">Mutation OK</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>shadcn components</CardTitle>
          <CardDescription>
            Input, Dialog, Badge, Table, Button
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            placeholder="Type something…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger
                render={<Button variant="outline" />}
              >
                Open Dialog
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog works</DialogTitle>
                  <DialogDescription>
                    shadcn Dialog is rendering correctly.
                    Input value: {inputValue || "(empty)"}
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            <Button
              variant="secondary"
              onClick={() => toast("Toast from Sonner")}
            >
              Show toast
            </Button>

            <Badge>Badge</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>shadcn Table</TableCell>
                <TableCell>
                  <Badge>Rendering</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Better Auth session</TableCell>
                <TableCell>
                  {isPending ? (
                    <Badge variant="secondary">Loading…</Badge>
                  ) : user ? (
                    <Badge>{user.email}</Badge>
                  ) : (
                    <Badge variant="outline">
                      Not logged in
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
