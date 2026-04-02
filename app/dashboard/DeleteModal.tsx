'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, XCircle } from 'lucide-react';

interface DeleteModalProps {
  title: string;
  name: string;
  softLabel?: string;       // e.g. "Deactivate", "Suspend", "Cancel"
  softDesc?: string;        // description of soft delete effect
  hardDesc?: string;        // description of permanent delete effect
  requireReason?: boolean;  // show reason input (for deliveries)
  loading: boolean;
  onClose: () => void;
  onConfirm: (permanent: boolean, reason?: string) => void;
}

export default function DeleteModal({
  title, name, softLabel = 'Soft Delete', softDesc, hardDesc,
  requireReason = false, loading, onClose, onConfirm,
}: DeleteModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Choose how to delete <span className="font-semibold text-gray-900">"{name}"</span>:
          </p>

          {requireReason && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                placeholder="e.g. Fraudulent order detected"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Soft delete */}
            <button
              onClick={() => onConfirm(false, reason || undefined)}
              disabled={loading || (requireReason && !reason.trim())}
              className="flex flex-col items-start gap-1.5 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl hover:bg-orange-100 hover:border-orange-400 transition-all disabled:opacity-50 text-left"
            >
              <span className="text-sm font-bold text-orange-700">{softLabel}</span>
              <span className="text-xs text-orange-600 leading-snug">
                {softDesc ?? 'Can be reversed later'}
              </span>
            </button>

            {/* Permanent delete */}
            <button
              onClick={() => onConfirm(true, reason || undefined)}
              disabled={loading || (requireReason && !reason.trim())}
              className="flex flex-col items-start gap-1.5 p-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-400 transition-all disabled:opacity-50 text-left"
            >
              <span className="text-sm font-bold text-red-700">Permanent Delete</span>
              <span className="text-xs text-red-600 leading-snug">
                {hardDesc ?? 'Cannot be undone'}
              </span>
            </button>
          </div>

          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">
              Permanent delete removes all data and cannot be recovered.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
