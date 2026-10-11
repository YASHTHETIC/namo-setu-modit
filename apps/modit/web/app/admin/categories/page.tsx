"use client";

import { useMemo, useState } from "react";
import { Plus, X, Power, Check, Tags } from "lucide-react";
import {
  useCategories, useSubCategories, useCreateCategory, useUpdateCategory,
  useCreateSubCategory, useUpdateSubCategory,
} from "@/lib/modit-api";
import { logAdminActivity } from "@/lib/admin-activity";
import { useToast } from "@foundation/ui";
import { Stagger } from "@/components/fx";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

const inputCls =
  "w-full rounded-xl border border-[#DDD6EE] bg-white px-3 py-2.5 text-body-sm text-[#150726] focus:outline-none focus:border-[#2D1B69]";

export default function AdminCategoriesPage() {
  const toast = useToast();
  const { data: categories = [], isLoading } = useCategories();
  const { data: allSubs = [] } = useSubCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const createSub = useCreateSubCategory();
  const updateSub = useUpdateSubCategory();

  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null);
  const [subDrafts, setSubDrafts] = useState<Record<string, string>>({});
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});

  const subsByCat = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of allSubs as any[]) {
      (map[s.category_id] ||= []).push(s);
    }
    return map;
  }, [allSubs]);

  const mutate = (
    fn: (vars: any, opts?: any) => void,
    vars: any,
    okMsg: [string, string],
    log: [any, string]
  ) => {
    fn(vars, {
      onSuccess: () => {
        logAdminActivity(log[0], log[1]);
        toast.success(okMsg[0], okMsg[1]);
      },
      onError: (e: any) => toast.error("Failed", e?.message || "Need staff login."),
    } as any);
  };

  const saveCategory = () => {
    const name = catName.trim();
    if (name.length < 2) {
      toast.error("Invalid name", "Use at least 2 characters.");
      return;
    }
    if (editingCat) {
      mutate(updateCat.mutate, { id: editingCat.id, payload: { name } }, ["Saved", name], ["category.update", `Category renamed to "${name}"`]);
    } else {
      mutate(
        createCat.mutate,
        { name, slug: slugify(name) },
        ["Category added", name],
        ["category.create", `Category "${name}" created`]
      );
    }
    setCatName("");
    setEditingCat(null);
    setShowCatForm(false);
  };

  const addSub = (categoryId: string) => {
    const name = (subDrafts[categoryId] ?? "").trim();
    if (name.length < 2) {
      toast.error("Invalid name", "Use at least 2 characters.");
      return;
    }
    mutate(
      createSub.mutate,
      { category_id: categoryId, name, slug: slugify(name) },
      ["Subcategory added", name],
      ["category.create", `Subcategory "${name}" created`]
    );
    setSubDrafts((m) => ({ ...m, [categoryId]: "" }));
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-title-lg font-extrabold text-[#150726]">Categories</h1>
          <p className="text-caption text-[#6B5B83] mt-0.5">
            {(categories as any[]).length} categories · {(allSubs as any[]).length} subcategories · deactivating hides them store-wide
          </p>
        </div>
        <button
          onClick={() => { setEditingCat(null); setCatName(""); setShowCatForm(true); }}
          className="btn-shine flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2D1B69] text-white text-caption font-bold hover:bg-[#1E1245]"
        >
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      {isLoading && <p className="mt-4 text-caption text-[#9B8CB5]">Loading categories…</p>}

      <div className="mt-4 space-y-3">
        <Stagger step={60}>
          {(categories as any[]).map((c) => {
            const subs = subsByCat[c.id] ?? [];
            const open = openSubs[c.id] ?? subs.length > 0;
            return (
              <div key={c.id} className={`rounded-2xl border bg-white p-4 ${c.is_active ? "border-[#DDD6EE]" : "border-dashed border-[#DDD6EE] opacity-70"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="h-9 w-9 rounded-xl bg-[#F0ECF9] flex items-center justify-center shrink-0">
                    <Tags className="h-4 w-4 text-[#2D1B69]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md font-extrabold text-[#150726] truncate">{c.name}</p>
                    <p className="text-micro text-[#9B8CB5] font-mono">/{c.slug} · {subs.length} sub</p>
                  </div>
                  {!c.is_active && (
                    <span className="rounded-full bg-[#F0ECF9] px-2 py-0.5 text-tiny font-black text-[#9B8CB5]">HIDDEN</span>
                  )}
                  <button
                    onClick={() => {
                      mutate(updateCat.mutate, { id: c.id, payload: { is_active: !c.is_active } },
                        [c.is_active ? "Hidden" : "Visible", c.name],
                        ["category.update", `Category "${c.name}" ${c.is_active ? "hidden" : "shown"}`]);
                    }}
                    title={c.is_active ? "Hide" : "Show"}
                    className={`p-2 rounded-lg border transition-all ${c.is_active ? "border-[#7CB518]/40 text-[#7CB518] bg-[#F0F9E8]" : "border-[#DDD6EE] text-[#9B8CB5]"}`}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setEditingCat({ id: c.id, name: c.name }); setCatName(c.name); setShowCatForm(true); }}
                    className="px-3 py-2 rounded-lg bg-[#2D1B69] text-white text-micro font-bold hover:bg-[#1E1245]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setOpenSubs((m) => ({ ...m, [c.id]: !open }))}
                    className="px-3 py-2 rounded-lg border border-[#DDD6EE] text-micro font-bold text-[#2D1B69] hover:border-[#2D1B69]"
                  >
                    {open ? "Hide subs" : `Subs (${subs.length})`}
                  </button>
                </div>

                {open && (
                  <div className="mt-3 space-y-2 border-t border-[#F0ECF9] pt-3">
                    {subs.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-xl bg-[#F7F4FC] px-3 py-2">
                        <p className="flex-1 min-w-0 text-caption font-bold text-[#150726] truncate">
                          {s.name} <span className="font-mono font-medium text-[#9B8CB5]">/{s.slug}</span>
                        </p>
                        {!s.is_active && (
                          <span className="rounded-full bg-[#F0ECF9] px-2 py-0.5 text-tiny font-black text-[#9B8CB5]">HIDDEN</span>
                        )}
                        <button
                          onClick={() => {
                            mutate(updateSub.mutate, { id: s.id, payload: { is_active: !s.is_active } },
                              [s.is_active ? "Hidden" : "Visible", s.name],
                              ["category.update", `Subcategory "${s.name}" ${s.is_active ? "hidden" : "shown"}`]);
                          }}
                          className="p-1.5 rounded-lg border border-[#DDD6EE] text-[#9B8CB5] hover:text-[#7CB518] hover:border-[#7CB518]/40"
                          title={s.is_active ? "Hide" : "Show"}
                        >
                          <Power className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        placeholder="New subcategory name…"
                        value={subDrafts[c.id] ?? ""}
                        onChange={(e) => setSubDrafts((m) => ({ ...m, [c.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") addSub(c.id); }}
                        className={inputCls}
                      />
                      <button
                        onClick={() => addSub(c.id)}
                        className="px-4 rounded-xl bg-[#7CB518] text-white text-caption font-bold hover:bg-[#6A9C14] shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Stagger>
      </div>

      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowCatForm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-body-md font-extrabold text-[#150726]">{editingCat ? "Rename category" : "New category"}</h2>
              <button onClick={() => setShowCatForm(false)} className="p-1.5 rounded-lg text-[#9B8CB5] hover:bg-[#F7F4FC]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="block text-micro font-bold text-[#150726] mb-1.5">Name</label>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveCategory(); }}
              placeholder="e.g. Electrical"
              autoFocus
              className={inputCls}
            />
            {!editingCat && catName.trim().length >= 2 && (
              <p className="mt-1.5 text-micro text-[#9B8CB5] font-mono">/{slugify(catName)}</p>
            )}
            <button
              onClick={saveCategory}
              disabled={createCat.isPending || updateCat.isPending}
              className="btn-shine mt-3 w-full h-11 rounded-xl bg-[#2D1B69] text-white text-body-sm font-bold hover:bg-[#1E1245] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> {editingCat ? "Save" : "Create category"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
