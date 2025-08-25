"use client";

import { useState } from "react";
import Papa from "papaparse";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";

interface CsvRow {
  class: string;
  studentId: string;
  name: string;
  status?: string; // Optional, as it might not be in every CSV
}

export default function CsvImport({ onClose }: { onClose: () => void }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseCsv(file);
    }
  };

  const parseCsv = (file: File) => {
    setIsUploading(true);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        console.log("Parsed CSV data:", results.data);
        await uploadToFirestore(results.data);
        setIsUploading(false);
        onClose();
      },
      error: (error: Error) => {
        console.error("Error parsing CSV:", error);
        alert("CSV 解析失敗，請檢查檔案格式或 console。");
        setIsUploading(false);
      },
    });
  };

  const uploadToFirestore = async (data: CsvRow[]) => {
    const batch = writeBatch(db);
    const studentsCollection = collection(db, "students");

    data.forEach((row) => {
      if (row.studentId && row.class && row.name) {
        const studentRef = doc(studentsCollection, row.studentId); // Use studentId as document ID
        const schoolYear = Number(String(row.studentId).substring(0, 3));
        batch.set(studentRef, {
          class: row.class,
          studentId: row.studentId,
          name: row.name,
          status: row.status || "未繳納",
          schoolYear: schoolYear,
          isWithdrawn: false,
        });
      } else {
        console.warn("Skipping row due to missing data:", row);
      }
    });

    try {
      await batch.commit();
      alert(`成功匯入 ${data.length} 筆學生資料！`);
    } catch (error) {
      console.error("Error writing batch to Firestore: ", error);
      alert("匯入資料至 Firestore 時發生錯誤，請查看 console。");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        請選擇一個 CSV 檔案進行匯入。CSV 檔案必須包含 `class`, `studentId`,
        `name` 這三個欄位。
      </p>
      <div>
        <label
          htmlFor="csv-file"
          className="block mb-2 text-sm font-medium text-gray-300"
        >
          CSV 檔案
        </label>
        <input
          type="file"
          id="csv-file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={isUploading}
        />
      </div>
      {isUploading && <p className="text-center">上傳中，請稍候...</p>}
    </div>
  );
}
