'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Package, Search, MapPin, XCircle, Eye, CheckCircle, Download, UserPlus, Trash2, Handshake } from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '../DeleteModal';
import PageHeader from '../PageHeader';
import Pagination from '../Pagination';

const STATUS_COLORS: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  in_transit: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-indigo-100 text-indigo-700',
  driver_assigned: 'bg-purple-100 text-purple-700',
  assigned: 'bg-purple-100 text-purple-700',
  pending_driver: 'bg-yellow-100 text-yellow-700',
  created: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

const DRIVER_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  online: 'bg-blue-100 text-blue-700',
  busy: 'bg-orange-100 text-orange-700',
  offline: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

const DRIVER_STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  online: 'Online (unavailable)',
  busy: 'On a delivery',
  offline: 'Offline',
  suspended: 'Suspended',
};

// Different endpoints/response versions have shown customer/driver info under
// different keys (populated object, flat name field, or a bare id) — check them all.
function getCustomerName(d: any): string {
  return d.customerId?.name ?? d.customer?.name ?? d.customerName ?? '—';
}

function hasDriverAssigned(d: any): boolean {
  return d.driverId !== null && d.driverId !== undefined;
}

function getDriverName(d: any): string {
  if (d.driverDetails?.name) return d.driverDetails.name;
  if (d.driverId?.userId?.name) return d.driverId.userId.name;
  if (d.driver?.name) return d.driver.name;
  if (d.driverName) return d.driverName;
  if (typeof d.driverId === 'object' && d.driverId?.name) return d.driverId.name;
  if (hasDriverAssigned(d)) return 'Assigned';
  return 'Unassigned';
}

interface DeliveriesProps {
  initialDeliveryId?: string | null;
  onConsumeInitialDeliveryId?: () => void;
}

