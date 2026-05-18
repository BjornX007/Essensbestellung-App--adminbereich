"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Menu,
  X,
  Check,
  Utensils,
  Salad,
  UtensilsCrossed,
  ChevronDown,
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { useTranslation } from "@/app/lib/i18n/context";
import styles from "./menu.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = {
  id: string; name: string; slug: string;
  description: string | null; image_url: string | null;
  sort_order: number; is_visible: boolean;
};

type Product = {
  id: string; category_id: string; name: string; slug: string;
  description: string | null; price: string; image_url: string | null;
  is_available: boolean; is_featured: boolean; sort_order: number;
};

type Allergen = { id: string; name: string; icon?: string | null };
type Additive = { id: string; name: string; code?: string | null };

type OptionValue = {
  id?: string;
  label: string;
  price_delta: number;
  is_default: boolean;
};

type OptionGroup = {
  id: string;
  name: string;
  selection_type: "single" | "multi";
  is_required: boolean;
  sort_order: number;
  values: OptionValue[];
};

const EMPTY_CAT: Omit<Category, "id"> = {
  name: "", slug: "", description: "", image_url: "",
  sort_order: 0, is_visible: true,
};

const EMPTY_PROD = (category_id: string): Omit<Product, "id"> => ({
  category_id, name: "", slug: "", description: "",
  price: "", image_url: "", is_available: true,
  is_featured: false, sort_order: 0,
});

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error ?? "Request failed");
  }
  return res.json();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: "ok" | "err"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return (
    <div className={`${styles.toast} ${type === "ok" ? styles.toastOk : styles.toastErr}`}>
      {type === "ok" ? <Check size={14} /> : <X size={14} />} {msg}
    </div>
  );
}

// ─── Confirm ─────────────────────────────────────────────────────────────────
function Confirm({ title, desc, onConfirm, onCancel }: {
  title: string; desc: string; onConfirm: () => void; onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
        <div className={styles.confirmTitle}>{title}</div>
        <div className={styles.confirmDesc}>{desc}</div>
        <div className={styles.confirmActions}>
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={onCancel}>
            {t("menu.cancel")}
          </button>
          <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={onConfirm}>
            {t("menu.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OptionGroupEditor ────────────────────────────────────────────────────────
function OptionGroupEditor({
  group, onChange, onRemove,
}: {
  group: OptionGroup;
  onChange: (g: OptionGroup) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  function upValue(i: number, patch: Partial<OptionValue>) {
    const values = group.values.map((v, j) => j === i ? { ...v, ...patch } : v);
    onChange({ ...group, values });
  }
  function addValue() {
    onChange({ ...group, values: [...group.values, { label: "", price_delta: 0, is_default: false }] });
    setOpen(true);
  }
  function removeValue(i: number) {
    onChange({ ...group, values: group.values.filter((_, j) => j !== i) });
  }

  return (
    <div style={{
      border: "0.5px solid var(--color-border-tertiary, var(--border))",
      borderRadius: "var(--border-radius-lg, 10px)",
      marginBottom: 10,
      background: "var(--color-background-primary, var(--bg))",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 6, flex: 1,
            color: "var(--color-text-primary, var(--ink))",
          }}
        >
          <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          <span style={{ fontWeight: 500, fontSize: 13 }}>{group.name || "Unnamed group"}</span>
          <span style={{
            fontSize: 11, padding: "2px 7px", borderRadius: 20,
            background: "var(--color-background-secondary, var(--bg2))",
            color: "var(--color-text-secondary, var(--ink2))",
          }}>
            {group.values.length} option{group.values.length !== 1 ? "s" : ""}
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary, var(--ink2))", padding: 4 }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {open && (
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 10 }}>
            <input
              value={group.name}
              placeholder="Group name…"
              onChange={e => onChange({ ...group, name: e.target.value })}
              style={{ fontSize: 13 }}
            />
            <select
              value={group.selection_type}
              onChange={e => onChange({ ...group, selection_type: e.target.value as "single" | "multi" })}
              style={{ fontSize: 12 }}
            >
              <option value="multi">Multi-select</option>
              <option value="single">Single-select</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-secondary, var(--ink2))", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={group.is_required} onChange={e => onChange({ ...group, is_required: e.target.checked })} />
              Required
            </label>
          </div>

          {group.values.map((v, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 60px auto",
              gap: 6, alignItems: "center", marginBottom: 6,
            }}>
              <input
                value={v.label}
                placeholder="Option label…"
                onChange={e => upValue(i, { label: e.target.value })}
                style={{ fontSize: 13 }}
              />
              <input
                type="number" step="0.01" min="0"
                value={v.price_delta}
                onChange={e => upValue(i, { price_delta: parseFloat(e.target.value) || 0 })}
                style={{ fontSize: 12, textAlign: "right" }}
                title="+Price delta"
              />
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary, var(--ink2))" }}>
                <input type="checkbox" checked={v.is_default} onChange={e => upValue(i, { is_default: e.target.checked })} />
                Default
              </label>
              <button type="button" onClick={() => removeValue(i)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary, var(--ink2))", padding: 2 }}>
                <X size={11} />
              </button>
            </div>
          ))}

          <button type="button" onClick={addValue}
            style={{
              fontSize: 12, background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-info, var(--accent))", display: "flex", alignItems: "center", gap: 4, padding: "4px 0",
            }}>
            <Plus size={12} /> Add option
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Category Modal ───────────────────────────────────────────────────────────
// ─── Category Modal (updated) ─────────────────────────────────────────────────
// Replace your existing CategoryModal with this version.
// Key changes:
//   • Options tab now shows ALL option groups as a checkbox list
//   • Checking/unchecking toggles membership in this category's group set
//   • New groups can still be created inline and are auto-selected
//   • Save logic is unchanged — only the checked groups get persisted

