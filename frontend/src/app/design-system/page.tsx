"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MedalIcon,
  TargetIcon,
  TimerIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
} from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ResponsiveContainer } from "@/components/common/responsive-container";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="accent-line pl-4 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

const leaderboard = [
  { rank: 1, name: "Aarav Sharma", score: 96, pct: 96.0 },
  { rank: 2, name: "Diya Patel", score: 91, pct: 91.0 },
  { rank: 3, name: "Rohan Mehta", score: 88, pct: 88.0 },
];

export default function DesignSystemPage() {
  const [progress, setProgress] = useState(62);

  return (
    <main className="min-h-screen bg-background pb-16">
      {/* Dark navy hero band */}
      <div className="bg-navy text-navy-foreground">
        <ResponsiveContainer className="relative overflow-hidden py-10">
          <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative space-y-2">
            <Badge className="bg-electric/15 text-electric border-electric/30">
              Design System
            </Badge>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              SAEC TestArena — Visual Foundation
            </h1>
            <p className="max-w-xl text-sm text-navy-foreground/70">
              Deep navy surfaces, electric blue accents, tabular
              numerals for scores and timers. All components are
              responsive from 375px up.
            </p>
          </div>
        </ResponsiveContainer>
      </div>

      <ResponsiveContainer className="mt-8 space-y-12">
        {/* Primitives */}
        <Section title="Primitives">
          <PageHeader
            title="Contest Dashboard"
            description="PageHeader primitive with actions slot"
            actions={
              <>
                <Button variant="outline" size="sm">
                  Export
                </Button>
                <Button
                  size="sm"
                  className="bg-electric text-electric-foreground hover:bg-electric/90 glow-electric"
                >
                  Start Contest
                </Button>
              </>
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Students"
              value={412}
              hint="+18 this hour"
              icon={<UsersIcon />}
              accent="electric"
            />
            <StatCard
              label="Avg. Score"
              value="78.4%"
              hint="Last 24 hours"
              icon={<TargetIcon />}
            />
            <StatCard
              label="Top Rank"
              value="#1"
              hint="Aarav Sharma"
              icon={<TrophyIcon />}
              accent="warning"
            />
            <StatCard
              label="Time Left"
              value="24:17"
              hint="Data Structures Midterm"
              icon={<TimerIcon />}
              accent="destructive"
            />
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button
                className="bg-electric text-electric-foreground hover:bg-electric/90"
              >
                Electric CTA
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </CardContent>
          </Card>
        </Section>

        {/* Badges & status */}
        <Section title="Badges & Status">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2">
              <StatusBadge status="DRAFT" />
              <StatusBadge status="READY" />
              <StatusBadge status="PUBLISHED" />
              <StatusBadge status="LIVE" />
              <StatusBadge status="ENDED" />
              <StatusBadge status="VERIFIED" />
              <StatusBadge status="REJECTED" />
              <StatusBadge status="IN_PROGRESS" />
              <StatusBadge status="SUBMITTED" />
              <StatusBadge status="EXPIRED" />
              <Badge variant="outline">Outline</Badge>
              <Badge variant="secondary">Secondary</Badge>
            </CardContent>
          </Card>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ds-title">Test title</Label>
                <Input
                  id="ds-title"
                  placeholder="Algorithms Final"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-code">Access code</Label>
                <Input
                  id="ds-code"
                  placeholder="••••••"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-error">Invalid input</Label>
                <Input
                  id="ds-error"
                  aria-invalid
                  defaultValue="bad value"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-disabled">Disabled</Label>
                <Input
                  id="ds-disabled"
                  disabled
                  placeholder="Not editable"
                />
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Table */}
        <Section title="Table — Leaderboard">
          <Card>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">
                        Score
                      </TableHead>
                      <TableHead className="text-right">
                        Percentage
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((row) => (
                      <TableRow
                        key={row.rank}
                        className="transition-colors hover:bg-muted/60"
                      >
                        <TableCell>
                          <span className="numeric inline-flex size-7 items-center justify-center rounded-md bg-muted font-semibold">
                            {row.rank}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.name}
                        </TableCell>
                        <TableCell className="numeric text-right font-semibold">
                          {row.score}
                        </TableCell>
                        <TableCell className="numeric text-right text-muted-foreground">
                          {row.pct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Tabs + Progress + Alerts */}
        <Section title="Tabs · Progress · Alerts">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="live">Live Exam</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Completion</CardTitle>
                  <CardDescription>
                    62 of 100 questions answered
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={progress} />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setProgress((p) => Math.max(0, p - 10))
                      }
                    >
                      -10%
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setProgress((p) => Math.min(100, p + 10))
                      }
                    >
                      +10%
                    </Button>
                    <span className="numeric ml-auto text-sm font-semibold text-electric">
                      {progress}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="live" className="pt-4">
              <Card>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex size-2">
                      <span className="animate-pulse-dot absolute inline-flex size-full rounded-full bg-live" />
                    </span>
                    <span className="text-sm font-medium">
                      Exam in progress
                    </span>
                  </div>
                  <span className="numeric font-heading text-xl font-semibold text-destructive">
                    00:24:17
                  </span>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-3 pt-4">
              <Alert>
                <CheckCircle2Icon />
                <AlertTitle>Answers synced</AlertTitle>
                <AlertDescription>
                  All responses are saved to the server.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertCircleIcon />
                <AlertTitle>Connection unstable</AlertTitle>
                <AlertDescription>
                  Answer saves may be delayed. Keep working —
                  changes are queued locally.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </Section>

        {/* Dialogs + States */}
        <Section title="Dialogs & States">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger
                  render={<Button variant="outline" />}
                >
                  Open Dialog
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enter test</DialogTitle>
                    <DialogDescription>
                      You are about to start the exam. The timer
                      begins immediately.
                    </DialogDescription>
                  </DialogHeader>
                  <Input placeholder="Test password" />
                  <Button
                    className="bg-electric text-electric-foreground hover:bg-electric/90"
                    onClick={() => toast.success("Exam started")}
                  >
                    Begin
                  </Button>
                </DialogContent>
              </Dialog>

              <ConfirmDialog
                trigger={
                  <Button variant="destructive">
                    Submit attempt
                  </Button>
                }
                title="Submit your exam?"
                description="You won't be able to change answers after submission. This action is final."
                confirmLabel="Submit"
                destructive
                onConfirm={() =>
                  toast.success("Attempt submitted")
                }
              />

              <Button
                variant="secondary"
                onClick={() =>
                  toast("Saved", {
                    description: "Answer saved at 21:42:07",
                  })
                }
              >
                Toast
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loading state</CardTitle>
              </CardHeader>
              <CardContent>
                <LoadingState rows={2} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Empty state</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-4">
                <EmptyState
                  icon={<MedalIcon />}
                  title="No results yet"
                  description="Results appear here once students submit their attempts."
                  className="border-0"
                />
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Skeleton + responsive grid demo */}
        <Section title="Skeletons & Responsive Grid">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} size="sm">
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="numeric h-7 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Grid collapses to 1 column on mobile (375px), 2 on
            tablet (768px), 3–4 on desktop. Tables scroll
            horizontally below 768px.
          </p>
        </Section>
      </ResponsiveContainer>
    </main>
  );
}
