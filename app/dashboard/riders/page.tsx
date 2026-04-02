'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, Search, Star, TrendingUp, Package, CheckCircle, XCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import DeleteModal from '../DeleteModal';

export default function Riders() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [isOnline, setIsOnline] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const limit = 12;

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (vehicleType) params.vehicleType = vehicleType;
      if (isOnline) params.isOnline = isOnline;
      const res = await api.getDrivers(params);
      setDrivers(res.data?.drivers ?? res.data ?? []);
      setTotal(res.data?.total ?? res.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, vehicleType, isOnline]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleDelete = async (permanent: boolean) => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      await api.deleteDriver(deleteModal._id, permanent);
      setDeleteModal(null);
      fetchDrivers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    setActionLoading(id);
    try {
      await api.approveDriver(id, approve);
      fetchDrivers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Riders</h1>
        <p className="text-gray-600">Manage your delivery riders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, plate..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={vehicleType}
            onChange={(e) => { setVehicleType(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vehicles</option>
            <option value="bike">Bike</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
          </select>
          <select
            value={isOnline}
            onChange={(e) => { setIsOnline(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Online</option>
            <option value="false">Offline</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No riders found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver: any) => (
              <div key={driver._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {driver.name?.[0] ?? 'D'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                        <p className="text-sm text-gray-500">{driver.phone}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      driver.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {driver.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4 text-sm text-gray-600">
                    {driver.vehicleType && (
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span className="capitalize">{driver.vehicleType} {driver.plateNumber ? `· ${driver.plateNumber}` : ''}</span>
                      </div>
                    )}
                    {driver.rating != null && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-gray-900">{Number(driver.rating).toFixed(1)}</span>
                        <span className="text-gray-400">({driver.totalRatings ?? 0} ratings)</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Deliveries</p>
                      <p className="text-lg font-bold text-gray-900">{driver.totalDeliveries ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        driver.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {driver.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {!driver.isVerified && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(driver._id, true)}
                        disabled={actionLoading === driver._id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-60"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleApprove(driver._id, false)}
                        disabled={actionLoading === driver._id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                  {driver.isVerified && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                        <TrendingUp className="w-4 h-4" /> Active Driver
                      </div>
                      <button
                        onClick={() => setDeleteModal(driver)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Driver"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {deleteModal && (
        <DeleteModal
          title="Delete Driver"
          name={deleteModal.name ?? 'this driver'}
          softLabel="Deactivate"
          softDesc="Driver goes offline, cannot accept deliveries. Linked user deactivated."
          hardDesc="Removes driver profile permanently. Linked user marked deleted."
          loading={deleteLoading}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
