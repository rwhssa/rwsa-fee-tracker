"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ManualImportForm from "./ManualImportForm";
import CsvImport from "./CsvImport";

export default function ImportModal({
  isOpen,
  closeAction,
}: {
  isOpen: boolean;
  closeAction: () => void;
}) {
  const [view, setView] = useState("main"); // main, csv, manual
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleClose = () => {
    setView("main");
    closeAction();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100] p-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="bg-gray-900 p-6 sm:p-8 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl border border-gray-800 mx-auto"
        style={{
          minWidth: "280px",
          maxHeight: "85vh",
          overflow: "auto",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      >
        {view === "main" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
              匯入資料
            </h2>
            <div className="flex flex-col gap-4 sm:gap-6">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-4 rounded-xl transition shadow-lg text-sm sm:text-base"
                onClick={() => setView("csv")}
              >
                CSV 匯入
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 sm:py-4 px-4 rounded-xl transition shadow-lg text-sm sm:text-base"
                onClick={() => setView("manual")}
              >
                手動建檔
              </button>
            </div>
          </>
        )}

        {view === "csv" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
              CSV 匯入
            </h2>
            <CsvImport closeAction={handleClose} />
          </>
        )}

        {view === "manual" && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">
              手動建檔
            </h2>
            <ManualImportForm closeAction={handleClose} />
          </>
        )}

        <button
          className="mt-6 sm:mt-8 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition w-full shadow-lg text-sm sm:text-base"
          onClick={handleClose}
        >
          {view === "main" ? "關閉" : "返回"}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
