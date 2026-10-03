'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Field, inputCls, btnSecondary } from './ui';

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
  const [confirmHard, setConfirmHard] = useState(false);
  const blocked = loading || (requireReason && !reason.trim());

  return (
    <Modal title={title} onClose={onClose} size="sm" footer={<button onClick={onClose} className={`${btnSecondary} w-full`}>Cancel</button>}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Choose how to remove <span className="font-semibold text-gray-900">&ldquo;{name}&rdquo;</span>:
        </p>

        {requireReason && (
          <Field label="Reason *">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Fraudulent order detected"
              className={`${inputCls} resize-none`}
            />
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onConfirm(false, reason || undefined)}
            disabled={blocked}
            className="flex flex-col items-start gap-1 p-4 bg-orange-50 ring-2 ring-orange-200 rounded-xl hover:ring-orange-400 transition-all disabled:opacity-50 text-left"
          >
            <span className="text-sm font-bold text-orange-700">{softLabel}</span>
            <span className="text-xs text-orange-600 leading-snug">{softDesc ?? 'Can be reversed later'}</span>
          </button>

          <button
            onClick={() => confirmHard ? onConfirm(true, reason || undefined) : setConfirmHard(true)}
            disabled={blocked}
            className={`flex flex-col items-start gap-1 p-4 rounded-xl ring-2 transition-all disabled:opacity-50 text-left ${
              confirmHard ? 'bg-red-600 ring-red-600 text-white' : 'bg-red-50 ring-red-200 hover:ring-red-400'
            }`}
          >
            <span className={`text-sm font-bold ${confirmHard ? 'text-white' : 'text-red-700'}`}>
              {confirmHard ? 'Tap again to confirm' : 'Permanent Delete'}
            </span>
            <span className={`text-xs leading-snug ${confirmHard ? 'text-red-100' : 'text-red-600'}`}>{hardDesc ?? 'Cannot be undone'}</span>
          </button>
        </div>

        <div className="flex items-start gap-2 bg-amber-50 ring-1 ring-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Permanent delete removes the record and cannot be recovered.</p>
        </div>
      </div>
    </Modal>
  );
}