function CategoryModal({ cat, onSave, onClose }: {
  cat: Category | null; onSave: (c: Category) => void; onClose: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!cat;
  const [form, setForm] = useState<Omit<Category, "id">>(cat ? { ...cat } : { ...EMPTY_CAT });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"details" | "options">("details");

  // All globally available option groups
  const [allGroups, setAllGroups] = useState<OptionGroup[]>([]);
  // IDs of groups that are checked (assigned to this category)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Brand-new groups created in this session (not yet in DB), always selected
  const [newGroups, setNewGroups] = useState<OptionGroup[]>([]);

  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    setGroupsLoading(true);
    const baseReq = apiFetch("/api/option-groups").catch(() => []);
    const assignedReq = isEdit
      ? apiFetch(`/api/categories/${cat!.id}/option-groups`).catch(() => [])
      : Promise.resolve([]);

    Promise.all([baseReq, assignedReq])
      .then(([all, assigned]: [OptionGroup[], OptionGroup[]]) => {
        setAllGroups(Array.isArray(all) ? all : []);
        // Pre-check only the groups already assigned to this category
        setSelectedIds(new Set((Array.isArray(assigned) ? assigned : []).map(g => g.id)));
      })
      .finally(() => setGroupsLoading(false));
  }, []);

  function up<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "name" && !isEdit) next.slug = slugify(v as string);
      return next;
    });
  }

  function toggleGroup(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function addNewGroup() {
    const newGroup: OptionGroup = {
      id: `_new_${Date.now()}`,
      name: "", selection_type: "multi", is_required: false,
      sort_order: allGroups.length + newGroups.length,
      values: [],
    };
    setNewGroups(gs => [...gs, newGroup]);
    setTab("options");
  }

  function removeNewGroup(id: string) {
    setNewGroups(gs => gs.filter(g => g.id !== id));
  }

  // How many groups are active (selected existing + all new)
  const activeCount = selectedIds.size + newGroups.length;

  async function handleSave() {
    if (!form.name.trim()) { setErr(t("menu.catModal.nameRequired")); return; }
    setLoading(true); setErr("");
    try {
      const savedCat: Category = isEdit
        ? await apiFetch(`/api/categories/${cat!.id}`, { method: "PUT", body: JSON.stringify(form) })
        : await apiFetch("/api/categories", { method: "POST", body: JSON.stringify(form) });

      // Sync option groups (graceful degradation if endpoints not yet implemented)
      try {
        const resolvedIds: string[] = [...selectedIds];

        // Create any brand-new groups first, collect their real IDs
        for (const g of newGroups) {
          const created: OptionGroup = await apiFetch("/api/option-groups", {
            method: "POST",
            body: JSON.stringify({
              name: g.name,
              selection_type: g.selection_type,
              is_required: g.is_required,
              sort_order: g.sort_order,
              values: g.values,
            }),
          });
          resolvedIds.push(created.id);
        }

        // Persist the relation: exactly the selected IDs for this category
        await apiFetch(`/api/categories/${savedCat.id}/option-groups`, {
          method: "PUT",
          body: JSON.stringify({ group_ids: resolvedIds }),
        });
      } catch {
        // Option group APIs not yet implemented — save category anyway
      }

      onSave(savedCat);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("menu.toast.failedLoad"));
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHandle} />
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>
              {isEdit ? t("menu.catModal.titleEdit") : t("menu.catModal.titleNew")}
            </div>
            <div className={styles.modalSub}>{t("menu.catModal.sub")}</div>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "0.5px solid var(--border)", padding: "0 1.25rem" }}>
          {(["details", "options"] as const).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                padding: "8px 14px", fontSize: 13, background: "none", border: "none",
                cursor: "pointer",
                borderBottom: tab === key ? "2px solid var(--ink)" : "2px solid transparent",
                fontWeight: tab === key ? 500 : 400,
                color: tab === key ? "var(--ink)" : "var(--ink2)",
                marginBottom: -1,
              }}
            >
              {key === "details"
                ? "Details"
                : `Option groups${activeCount > 0 ? ` (${activeCount})` : ""}`}
            </button>
          ))}
        </div>

        <div className={styles.modalBody}>
          {/* ── Details tab ─────────────────────────────────────────── */}
          {tab === "details" && (
            <>
              <div className={styles.field}>
                <label>{t("menu.catModal.name")}</label>
                <input ref={nameRef} value={form.name} placeholder={t("menu.catModal.namePlaceholder")}
                  onChange={e => up("name", e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>{t("menu.catModal.slug")}</label>
                <input value={form.slug} placeholder={t("menu.catModal.slugPlaceholder")}
                  onChange={e => up("slug", slugify(e.target.value))} />
                <span className={styles.fieldHint}>{t("menu.catModal.slugHint")}</span>
              </div>
              <div className={styles.field}>
                <label>{t("menu.catModal.description")}</label>
                <textarea value={form.description ?? ""} placeholder={t("menu.catModal.descPlaceholder")}
                  onChange={e => up("description", e.target.value)} />
              </div>
              <ImageUpload
                label={t("menu.catModal.name")} type="category"
                value={form.image_url ?? ""} onChange={url => up("image_url", url)}
              />
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>{t("menu.catModal.sortOrder")}</label>
                  <input type="number" value={form.sort_order}
                    onChange={e => up("sort_order", Number(e.target.value))} />
                </div>
              </div>
              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>{t("menu.catModal.visible")}</div>
                  <div className={styles.toggleDesc}>{t("menu.catModal.visibleDesc")}</div>
                </div>
                <button
                  className={`${styles.toggle} ${form.is_visible ? styles.toggleOn : styles.toggleOff}`}
                  onClick={() => up("is_visible", !form.is_visible)}
                />
              </div>
            </>
          )}

          {/* ── Option groups tab ───────────────────────────────────── */}
          {tab === "options" && (
            <>
              <div style={{ fontSize: 12, color: "var(--ink2)", marginBottom: 14, lineHeight: 1.5 }}>
                Check which option groups apply to products in{" "}
                <strong>{form.name || "this category"}</strong>. Only checked groups
                will be saved for this category.
              </div>

              {/* ── Existing groups (checkbox list) ── */}
              {groupsLoading && (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <span className={styles.spinner} />
                </div>
              )}

              {!groupsLoading && allGroups.length === 0 && (
                <div style={{
                  padding: "1rem", textAlign: "center", borderRadius: 10,
                  background: "var(--bg2)", fontSize: 13, color: "var(--ink2)", marginBottom: 12,
                }}>
                  No global option groups yet. Create one below.
                </div>
              )}

              {!groupsLoading && allGroups.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
                    color: "var(--ink3)", textTransform: "uppercase", marginBottom: 8,
                  }}>
                    Available groups
                  </div>
                  {allGroups.map(g => {
                    const checked = selectedIds.has(g.id);
                    return (
                      <label
                        key={g.id}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "10px 12px", borderRadius: 8, marginBottom: 6,
                          border: `0.5px solid ${checked ? "var(--accent, var(--ink))" : "var(--border)"}`,
                          background: checked ? "var(--color-background-accent, color-mix(in srgb, var(--accent, var(--ink)) 6%, transparent))" : "var(--bg)",
                          cursor: "pointer", transition: "border-color .12s, background .12s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          style={{ marginTop: 2, accentColor: "var(--accent, var(--ink))", flexShrink: 0 }}
                          onChange={() => toggleGroup(g.id)}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{g.name || "Unnamed group"}</div>
                          {g.values.length > 0 && (
                            <div style={{ fontSize: 11, color: "var(--ink2)", marginTop: 3 }}>
                              {g.selection_type} · {g.is_required ? "required" : "optional"} ·{" "}
                              {g.values.slice(0, 4).map(v =>
                                `${v.label}${v.price_delta ? ` (+€${Number(v.price_delta).toFixed(2)})` : ""}`
                              ).join(", ")}
                              {g.values.length > 4 && ` +${g.values.length - 4} more`}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* ── New groups created in this session ── */}
              {newGroups.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
                    color: "var(--ink3)", textTransform: "uppercase", marginBottom: 8,
                  }}>
                    New groups (will be created on save)
                  </div>
                  {newGroups.map(g => (
                    <OptionGroupEditor
                      key={g.id}
                      group={g}
                      onChange={updated => setNewGroups(gs => gs.map(x => x.id === g.id ? updated : x))}
                      onRemove={() => removeNewGroup(g.id)}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addNewGroup}
                style={{
                  fontSize: 12, padding: "7px 12px", borderRadius: 8,
                  background: "var(--bg2)", color: "var(--ink)",
                  border: "0.5px solid var(--border)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, width: "100%",
                  justifyContent: "center",
                }}
              >
                <Plus size={12} /> Create new option group
              </button>
            </>
          )}

          {err && <div className={styles.errText}>{err}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
            {t("menu.cancel")}
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : isEdit ? t("menu.save") : t("menu.catModal.createBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ product, categoryId, onSave, onClose }: {
  product: Product | null; categoryId: string;
  onSave: (p: Product) => void; onClose: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!product;
  const [form, setForm] = useState<Omit<Product, "id">>(product ? { ...product } : EMPTY_PROD(categoryId));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [additives, setAdditives] = useState<Additive[]>([]);
  const [selAllergens, setSelAllergens] = useState<Set<string>>(new Set());
  const [selAdditives, setSelAdditives] = useState<Set<string>>(new Set());

  const [inheritedGroups, setInheritedGroups] = useState<OptionGroup[]>([]);
  const [excludedGroupIds, setExcludedGroupIds] = useState<Set<string>>(new Set());
  const [optionsExpanded, setOptionsExpanded] = useState(false);

  useEffect(() => { nameRef.current?.focus(); }, []);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/allergens"),
      apiFetch("/api/additives"),
      // Graceful: return [] if option-groups endpoint doesn't exist yet
      apiFetch(`/api/categories/${categoryId}/option-groups`).catch(() => []),
      isEdit
        ? apiFetch(`/api/products/${product!.id}/relations`)
        : Promise.resolve({ allergen_ids: [], additive_ids: [], excluded_group_ids: [] }),
    ]).then(([al, ad, catOptionGroups, rel]) => {
      setAllergens(al);
      setAdditives(ad);
      setInheritedGroups(Array.isArray(catOptionGroups) ? catOptionGroups : []);
      setSelAllergens(new Set(rel.allergen_ids ?? []));
      setSelAdditives(new Set(rel.additive_ids ?? []));
      setExcludedGroupIds(new Set(rel.excluded_group_ids ?? []));
    }).catch(() => {});
  }, []);

  function up<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "name" && !isEdit) next.slug = slugify(v as string);
      return next;
    });
  }

  const toggleTag = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setFn(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  async function handleSave() {
    if (!form.name.trim()) { setErr(t("menu.prodModal.nameRequired")); return; }
    if (!form.price) { setErr(t("menu.prodModal.priceRequired")); return; }
    setLoading(true); setErr("");
    try {
      const payload = {
        ...form,
        allergen_ids: [...selAllergens],
        additive_ids: [...selAdditives],
        // Only include excluded_group_ids if we actually have inherited groups
        ...(inheritedGroups.length > 0 ? { excluded_group_ids: [...excludedGroupIds] } : {}),
      };
      const result = isEdit
        ? await apiFetch(`/api/products/${product!.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      onSave(result);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("menu.toast.failedLoad"));
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHandle} />
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>
              {isEdit ? t("menu.prodModal.titleEdit") : t("menu.prodModal.titleNew")}
            </div>
            <div className={styles.modalSub}>{t("menu.prodModal.sub")}</div>
          </div>
          <button className={styles.modalClose} onClick={onClose}><X size={14} /></button>
        </div>
        <div className={styles.modalBody}>
          <ImageUpload
            label={t("menu.prodModal.name")} type="product"
            value={form.image_url ?? ""} onChange={url => up("image_url", url)}
          />
          <div className={styles.field}>
            <label>{t("menu.prodModal.name")}</label>
            <input ref={nameRef} value={form.name} placeholder={t("menu.prodModal.namePlaceholder")}
              onChange={e => up("name", e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>{t("menu.prodModal.slug")}</label>
            <input value={form.slug} placeholder={t("menu.prodModal.slugPlaceholder")}
              onChange={e => up("slug", slugify(e.target.value))} />
          </div>
          <div className={styles.field}>
            <label>{t("menu.prodModal.description")}</label>
            <textarea value={form.description ?? ""} placeholder={t("menu.prodModal.descPlaceholder")}
              onChange={e => up("description", e.target.value)} />
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>{t("menu.prodModal.price")}</label>
              <input type="number" step="0.01" min="0" value={form.price}
                placeholder={t("menu.prodModal.pricePlaceholder")}
                onChange={e => up("price", e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>{t("menu.prodModal.sortOrder")}</label>
              <input type="number" value={form.sort_order}
                onChange={e => up("sort_order", Number(e.target.value))} />
            </div>
          </div>

          {/* Inherited option groups — only shown if any exist */}
          {inheritedGroups.length > 0 && (
            <div className={styles.tagField}>
              <button
                type="button"
                onClick={() => setOptionsExpanded(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "none",
                  border: "none", cursor: "pointer", padding: 0, width: "100%",
                }}
              >
                <label style={{ cursor: "pointer", fontWeight: 500 }}>Option groups</label>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 20,
                  background: "var(--bg2)", color: "var(--ink2)",
                }}>
                  {inheritedGroups.length - excludedGroupIds.size} active
                </span>
                <ChevronDown size={13} style={{
                  marginLeft: "auto",
                  transform: optionsExpanded ? "rotate(180deg)" : "none",
                  transition: "transform .15s",
                }} />
              </button>
              <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 2 }}>
                Inherited from category — uncheck to exclude from this product
              </div>

              {optionsExpanded && (
                <div style={{ marginTop: 8 }}>
                  {inheritedGroups.map(g => {
                    const excluded = excludedGroupIds.has(g.id);
                    return (
                      <div key={g.id} style={{
                        display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px",
                        borderRadius: 8, marginBottom: 6,
                        background: excluded ? "var(--bg2)" : "var(--bg)",
                        border: "0.5px solid var(--border)",
                        opacity: excluded ? 0.5 : 1,
                      }}>
                        <input
                          type="checkbox"
                          checked={!excluded}
                          style={{ marginTop: 2 }}
                          onChange={() => {
                            setExcludedGroupIds(s => {
                              const n = new Set(s);
                              excluded ? n.delete(g.id) : n.add(g.id);
                              return n;
                            });
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</div>
                          <div style={{ fontSize: 11, color: "var(--ink2)", marginTop: 2 }}>
                            {g.selection_type} · {g.is_required ? "required" : "optional"} ·{" "}
                            {g.values.map(v =>
                              `${v.label}${v.price_delta ? ` (+€${Number(v.price_delta).toFixed(2)})` : ""}`
                            ).join(", ")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Allergens */}
          <div className={styles.tagField}>
            <label>{t("menu.prodModal.allergens")}</label>
            {allergens.length === 0
              ? <div className={styles.tagEmpty}>{t("menu.prodModal.noAllergens")}</div>
              : <div className={styles.tagPills}>
                  {allergens.map(a => (
                    <button key={a.id} type="button"
                      className={`${styles.tagPill} ${selAllergens.has(a.id) ? styles.tagPillOn : ""}`}
                      onClick={() => toggleTag(selAllergens, setSelAllergens, a.id)}>
                      {a.icon && <span>{a.icon}</span>} {a.name}
                    </button>
                  ))}
                </div>
            }
          </div>

          {/* Additives */}
          <div className={styles.tagField}>
            <label>{t("menu.prodModal.additives")}</label>
            {additives.length === 0
              ? <div className={styles.tagEmpty}>{t("menu.prodModal.noAdditives")}</div>
              : <div className={styles.tagPills}>
                  {additives.map(a => (
                    <button key={a.id} type="button"
                      className={`${styles.tagPill} ${selAdditives.has(a.id) ? styles.tagPillOn : ""}`}
                      onClick={() => toggleTag(selAdditives, setSelAdditives, a.id)}>
                      {a.code && <span className={styles.tagPillCode}>{a.code}</span>} {a.name}
                    </button>
                  ))}
                </div>
            }
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>{t("menu.prodModal.available")}</div>
              <div className={styles.toggleDesc}>{t("menu.prodModal.availableDesc")}</div>
            </div>
            <button
              className={`${styles.toggle} ${form.is_available ? styles.toggleOn : styles.toggleOff}`}
              onClick={() => up("is_available", !form.is_available)}
            />
          </div>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>{t("menu.prodModal.featuredLabel")}</div>
              <div className={styles.toggleDesc}>{t("menu.prodModal.featuredDesc")}</div>
            </div>
            <button
              className={`${styles.toggle} ${form.is_featured ? styles.toggleOn : styles.toggleOff}`}
              onClick={() => up("is_featured", !form.is_featured)}
            />
          </div>
          {err && <div className={styles.errText}>{err}</div>}
        </div>
        <div className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
            {t("menu.cancel")}
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={loading}>
            {loading ? <span className={styles.spinner} /> : isEdit ? t("menu.save") : t("menu.prodModal.addBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete }: {
  product: Product; onEdit: () => void; onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.prodCard} onClick={onEdit}>
      <div className={styles.prodCardImg}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} />
          : <span className={styles.prodCardImgPlaceholder}><Utensils size={28} /></span>
        }
        <div className={styles.prodCardBadges}>
          {product.is_featured && <span className={`${styles.badge} ${styles.badgeFeatured}`}>{t("menu.featured")}</span>}
          {!product.is_available && <span className={`${styles.badge} ${styles.badgeUnavail}`}>{t("menu.unavailable")}</span>}
        </div>
      </div>
      <div className={styles.prodCardBody}>
        <div className={styles.prodCardName}>{product.name}</div>
        {product.description && <div className={styles.prodCardDesc}>{product.description}</div>}
        <div className={styles.prodCardFooter}>
          <div className={styles.prodCardPrice}>€{Number(product.price).toFixed(2)}</div>
          <div className={styles.prodCardActions} onClick={e => e.stopPropagation()}>
            <button className={`${styles.btnIcon} ${styles.btnIconGhost}`} title={t("menu.edit")} onClick={onEdit}>
              <Pencil size={13} />
            </button>
            <button className={`${styles.btnIcon} ${styles.btnIconDanger}`} title={t("menu.delete")} onClick={onDelete}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [catModal, setCatModal] = useState<{ open: boolean; cat: Category | null }>({ open: false, cat: null });
  const [prodModal, setProdModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [confirm, setConfirm] = useState<{ type: "cat" | "prod"; id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "err" = "ok") { setToast({ msg, type }); }

  useEffect(() => {
    apiFetch("/api/categories")
      .then((cats: Category[]) => {
        setCategories(cats);
        if (cats.length > 0) setActiveCatId(cats[0].id);
      })
      .catch(() => showToast(t("menu.toast.failedLoad"), "err"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeCatId || products[activeCatId] !== undefined) return;
    apiFetch(`/api/products?category_id=${activeCatId}`)
      .then((prods: Product[]) => setProducts(p => ({ ...p, [activeCatId]: prods })))
      .catch(() => showToast(t("menu.toast.failedLoad"), "err"));
  }, [activeCatId]);

  const activeCat = categories.find(c => c.id === activeCatId) ?? null;
  const activeProducts = activeCatId ? (products[activeCatId] ?? null) : null;

  function handleCatSaved(cat: Category) {
    setCategories(cs => cs.find(c => c.id === cat.id)
      ? cs.map(c => c.id === cat.id ? cat : c)
      : [...cs, cat]);
    if (!activeCatId) setActiveCatId(cat.id);
    setCatModal({ open: false, cat: null });
    showToast(catModal.cat ? t("menu.toast.catUpdated") : t("menu.toast.catCreated"));
  }

  async function handleCatDelete() {
    if (!confirm || confirm.type !== "cat") return;
    try {
      await apiFetch(`/api/categories/${confirm.id}`, { method: "DELETE" });
      setCategories(cs => cs.filter(c => c.id !== confirm.id));
      if (activeCatId === confirm.id)
        setActiveCatId(categories.find(c => c.id !== confirm.id)?.id ?? null);
      showToast(t("menu.toast.catDeleted"));
    } catch { showToast(t("menu.toast.failedDelete"), "err"); }
    finally { setConfirm(null); }
  }

  function handleProdSaved(prod: Product) {
    setProducts(ps => {
      const list = ps[prod.category_id] ?? [];
      return {
        ...ps,
        [prod.category_id]: list.find(p => p.id === prod.id)
          ? list.map(p => p.id === prod.id ? prod : p)
          : [...list, prod],
      };
    });
    setProdModal({ open: false, product: null });
    showToast(prodModal.product ? t("menu.toast.prodUpdated") : t("menu.toast.prodAdded"));
  }

  async function handleProdDelete() {
    if (!confirm || confirm.type !== "prod") return;
    try {
      await apiFetch(`/api/products/${confirm.id}`, { method: "DELETE" });
      setProducts(ps => {
        const updated: Record<string, Product[]> = {};
        for (const [k, v] of Object.entries(ps)) updated[k] = v.filter(p => p.id !== confirm.id);
        return updated;
      });
      showToast(t("menu.toast.prodDeleted"));
    } catch { showToast(t("menu.toast.failedDelete"), "err"); }
    finally { setConfirm(null); }
  }

  function selectCat(id: string) {
    setActiveCatId(id);
    setSidebarOpen(false);
  }

  return (
    <div className={styles.root}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle categories"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <a href="/dashboard" className={styles.topbarBack}>
            <ArrowLeft size={13} /> {t("menu.backToDashboard")}
          </a>
          <span className={styles.topbarSep}>/</span>
          <span className={styles.topbarTitle}>{t("menu.title")}</span>
        </div>
        <div className={styles.topbarRight}>
          <button
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            onClick={() => setCatModal({ open: true, cat: null })}
          >
            <Plus size={13} /> {t("menu.newCategory")}
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLabel}>{t("menu.categories")}</div>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
              style={{ width: "100%" }}
              onClick={() => setCatModal({ open: true, cat: null })}
            >
              <Plus size={13} /> {t("menu.addCategory")}
            </button>
          </div>
          <div className={styles.sidebarList}>
            {loading && (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <span className={styles.spinner} style={{ borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
              </div>
            )}
            {!loading && categories.length === 0 && (
              <div style={{ padding: "1.25rem 0.875rem", textAlign: "center", color: "var(--ink3)", fontSize: "0.78rem" }}>
                {t("menu.noCategories").split("\n").map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </div>
            )}
            {categories.map(cat => (
              <div
                key={cat.id}
                className={[
                  styles.catItem,
                  activeCatId === cat.id ? styles.catItemActive : "",
                  !cat.is_visible ? styles.catItemHidden : "",
                ].join(" ")}
                onClick={() => selectCat(cat.id)}
              >
                <div className={styles.catDot} />
                <div className={styles.catItemInfo}>
                  <div className={styles.catItemName}>{cat.name}</div>
                  <div className={styles.catItemCount}>
                    {products[cat.id] !== undefined
                      ? `${products[cat.id].length} ${t("menu.items")}`
                      : "—"}
                  </div>
                </div>
                {!cat.is_visible && <span className={styles.catItemBadge}>{t("menu.hidden")}</span>}
                <div className={styles.catItemActions} onClick={e => e.stopPropagation()}>
                  <button
                    className={`${styles.btnIcon} ${styles.btnIconGhost}`}
                    style={{ width: 24, height: 24 }}
                    title={t("menu.edit")}
                    onClick={() => setCatModal({ open: true, cat })}
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    className={`${styles.btnIcon} ${styles.btnIconDanger}`}
                    style={{ width: 24, height: 24 }}
                    title={t("menu.delete")}
                    onClick={() => setConfirm({ type: "cat", id: cat.id, name: cat.name })}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className={styles.main}>
          {!activeCat ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><UtensilsCrossed size={36} /></div>
              <div className={styles.emptyTitle}>{t("menu.noCatTitle")}</div>
              <div className={styles.emptySub}>{t("menu.noCatDesc")}</div>
            </div>
          ) : (
            <>
              <div className={styles.mainHeader}>
                <div className={styles.mainHeaderText}>
                  <h1 className={styles.mainHeading}>{activeCat.name}</h1>
                  {activeCat.description && (
                    <p className={styles.mainSub}>{activeCat.description}</p>
                  )}
                </div>
                <div className={styles.mainActions}>
                  <button
                    className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                    onClick={() => setCatModal({ open: true, cat: activeCat })}
                  >
                    <Pencil size={12} /> {t("menu.edit")}
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                    onClick={() => setProdModal({ open: true, product: null })}
                  >
                    <Plus size={13} /> {t("menu.addProduct")}
                  </button>
                </div>
              </div>

              <div className={styles.mainBody}>
                {activeProducts === null && (
                  <div style={{ textAlign: "center", padding: "3rem" }}>
                    <span className={styles.spinner} style={{ borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
                  </div>
                )}
                {activeProducts !== null && activeProducts.length === 0 && (
                  <div className={styles.empty}>
                    <div className={styles.emptyIcon}><Salad size={36} /></div>
                    <div className={styles.emptyTitle}>{t("menu.noProductsTitle")}</div>
                    <div className={styles.emptySub}>
                      {t("menu.noProductsDesc")} <strong>{activeCat.name}</strong>.
                    </div>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      style={{ marginTop: "1.1rem" }}
                      onClick={() => setProdModal({ open: true, product: null })}
                    >
                      <Plus size={14} /> {t("menu.addProduct")}
                    </button>
                  </div>
                )}
                {activeProducts !== null && activeProducts.length > 0 && (
                  <>
                    <div className={styles.sectionHd}>
                      <div className={styles.sectionHdLeft}>
                        <span className={styles.sectionHdTitle}>{t("menu.products")}</span>
                        <span className={styles.sectionHdCount}>{activeProducts.length}</span>
                      </div>
                    </div>
                    <div className={styles.productsGrid}>
                      {[...activeProducts]
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map(prod => (
                          <ProductCard
                            key={prod.id}
                            product={prod}
                            onEdit={() => setProdModal({ open: true, product: prod })}
                            onDelete={() => setConfirm({ type: "prod", id: prod.id, name: prod.name })}
                          />
                        ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {catModal.open && (
        <CategoryModal
          cat={catModal.cat}
          onSave={handleCatSaved}
          onClose={() => setCatModal({ open: false, cat: null })}
        />
      )}
      {prodModal.open && activeCatId && (
        <ProductModal
          product={prodModal.product}
          categoryId={activeCatId}
          onSave={handleProdSaved}
          onClose={() => setProdModal({ open: false, product: null })}
        />
      )}
      {confirm && (
        <Confirm
          title={`${t("menu.delete")} "${confirm.name}"?`}
          desc={
            confirm.type === "cat"
              ? t("menu.confirm.catDesc")
              : t("menu.confirm.prodDesc")
          }
          onConfirm={confirm.type === "cat" ? handleCatDelete : handleProdDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}