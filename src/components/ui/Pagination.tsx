import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ITEMS_PER_PAGE = 25;

export const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-6 px-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};
