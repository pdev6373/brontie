'use client';

import { useState } from 'react';
import MerchantSelector from './MerchantSelector';

interface AnalyticsFiltersProps {
  selectedMerchantId: string;
  onMerchantChange: (merchantId: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
}

export default function AnalyticsFilters({
  selectedMerchantId,
  onMerchantChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearFilters,
}: AnalyticsFiltersProps) {
  const MIN_START_DATE = '2025-09-26'; // 2025-09-26T08:16:00Z (date inputs ignore time)

  const handleDateFromChange = (value: string) => {
    const clamped = value && value < MIN_START_DATE ? MIN_START_DATE : value;
    onDateFromChange(clamped);
  };

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🔍 Filters
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateFrom}
              min={MIN_START_DATE}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full"
              placeholder="dd/mm/yyyy"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">📅</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full"
              placeholder="dd/mm/yyyy"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">📅</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Café
          </label>
          <MerchantSelector
            selectedMerchantId={selectedMerchantId}
            onMerchantChange={onMerchantChange}
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
