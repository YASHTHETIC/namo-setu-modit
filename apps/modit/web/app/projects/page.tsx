"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects, useCreateProject } from "@/lib/modit-api";
import { FolderOpen, Plus, X, Calendar, IndianRupee, AlertCircle, RefreshCw } from "lucide-react";
import { Button, Input, Textarea, Card, EmptyState, LoadingSpinner, FormRow, StatusPill } from "@/lib/modit-ui";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", notes: "", budget_amount: "" });
  const { data: projects, isLoading, isError, error, refetch } = useProjects();
  const createProject = useCreateProject();
  const projectList = projects ?? [];

  const handleCreateProject = async () => {
    if (!newProject.name) return;
    try {
      await createProject.mutateAsync({ name: newProject.name, notes: newProject.notes, budget_amount: parseFloat(newProject.budget_amount) || null } as never);
      setShowCreateModal(false);
      setNewProject({ name: "", notes: "", budget_amount: "" });
    } catch {}
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Projects</h1>
          <p className="text-[var(--text-secondary)]">Manage construction projects and sites</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> New Project</Button>
      </div>

      {isLoading ? <LoadingSpinner /> : isError ? (
        <div className="rounded-2xl border border-red-200/60 bg-gradient-to-br from-red-50 to-rose-50 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-900">Failed to load data</h3>
              <p className="mt-1 text-sm text-red-700/80">{error?.message || "Please try again later"}</p>
            </div>
            <button onClick={() => refetch()} className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition-all hover:bg-red-700">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        </div>
      ) : projectList.length === 0 ? (
        <EmptyState icon={<FolderOpen className="h-8 w-8" />} title="No projects yet" description="Create your first construction project to get started" action={<Button onClick={() => setShowCreateModal(true)}>Create Project</Button>} />
      ) : (
        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <motion.div key={project.id} variants={fadeUp} whileHover={{ y: -2 }}>
              <Card className="p-6 h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">{project.name ?? `#${project.id.slice(0, 8)}`}</h3>
                  <StatusPill status={project.status ?? "active"} />
                </div>
                {project.notes && <p className="mb-3 text-sm text-[var(--text-secondary)] line-clamp-2">{project.notes}</p>}
                {project.budget_amount != null && (
                  <div className="mb-3 flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                    <IndianRupee className="h-3.5 w-3.5" /> Budget: ₹{(project.budget_amount ?? 0).toLocaleString()}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  {project.start_date && (
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Calendar className="h-3 w-3" /> {new Date(project.start_date).toLocaleDateString()}
                    </div>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">Code: {project.project_code}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-xl border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h4 text-[var(--text-primary)]">New Project</h2>
                <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <FormRow label="Name" required>
                  <Input value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} placeholder="e.g. Commercial Building" />
                </FormRow>
                <FormRow label="Notes">
                  <Textarea rows={3} value={newProject.notes} onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })} />
                </FormRow>
                <FormRow label="Budget (₹)">
                  <Input type="number" value={newProject.budget_amount} onChange={(e) => setNewProject({ ...newProject, budget_amount: e.target.value })} placeholder="0" />
                </FormRow>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={handleCreateProject} disabled={createProject.isPending}>{createProject.isPending ? "Creating..." : "Create Project"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