export default function Deliveries({ initialDeliveryId, onConsumeInitialDeliveryId }: DeliveriesProps = {}) {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driverSearch, setDriverSearch] = useState('');
  const limit = 10;

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (status) params.status = status;
      if (vehicleType) params.vehicleType = vehicleType;
      if (source) params.source = source;
      const res = await api.getDeliveries(params);
      setDeliveries(res.data?.deliveries ?? res.data ?? []);
      setTotal(res.data?.total ?? res.pagination?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, vehicleType, source]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  useEffect(() => {
    if (initialDeliveryId) {
      handleViewDetails(initialDeliveryId);
      onConsumeInitialDeliveryId?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDeliveryId]);

  const handleDelete = async (permanent: boolean, reason?: string) => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      await api.deleteDelivery(deleteModal._id, permanent, reason);
      setDeleteModal(null);
      fetchDeliveries();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchAssignableDrivers = useCallback(async (companyId?: string, searchTerm?: string) => {
    setLoadingDrivers(true);
    try {
      const params: Record<string, string> = {};
      if (companyId) params.companyId = companyId;
      if (searchTerm) params.search = searchTerm;
      const driversRes = await api.getDriversForAssignment(params);
      setAvailableDrivers(driversRes.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.getDeliveryById(id);
      const payload = res.data ?? res;
      // Some responses nest the delivery under a `delivery` key alongside
      // sibling payment/chatHistory/voiceCalls data rather than spreading it flat.
      const delivery = payload.delivery ?? payload;
      if (!delivery?._id) {
        alert('Could not load this delivery — the response was missing an id.');
        return;
      }
      setSelected({ ...delivery, payment: delivery.payment ?? payload.payment });
      setAssignMsg('');
      setDriverSearch('');
      setAvailableDrivers([]);
      if (!hasDriverAssigned(delivery) && !['delivered', 'cancelled'].includes(delivery.status)) {
        const companyId = delivery.companyId?._id ?? delivery.companyId;
        fetchAssignableDrivers(companyId);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Debounce driver-picker search so we don't hit the endpoint on every keystroke.
  useEffect(() => {
    if (!selected || ['delivered', 'cancelled'].includes(selected.status)) return;
    if (hasDriverAssigned(selected)) return;
    const companyId = selected.companyId?._id ?? selected.companyId;
    const t = setTimeout(() => fetchAssignableDrivers(companyId, driverSearch), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverSearch]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await api.updateDeliveryStatus(id, newStatus, 'Admin override');
      setSelected(null);
      fetchDeliveries();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDriver = async (deliveryId: string, driverId: string) => {
    if (!deliveryId) { setAssignMsg('No delivery selected — close and reopen this delivery, then try again.'); return; }
    setActionLoading(true);
    setAssignMsg('');
    try {
      const res = await api.assignDriver(deliveryId, driverId);
      const driverName = res.data?.driver?.name;
      setAssignMsg(driverName ? `${driverName} assigned successfully!` : 'Driver assigned successfully!');
      fetchDeliveries();
      setTimeout(() => { setSelected(null); setAssignMsg(''); }, 1500);
    } catch (e: any) {
      setAssignMsg(e.message || 'Failed to assign driver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = { format: 'json' };
      if (status) params.status = status;
      const res = await api.exportData('deliveries', params);
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deliveries-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <PageHeader icon={Package} title="Deliveries" subtitle="Track and manage all deliveries" gradient="from-blue-500 to-blue-600" />

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ID or tracking number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            {['created', 'pending_driver', 'driver_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select value={vehicleType} onChange={(e) => { setVehicleType(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Vehicles</option>
            <option value="bike">Bike</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
          </select>
          <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }} className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
            <option value="">All Sources</option>
            <option value="app">App</option>
            <option value="partner_api">Partner API</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-60 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No deliveries found</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {deliveries.map((delivery: any) => (
              <div key={delivery._id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-xl">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{delivery.trackingNumber ?? delivery.referenceId ?? delivery._id}</h3>
                          {delivery.source === 'partner_api' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">
                              <Handshake className="w-3 h-3" /> {delivery.partnerId?.businessName ?? 'Partner'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{delivery.createdAt ? new Date(delivery.createdAt).toLocaleString() : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[delivery.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {delivery.status?.replace(/_/g, ' ')}
                      </span>
                      {delivery.price != null && (
                        <span className="text-lg font-bold text-gray-900">₦{Number(delivery.price).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Pickup</p>
                          <p className="text-sm font-medium text-gray-900">{delivery.pickup?.address ?? delivery.pickupAddress ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-red-500 mt-1 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Drop-off</p>
                          <p className="text-sm font-medium text-gray-900">{delivery.dropoff?.address ?? delivery.dropoffAddress ?? '—'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="font-medium text-gray-900">{getCustomerName(delivery)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Driver</p>
                        <p className="font-medium text-gray-900">{getDriverName(delivery)}</p>
                      </div>
                      {delivery.vehicleType && (
                        <div>
                          <p className="text-xs text-gray-500">Vehicle</p>
                          <p className="font-medium text-gray-900 capitalize">{delivery.vehicleType}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => { setDeleteModal(delivery); }}
                      className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                    <button
                      onClick={() => handleViewDetails(delivery._id)}
                      className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}

      {/* Delivery Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{selected.trackingNumber ?? selected.referenceId ?? selected._id}</h2>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[selected.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {selected.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-semibold">{selected.fare?.currency === 'NGN' || !selected.fare?.currency ? '₦' : selected.fare.currency + ' '}{Number(selected.price ?? selected.fare?.totalFare ?? 0).toLocaleString()}</span></div>
              {selected.vehicleType && (
                <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="capitalize">{selected.vehicleType}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{getCustomerName(selected)}</span></div>
              {selected.customerPhone && (
                <div className="flex justify-between"><span className="text-gray-500">Customer Phone</span><span>{selected.customerPhone}</span></div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Driver</span><span>{getDriverName(selected)}</span></div>
              {selected.payment && (
                <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{selected.payment.method} · {selected.payment.status}</span></div>
              )}
              {selected.source === 'partner_api' && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-gray-500 flex items-center gap-1.5"><Handshake className="w-4 h-4 text-cyan-600" /> Partner</span>
                  <span className="font-medium">{selected.partnerId?.businessName ?? '—'}</span>
                </div>
              )}
              {selected.partnerOrderRef && (
                <div className="flex justify-between"><span className="text-gray-500">Partner Order Ref</span><span className="font-mono text-xs">{selected.partnerOrderRef}</span></div>
              )}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-gray-500 mb-1">Pickup</p>
                <p className="font-medium">{selected.pickup?.address ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Drop-off</p>
                <p className="font-medium">{selected.dropoff?.address ?? '—'}</p>
              </div>

              {/* Assign Driver — only offered while the delivery has no driver yet */}
              {!hasDriverAssigned(selected) && !['delivered', 'cancelled'].includes(selected.status) && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <UserPlus className="w-4 h-4" /> Assign Driver
                  </p>

                  <input
                    type="text"
                    value={driverSearch}
                    onChange={(e) => setDriverSearch(e.target.value)}
                    placeholder="Search driver by name, phone, or plate number..."
                    className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  {loadingDrivers ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : availableDrivers.length === 0 ? (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                      No drivers found. Try a different search.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableDrivers.map((driver: any) => (
                        <div key={driver._id} className="flex items-center justify-between gap-3 px-4 py-2.5 border border-gray-200 rounded-xl">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900">{driver.name ?? 'Unnamed driver'}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${DRIVER_STATUS_COLORS[driver.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {DRIVER_STATUS_LABELS[driver.status] ?? driver.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{driver.phone} · <span className="capitalize">{driver.vehicleType ?? '—'}</span> · {driver.plateNumber ?? '—'} · {driver.company ?? '—'}</p>
                          </div>
                          <button
                            onClick={() => handleAssignDriver(selected._id, driver._id)}
                            disabled={actionLoading || driver.status === 'suspended'}
                            title={driver.status === 'suspended' ? 'Cannot assign a suspended driver' : undefined}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            Assign
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {assignMsg && (
                    <p className={`mt-2 text-xs ${assignMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{assignMsg}</p>
                  )}
                </div>
              )}

              {/* Status Update */}
              {!['delivered', 'cancelled'].includes(selected.status) && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-700 mb-3">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusUpdate(selected._id, 'delivered')}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Delivered
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selected._id, 'cancelled')}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <DeleteModal
          title="Delete Delivery"
          name={deleteModal.trackingNumber ?? deleteModal._id}
          softLabel="Cancel"
          softDesc="Sets status to cancelled. Notifies customer and driver."
          hardDesc="Removes delivery permanently. Still notifies customer and driver."
          requireReason
          loading={deleteLoading}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
