'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Package, Search, MapPin, ChevronLeft, ChevronRight, XCircle, Eye, CheckCircle, Download, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  in_transit: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-indigo-100 text-indigo-700',
  driver_assigned: 'bg-purple-100 text-purple-700',
  pending_driver: 'bg-yellow-100 text-yellow-700',
  created: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignMsg, setAssignMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const limit = 10;

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (status) params.status = status;
      if (vehicleType) params.vehicleType = vehicleType;
      const res = await api.getDeliveries(params);
      setDeliveries(res.data?.deliveries ?? res.data ?? []);
      setTotal(res.data?.total ?? res.pagination?.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, vehicleType]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.getDeliveryById(id);
      setSelected(res.data ?? res);
      setAssignDriverId('');
      setAssignMsg('');
    } catch (e: any) {
      alert(e.message);
    }
  };

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

  const handleAssignDriver = async (deliveryId: string) => {
    if (!assignDriverId.trim()) { setAssignMsg('Enter a driver ID'); return; }
    setActionLoading(true);
    setAssignMsg('');
    try {
      await api.assignDriver(deliveryId, assignDriverId.trim());
      setAssignMsg('Driver assigned successfully!');
      setAssignDriverId('');
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deliveries</h1>
        <p className="text-gray-600">Track and manage all deliveries</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
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
              <div key={delivery._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-xl">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{delivery.trackingNumber ?? delivery._id}</h3>
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
                        <p className="font-medium text-gray-900">{delivery.customer?.name ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Driver</p>
                        <p className="font-medium text-gray-900">{delivery.driver?.name ?? 'Unassigned'}</p>
                      </div>
                      {delivery.vehicleType && (
                        <div>
                          <p className="text-xs text-gray-500">Vehicle</p>
                          <p className="font-medium text-gray-900 capitalize">{delivery.vehicleType}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delivery Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{selected.trackingNumber ?? selected._id}</h2>
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
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-semibold">₦{Number(selected.price ?? 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="capitalize">{selected.vehicleType ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{selected.customer?.name ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Driver</span><span>{selected.driver?.name ?? 'Unassigned'}</span></div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-gray-500 mb-1">Pickup</p>
                <p className="font-medium">{selected.pickup?.address ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Drop-off</p>
                <p className="font-medium">{selected.dropoff?.address ?? '—'}</p>
              </div>

              {/* Assign Driver */}
              {!['delivered', 'cancelled'].includes(selected.status) && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Assign Driver
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={assignDriverId}
                      onChange={(e) => setAssignDriverId(e.target.value)}
                      placeholder="Driver Object ID"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      onClick={() => handleAssignDriver(selected._id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium disabled:opacity-60"
                    >
                      Assign
                    </button>
                  </div>
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
    </div>
  );
}
