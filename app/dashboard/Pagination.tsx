'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | '…')[] {
  const pages: (number | '…')[] = [];
  const add = (p: number) => { if (!pages.includes(p)) pages.push(p); };

  add(1);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p > 1 && p < totalPages) add(p);
  }
  add(totalPages);

  const result: (number | '…')[] = [];
  let prev = 0;
  for (const p of pages.sort((a, b) => (a as number) - (b as number))) {
    if (prev && (p as number) - prev > 1) result.push('…');
    result.push(p);
    prev = p as number;
  }
  return result;
}

export default function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
      {total != null && (
        <span className="text-sm text-gray-500">{total.toLocaleString()} total</span>
      )}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-medium transition-colors ${
                p === page ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
