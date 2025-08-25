"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ManualImportForm({
  closeAction,
}: {
  closeAction: () => void;
}) {
  const [studentClass, setStudentClass] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [status, setStatus] = useState("未繳納");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const schoolYear = Number(studentId.substring(0, 3));
      await addDoc(collection(db, "students"), {
        class: studentClass,
        studentId,
        name: studentName,
        status,
        schoolYear,
      });
      setStudentClass("");
      setStudentId("");
      setStudentName("");
      setStatus("未繳納");
      alert("學生資料已成功新增！");
      closeAction();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("新增學生資料時發生錯誤，請查看 console。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="class"
          className="block mb-2 text-sm font-medium text-gray-300"
        >
          班級
        </label>
        <input
          type="text"
          id="class"
          value={studentClass}
          onChange={(e) => setStudentClass(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          required
        />
      </div>
      <div>
        <label
          htmlFor="studentId"
          className="block mb-2 text-sm font-medium text-gray-300"
        >
          學號
        </label>
        <input
          type="text"
          id="studentId"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          required
          pattern="\d{7}"
          title="學號必須是 7 位數字"
        />
      </div>
      <div>
        <label
          htmlFor="name"
          className="block mb-2 text-sm font-medium text-gray-300"
        >
          姓名
        </label>
        <input
          type="text"
          id="name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          required
        />
      </div>
      <div>
        <label
          htmlFor="status"
          className="block mb-2 text-sm font-medium text-gray-300"
        >
          繳納狀態
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
        >
          <option value="未繳納">未繳納</option>
          <option value="已繳納">已繳納</option>
          <option value="有會員資格（但未繳納）">有會員資格（但未繳納）</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-500"
      >
        {isSubmitting ? "新增中..." : "新增學生"}
      </button>
    </form>
  );
}
