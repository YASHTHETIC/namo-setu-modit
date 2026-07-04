'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Filter, MapPin, Star, Calendar, Users, BarChart3, X, ChevronRight } from 'lucide-react';
import { NamoShell } from '@/components/namo-shell';
import { ErrorState, LoadingState } from '@/components/async-state';
import { CompactPanel, MetricTile, PageFrame, Field, inputClass, SectionHeader, StatusPill, Button, Card } from '@/components/namo-ui';
import {
  useAdminUsers,
  useAnalyticsSummary,
  useCreateFestival,
  useCreatePuja,
  useCreateTemple,
  useDeleteTemple,
  useTemples,
  useUpdateTemple,
} from '@/lib/namo-api';

type AdminTab = 'temples' | 'festivals' | 'puja' | 'users' | 'bookings' | 'reports';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('temples');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTempleId, setSelectedTempleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '',
    slug: '',
    city_id: 'city-default',
    state_id: 'state-default',
    country_id: 'country-in',
    address_line1: '',
    pincode: '000000',
    temple_type: 'main',
    deity_name: '',
    description: '',
  });
  const [festivalForm, setFestivalForm] = useState({ temple_id: '', name: '', description: '', starts_on: '' });
  const [pujaForm, setPujaForm] = useState({ temple_id: '', name: '', base_price: '1100', duration_minutes: '45' });

  const templesQuery = useTemples({ search: searchQuery || undefined });
  const analyticsQuery = useAnalyticsSummary();
  const usersQuery = useAdminUsers();
  const createTemple = useCreateTemple();
  const updateTemple = useUpdateTemple();
  const deleteTemple = useDeleteTemple();
  const createFestival = useCreateFestival();
  const createPuja = useCreatePuja();

  const temples = useMemo(() => templesQuery.data?.items ?? [], [templesQuery.data?.items]);
  const filteredTemples = useMemo(
    () =>
      temples.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.address_line1.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [temples, searchQuery]
  );

  const tabs = [
    { id: 'temples' as const, label: 'Temples', count: templesQuery.data?.total ?? 0 },
    { id: 'festivals' as const, label: 'Festivals', count: 0 },
    { id: 'puja' as const, label: 'Puja', count: analyticsQuery.data?.puja_bookings ?? 0 },
    { id: 'users' as const, label: 'Users', count: usersQuery.data?.length ?? 0 },
    { id: 'bookings' as const, label: 'Bookings', count: analyticsQuery.data?.darshan_bookings ?? 0 },
    { id: 'reports' as const, label: 'Reports', count: 1 },
  ];

  const openCreate = () => {
    setModalMode('create');
    setSelectedTempleId(null);
    setForm({ name: '', slug: '', city_id: 'city-default', state_id: 'state-default', country_id: 'country-in', address_line1: '', pincode: '000000', temple_type: 'main', deity_name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (temple: (typeof temples)[number]) => {
    setModalMode('edit');
    setSelectedTempleId(temple.id);
    setForm({
      name: temple.name,
      slug: temple.slug,
      city_id: temple.city_id,
      state_id: temple.state_id,
      country_id: temple.country_id,
      address_line1: temple.address_line1,
      pincode: temple.pincode,
      temple_type: temple.temple_type,
      deity_name: temple.deity_name ?? '',
      description: temple.description ?? '',
    });
    setShowModal(true);
  };

  const saveTemple = async () => {
    const payload = { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') };
    if (modalMode === 'create') {
      await createTemple.mutateAsync(payload);
    } else if (selectedTempleId) {
      await updateTemple.mutateAsync({ id: selectedTempleId, payload });
    }
    setShowModal(false);
  };

  return (
    <NamoShell>
      <PageFrame>
        {/* Header */}
        <motion.div
          className="flex flex-wrap items-end justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Administration</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">Admin Dashboard</h1>
            <p className="mt-3 text-base text-[var(--text-secondary)]">Temple, festival, puja, user, and analytics management</p>
          </div>
          <Button onClick={openCreate} size="lg">
            <Plus className="h-5 w-5" />
            Add Temple
          </Button>
        </motion.div>

        {/* Analytics Metrics */}
        {analyticsQuery.data && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <MetricTile label="Temples" value={String(analyticsQuery.data.temples)} icon={MapPin} />
            <MetricTile label="Darshan Bookings" value={String(analyticsQuery.data.darshan_bookings)} icon={Calendar} />
            <MetricTile label="Donations" value={`₹${analyticsQuery.data.donation_amount.toLocaleString('en-IN')}`} icon={Star} />
            <MetricTile label="Puja Bookings" value={String(analyticsQuery.data.puja_bookings)} icon={BarChart3} />
          </motion.div>
        )}

        {/* Tabs */}
        <div className="border-b border-[var(--border)]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-orange-600'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[var(--bg-subtle)] px-2 text-xs font-bold text-slate-600">
                    {tab.count}
                  </span>
                </span>
                {activeTab === tab.id && (
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    layoutId="adminTab"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'temples' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search temples..."
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
                {templesQuery.isLoading && <LoadingState label="Loading temples..." />}
                {templesQuery.isError && <ErrorState message={templesQuery.error.message} onRetry={() => templesQuery.refetch()} />}
                <CompactPanel>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Temple</th>
                          <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Location</th>
                          <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Category</th>
                          <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Rating</th>
                          <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTemples.map((temple) => (
                          <tr key={temple.id} className="border-b border-[var(--border-subtle)] transition-colors hover:bg-stone-50/50">
                            <td className="px-6 py-5">
                              <span className="font-bold text-[var(--text-primary)]">{temple.name}</span>
                            </td>
                            <td className="px-6 py-5 text-sm text-[var(--text-secondary)]">{temple.address_line1}</td>
                            <td className="px-6 py-5">
                              <StatusPill tone="teal">{temple.temple_type}</StatusPill>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                <span className="text-sm font-bold text-[var(--text-primary)]">{temple.rating_avg}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => openEdit(temple)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-all hover:bg-orange-50 hover:text-orange-600">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => deleteTemple.mutate(temple.id)} className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-all hover:bg-red-50 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CompactPanel>
              </div>
            )}

            {activeTab === 'festivals' && (
              <CompactPanel>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Create Festival</h3>
                  <div className="grid md:grid-cols-2 gap-5">
                    <Field label="Temple ID">
                      <input value={festivalForm.temple_id} onChange={(e) => setFestivalForm({ ...festivalForm, temple_id: e.target.value })} className={inputClass} placeholder="Temple ID" />
                    </Field>
                    <Field label="Festival Name">
                      <input value={festivalForm.name} onChange={(e) => setFestivalForm({ ...festivalForm, name: e.target.value })} className={inputClass} placeholder="Festival name" />
                    </Field>
                    <Field label="Start Date">
                      <input type="datetime-local" value={festivalForm.starts_on} onChange={(e) => setFestivalForm({ ...festivalForm, starts_on: e.target.value })} className={inputClass} />
                    </Field>
                    <Field label="Description">
                      <textarea value={festivalForm.description} onChange={(e) => setFestivalForm({ ...festivalForm, description: e.target.value })} className={`${inputClass} min-h-[100px]`} placeholder="Description" />
                    </Field>
                  </div>
                  <div className="mt-6">
                    <Button
                      onClick={() => createFestival.mutate({ templeId: festivalForm.temple_id, payload: { name: festivalForm.name, description: festivalForm.description, starts_on: new Date(festivalForm.starts_on).toISOString() } })}
                      disabled={!festivalForm.temple_id || !festivalForm.name || createFestival.isPending}
                      size="lg"
                    >
                      Create Festival
                    </Button>
                  </div>
                </div>
              </CompactPanel>
            )}

            {activeTab === 'puja' && (
              <CompactPanel>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Create Puja Package</h3>
                  <div className="grid md:grid-cols-2 gap-5">
                    <Field label="Temple ID">
                      <input value={pujaForm.temple_id} onChange={(e) => setPujaForm({ ...pujaForm, temple_id: e.target.value })} className={inputClass} placeholder="Temple ID" />
                    </Field>
                    <Field label="Puja Name">
                      <input value={pujaForm.name} onChange={(e) => setPujaForm({ ...pujaForm, name: e.target.value })} className={inputClass} placeholder="Puja name" />
                    </Field>
                    <Field label="Base Price (₹)">
                      <input value={pujaForm.base_price} onChange={(e) => setPujaForm({ ...pujaForm, base_price: e.target.value })} className={inputClass} placeholder="1100" />
                    </Field>
                    <Field label="Duration (minutes)">
                      <input value={pujaForm.duration_minutes} onChange={(e) => setPujaForm({ ...pujaForm, duration_minutes: e.target.value })} className={inputClass} placeholder="45" />
                    </Field>
                  </div>
                  <div className="mt-6">
                    <Button
                      onClick={() => createPuja.mutate({ temple_id: pujaForm.temple_id, title: pujaForm.name, base_price: Number(pujaForm.base_price), description: 'Admin created puja package' })}
                      disabled={!pujaForm.temple_id || !pujaForm.name || createPuja.isPending}
                      size="lg"
                    >
                      Create Puja Package
                    </Button>
                  </div>
                </div>
              </CompactPanel>
            )}

            {activeTab === 'users' && (
              <>
                {usersQuery.isLoading && <LoadingState label="Loading users..." />}
                {usersQuery.isError && <ErrorState message={usersQuery.error.message} />}
                <CompactPanel>
                  <div className="divide-y divide-stone-100">
                    {(usersQuery.data ?? []).map((user, i) => (
                      <motion.div
                        key={user.id}
                        className="flex items-center justify-between px-6 py-5 transition-colors hover:bg-stone-50/50"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
                            <span className="text-sm font-bold text-orange-600">{(user.full_name ?? user.email ?? 'U')[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">{user.full_name ?? user.email}</div>
                            <div className="text-xs text-[var(--text-secondary)] mt-1">{user.email}</div>
                          </div>
                        </div>
                        <StatusPill tone={user.is_active ? 'emerald' : 'slate'}>
                          {user.is_active ? 'active' : 'inactive'}
                        </StatusPill>
                      </motion.div>
                    ))}
                  </div>
                </CompactPanel>
              </>
            )}

            {activeTab === 'bookings' && analyticsQuery.data && (
              <div className="grid md:grid-cols-3 gap-5">
                <MetricTile label="Darshan" value={String(analyticsQuery.data.darshan_bookings)} icon={Calendar} />
                <MetricTile label="Puja" value={String(analyticsQuery.data.puja_bookings)} icon={Star} />
                <MetricTile label="Travel" value={String(analyticsQuery.data.travel_bookings)} icon={Users} />
              </div>
            )}

            {activeTab === 'reports' && (
              <>
                {analyticsQuery.isLoading && <LoadingState label="Loading analytics..." />}
                {analyticsQuery.data && (
                  <CompactPanel>
                    <div className="p-8">
                      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Donation & Booking Analytics</h3>
                      <div className="grid md:grid-cols-2 gap-5 mb-8">
                        {[
                          { label: 'Total Donations', value: analyticsQuery.data.donations.toString() },
                          { label: 'Donation Amount', value: `₹${analyticsQuery.data.donation_amount.toLocaleString('en-IN')}` },
                          { label: 'Accommodation Bookings', value: analyticsQuery.data.accommodation_bookings.toString() },
                          { label: 'Reviews', value: analyticsQuery.data.reviews.toString() },
                        ].map((stat) => (
                          <div key={stat.label} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-stone-50/50 p-5">
                            <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
                            <span className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="h-64 flex items-center justify-center rounded-2xl bg-gradient-to-br from-stone-50 to-stone-100">
                        <BarChart3 className="h-16 w-16 text-stone-300" />
                      </div>
                    </div>
                  </CompactPanel>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              <motion.div
                className="relative w-full max-w-2xl rounded-3xl bg-[var(--bg-card)] p-8 shadow-2xl"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">{modalMode === 'create' ? 'Add Temple' : 'Edit Temple'}</h2>
                   <button type="button" onClick={() => setShowModal(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-muted)] transition-all">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-5">
                  {(['name', 'slug', 'address_line1', 'deity_name', 'pincode'] as const).map((field) => (
                    <Field key={field} label={field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}>
                      <input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className={inputClass} placeholder={field.replace(/_/g, ' ')} />
                    </Field>
                  ))}
                  <Field label="Description">
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[100px]`} placeholder="Temple description" />
                  </Field>
                </div>
                {(createTemple.isError || updateTemple.isError) && (
                  <div className="mt-5">
                    <ErrorState message={(createTemple.error ?? updateTemple.error)?.message ?? 'Save failed'} />
                  </div>
                )}
                <div className="flex gap-4 mt-8">
                  <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={saveTemple}
                    disabled={createTemple.isPending || updateTemple.isPending}
                  >
                    {createTemple.isPending || updateTemple.isPending ? 'Saving...' : 'Save Temple'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageFrame>
    </NamoShell>
  );
}