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
  const pages: number[] = [];
  const add = (p: number) => { if (!pages.includes(p)) pages.push(p); };

  add(1);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p > 1 && p < totalPages) add(p);
  }
  add(totalPages);

  const result: (number | '…')[] = [];
  let prev = 0;
  for (const p of pages.sort((a, b) => a - b)) {
    if (prev && p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

export default function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return total != null && total > 0
      ? <p className="text-center text-xs text-gray-400 mt-5">{total.toLocaleString()} total</p>
      : null;
  }
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
      {total != null && (
        <span className="text-sm text-gray-500">{total.toLocaleString()} total · page {page} of {totalPages}</span>
      )}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          className="p-2 rounded-xl bg-white ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers are hidden on very narrow screens; prev/next is enough there */}
        <div className="hidden min-[400px]:flex items-center gap-1.5">
          {pageNumbers.map((p, i) =>
            p === '…' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-sm text-gray-400">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={`min-w-[2.25rem] h-9 px-2 rounded-xl text-sm font-medium transition-colors ${
                  p === page ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 ring-1 ring-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
        <span className="min-[400px]:hidden text-sm text-gray-600 px-2">{page} / {totalPages}</span>

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
          className="p-2 rounded-xl bg-white ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
