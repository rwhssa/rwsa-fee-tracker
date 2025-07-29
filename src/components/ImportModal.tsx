"use client";

import { useState } from 'react';
import ManualImportForm from './ManualImportForm';
import CsvImport from './CsvImport';

export default function ImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [view, setView] = useState('main'); // main, csv, manual

  const handleClose = () => {
    setView('main');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-900 p-8 rounded-3xl w-full max-w-md shadow-2xl border border-gray-800">
        {view === 'main' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-8 text-center">匯入資料</h2>
            <div className="flex flex-col gap-6">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition shadow-lg"
                onClick={() => setView('csv')}
              >
                CSV 匯入
              </button>
              <button 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-xl transition shadow-lg"
                onClick={() => setView('manual')}
              >
                手動建檔
              </button>
            </div>
          </>
        )}

        {view === 'csv' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-8 text-center">CSV 匯入</h2>
            <CsvImport onClose={handleClose} />
          </>
        )}

        {view === 'manual' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-8 text-center">手動建檔</h2>
            <ManualImportForm onClose={handleClose} />
          </>
        )}

        <button
          className="mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition w-full shadow-lg"
          onClick={handleClose}
        >
          {view === 'main' ? '關閉' : '返回'}
        </button>
      </div>
    </div>
  );
}