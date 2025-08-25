"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import Papa from "papaparse";
import { type Student, formatAcademicYearLabel } from "@/lib/utils";
import {
  SPORTS_CLASS_SET,
  promoteClassCode,
  promoteSportsClassCode,
} from "@/lib/constants";

type UnlistedStrategy = "replaceAll" | "replaceSportsOnly" | "ignore";

export type OperationAction = "update" | "withdraw" | "none";

export type OperationReasonCode =
  | "INVALID_BOTH_CLASS_FORMAT"
  | "INVALID_OLD_CLASS_FORMAT"
  | "INVALID_NEW_CLASS_FORMAT"
  | "NOT_FOUND"
  | "NAME_CLASS_CONFLICT"
  | "OLD_MISMATCH"
  | "NO_CHANGE"
  | "UNLISTED_WITHDRAW"
  | "UNLISTED_NO_INFER"
  | "UNLISTED_SPORTS_NO_CHANGE";

interface ClassReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYears: number[];
  currentYear: number;
  students: Student[];
  onConfirm: (payload: {
    targetYear: number;
    unlistedStrategy: UnlistedStrategy;
    updates: ClassChangeOperation[];
    withdrawals: ClassChangeOperation[];
    ignored: ClassChangeOperation[];
    summary: SummaryStats;
  }) => Promise<void>;
}

interface CsvRow {
  name: string;
  oldClass: string;
  newClass: string;
}

interface ClassChangeOperation {
  studentId: string;
  name: string;
  beforeClass: string;
  afterClass: string | null;
  action: OperationAction;
  isListed: boolean;
  reasonCode?: OperationReasonCode;
  reasonText?: string;
}

interface SummaryStats {
  updateCount: number;
  withdrawalCount: number;
  ignoredCount: number;
  listedRows: number;
  mismatchCount: number;
  invalidClassCount: number;
  conflictCount: number;
}

type Stage = "form" | "parsing" | "preview" | "submitting" | "result";

export default function ClassReplacementModal({
  isOpen,
  onClose,
  academicYears,
  currentYear,
  students,
  onConfirm,
}: ClassReplacementModalProps) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<Stage>("form");

  const [targetYear, setTargetYear] = useState<number | null>(null);
  const [unlistedStrategy, setUnlistedStrategy] =
    useState<UnlistedStrategy>("replaceAll");

  const [rawFileName, setRawFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [activeTab, setActiveTab] = useState<"listed" | "unlisted">("listed");

  const [listedOps, setListedOps] = useState<ClassChangeOperation[]>([]);
  const [unlistedOps, setUnlistedOps] = useState<ClassChangeOperation[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    updateCount: 0,
    withdrawalCount: 0,
    ignoredCount: 0,
    listedRows: 0,
    mismatchCount: 0,
    invalidClassCount: 0,
    conflictCount: 0,
  });

  const resetAll = useCallback(() => {
    setStage("form");
    setTargetYear(null);
    setUnlistedStrategy("replaceAll");
    setRawFileName("");
    setParseError(null);
    setCsvRows([]);
    setListedOps([]);
    setUnlistedOps([]);
    setSummary({
      updateCount: 0,
      withdrawalCount: 0,
      ignoredCount: 0,
      listedRows: 0,
      mismatchCount: 0,
      invalidClassCount: 0,
      conflictCount: 0,
    });
    setActiveTab("listed");
  }, []);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleClose = () => {
    if (stage === "submitting") return;
    onClose();
    setTimeout(() => resetAll(), 200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawFileName(file.name);
    setParseError(null);
    setStage("parsing");
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data || [])
          .map((r) => ({
            name: (r.name || "").trim(),
            oldClass: (r.oldClass || "").trim(),
            newClass: (r.newClass || "").trim(),
          }))
          .filter((r) => r.name && r.oldClass && r.newClass);
        if (data.length === 0) {
          setParseError(
            "無有效資料列，請確認欄位名稱需為 name,oldClass,newClass",
          );
          setStage("form");
          return;
        }
        setCsvRows(data);
        setStage("form");
      },
      error: (err) => {
        setParseError(`解析失敗: ${err.message}`);
        setStage("form");
      },
    });
  };

  const buildPreview = useCallback(() => {
    if (stage !== "preview" || targetYear == null) return;
    const inYear = students.filter((s) => s.schoolYear === targetYear);
    const classNameIndex = new Map<string, Student[]>();
    inYear.forEach((s) => {
      const key = `${s.name}|${s.class}`;
      const list = classNameIndex.get(key) || [];
      list.push(s);
      classNameIndex.set(key, list);
    });

    const listed: ClassChangeOperation[] = [];
    const seenIds = new Set<string>();

    let mismatchCount = 0;
    let invalidClassCount = 0;
    let conflictCount = 0;

    const isValidClass = (c: string) => /^[456]0[1-9]$/.test(c);

    csvRows.forEach((row) => {
      const oldValid = isValidClass(row.oldClass);
      const newValid = isValidClass(row.newClass);
      if (!oldValid || !newValid) {
        const reasonCode: OperationReasonCode =
          !oldValid && !newValid
            ? "INVALID_BOTH_CLASS_FORMAT"
            : !oldValid
              ? "INVALID_OLD_CLASS_FORMAT"
              : "INVALID_NEW_CLASS_FORMAT";
        listed.push({
          studentId: "",
          name: row.name,
          beforeClass: row.oldClass,
          afterClass: newValid ? row.newClass : null,
          action: "none",
          isListed: true,
          reasonCode,
          reasonText:
            reasonCode === "INVALID_BOTH_CLASS_FORMAT"
              ? "舊/新班級格式無效"
              : reasonCode === "INVALID_OLD_CLASS_FORMAT"
                ? "舊班級格式無效"
                : "新班級格式無效",
        });
        invalidClassCount++;
        return;
      }

      const matches = classNameIndex.get(`${row.name}|${row.oldClass}`) || [];
      if (matches.length === 0) {
        listed.push({
          studentId: "",
          name: row.name,
          beforeClass: row.oldClass,
          afterClass: row.newClass,
          action: "none",
          isListed: true,
          reasonCode: "NOT_FOUND",
          reasonText: "找不到對應學生",
        });
        return;
      }

      if (matches.length > 1) {
        matches.forEach((student) => {
          listed.push({
            studentId: student.id,
            name: student.name,
            beforeClass: student.class,
            afterClass: row.newClass,
            action: "none",
            isListed: true,
            reasonCode: "NAME_CLASS_CONFLICT",
            reasonText: "同名同班衝突",
          });
          seenIds.add(student.id);
          conflictCount++;
        });
        return;
      }

      const student = matches[0];
      let action: ClassChangeOperation["action"] = "update";
      let reason: string | undefined;
      let reasonCode: OperationReasonCode | undefined;
      let reasonText: string | undefined;
      if (student.class !== row.oldClass) {
        action = "none";
        reasonCode = "OLD_MISMATCH";
        reasonText = `舊班級不符(現有: ${student.class})`;
        mismatchCount++;
      } else if (student.class === row.newClass) {
        action = "none";
        reasonCode = "NO_CHANGE";
        reasonText = "班級未變更";
      }
      listed.push({
        studentId: student.id,
        name: student.name,
        beforeClass: student.class,
        afterClass: row.newClass,
        action,
        isListed: true,
        reasonCode,
        reasonText,
      });
      seenIds.add(student.id);
    });

    const unlistedBase = inYear.filter((s) => !seenIds.has(s.id));

    const unlisted: ClassChangeOperation[] = unlistedBase.map((s) => {
      let action: ClassChangeOperation["action"] = "none";
      let afterClass: string | null = s.class;
      let reason: string | undefined;

      if (unlistedStrategy === "replaceAll") {
        afterClass = promoteClassCode(s.class);
        action = afterClass !== s.class ? "update" : "none";
      } else if (unlistedStrategy === "replaceSportsOnly") {
        if (SPORTS_CLASS_SET.has(s.class)) {
          afterClass = promoteSportsClassCode(s.class);
          action = afterClass !== s.class ? "update" : "none";
        } else {
          action = "withdraw";
          afterClass = null;
        }
      } else {
        action = "none";
        afterClass = s.class;
      }

      if (action === "none" && afterClass === s.class) {
        if (unlistedStrategy === "ignore") {
          reason = "保持原狀";
        } else if (unlistedStrategy === "replaceAll") {
          reason = "無法自動推算";
        } else if (unlistedStrategy === "replaceSportsOnly") {
          reason = SPORTS_CLASS_SET.has(s.class)
            ? "體育班班級未變"
            : "標記為已離校";
        }
      }

      if (action === "withdraw") {
        reason = "未列出且策略標記已離校";
      }

      return {
        studentId: s.id,
        name: s.name,
        beforeClass: s.class,
        afterClass,
        action,
        isListed: false,
        reasonCode:
          action === "withdraw"
            ? "UNLISTED_WITHDRAW"
            : action === "none" && unlistedStrategy === "replaceAll"
              ? "UNLISTED_NO_INFER"
              : action === "none" &&
                  unlistedStrategy === "replaceSportsOnly" &&
                  SPORTS_CLASS_SET.has(s.class)
                ? "UNLISTED_SPORTS_NO_CHANGE"
                : action === "none"
                  ? "NO_CHANGE"
                  : undefined,
        reason,
      };
    });

    const updateCount =
      listed.filter((o) => o.action === "update").length +
      unlisted.filter((o) => o.action === "update").length;
    const withdrawalCount = unlisted.filter(
      (o) => o.action === "withdraw",
    ).length;
    const ignoredCount =
      listed.filter((o) => o.action === "none").length +
      unlisted.filter((o) => o.action === "none").length;

    const score = (op: ClassChangeOperation) => {
      switch (op.reasonCode) {
        case "INVALID_BOTH_CLASS_FORMAT":
        case "INVALID_OLD_CLASS_FORMAT":
        case "INVALID_NEW_CLASS_FORMAT":
          return 0;
        case "NAME_CLASS_CONFLICT":
          return 1;
        case "OLD_MISMATCH":
          return 2;
        case "NOT_FOUND":
          return 3;
        case "UNLISTED_WITHDRAW":
          return 4;
        case "NO_CHANGE":
        case "UNLISTED_NO_INFER":
        case "UNLISTED_SPORTS_NO_CHANGE":
          return 5;
        default:
          return op.action === "update" ? 6 : 7;
      }
    };
    listed.sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });
    unlisted.sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });
    setListedOps(listed);
    setUnlistedOps(unlisted);
    setSummary({
      updateCount,
      withdrawalCount,
      ignoredCount,
      listedRows: csvRows.length,
      mismatchCount,
      invalidClassCount,
      conflictCount,
    });
  }, [stage, targetYear, csvRows, students, unlistedStrategy]);

  useEffect(() => {
    if (stage === "preview") buildPreview();
  }, [stage, buildPreview, unlistedStrategy, targetYear]);

  const handleSubmit = async () => {
    if (stage !== "preview" || targetYear == null) return;
    setStage("submitting");
    try {
      await onConfirm({
        targetYear,
        unlistedStrategy,
        updates: [...listedOps, ...unlistedOps].filter(
          (o) => o.action === "update",
        ),
        withdrawals: unlistedOps.filter((o) => o.action === "withdraw"),
        ignored: [...listedOps, ...unlistedOps].filter(
          (o) => o.action === "none",
        ),
        summary,
      });
      setStage("result");
    } catch (e) {
      setParseError("提交失敗，請重試");
      setStage("preview");
    }
  };

  if (!isOpen || !mounted) return null;

  const renderStage = () => {
    if (stage === "form" || stage === "parsing") {
      return (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white text-center">編班替換</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            上傳 CSV 檔案（UTF-8）格式：
            <br />
            name,oldClass,newClass
            <br />
            每列代表一位學生的編班調整。系統將以
            <span className="text-blue-400">姓名</span>
            在指定學年度學生中尋找符合資料。
          </p>

          <div className="space-y-2">
            <label className="text-xs text-gray-300">要處理學年度</label>
            <select
              value={targetYear ?? ""}
              onChange={(e) =>
                setTargetYear(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="">選擇學年度</option>
              {academicYears.map((y) => (
                <option key={y} value={y}>
                  {formatAcademicYearLabel(y, currentYear)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-300">
              未在替換名單中的處理策略
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-start space-x-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer">
                <input
                  type="radio"
                  name="unlisted"
                  value="replaceAll"
                  checked={unlistedStrategy === "replaceAll"}
                  onChange={() => setUnlistedStrategy("replaceAll")}
                  className="mt-1"
                />
                <span className="text-xs text-gray-200">
                  按規則自動替換（例：501 → 601）
                </span>
              </label>
              <label className="flex items-start space-x-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer">
                <input
                  type="radio"
                  name="unlisted"
                  value="replaceSportsOnly"
                  checked={unlistedStrategy === "replaceSportsOnly"}
                  onChange={() => setUnlistedStrategy("replaceSportsOnly")}
                  className="mt-1"
                />
                <span className="text-xs text-gray-200">
                  僅自動替換體育班，其餘標記為已離校
                </span>
              </label>
              <label className="flex items-start space-x-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer">
                <input
                  type="radio"
                  name="unlisted"
                  value="ignore"
                  checked={unlistedStrategy === "ignore"}
                  onChange={() => setUnlistedStrategy("ignore")}
                  className="mt-1"
                />
                <span className="text-xs text-gray-200">維持現狀</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="class-replace-file"
              className="text-xs text-gray-300"
            >
              CSV 檔案
            </label>
            <input
              id="class-replace-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={stage === "parsing"}
              className="block w-full text-xs text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {rawFileName && (
              <div className="text-[10px] text-gray-500 truncate">
                {rawFileName}
              </div>
            )}
          </div>

          {parseError && (
            <div className="text-xs text-red-400 bg-red-900/20 border border-red-700 px-3 py-2 rounded-lg">
              {parseError}
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-gray-700/60 hover:bg-gray-600/60 text-gray-200 transition"
              disabled={stage === "parsing"}
            >
              取消
            </button>
            <button
              onClick={() =>
                targetYear && csvRows.length && setStage("preview")
              }
              disabled={!targetYear || !csvRows.length || stage === "parsing"}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {stage === "parsing" ? "處理中..." : "預覽變更"}
            </button>
          </div>
        </div>
      );
    }

    if (stage === "preview") {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white text-center">確認變更</h2>

          <div className="grid grid-cols-4 text-center text-[11px] bg-gray-800/60 rounded-lg overflow-hidden border border-gray-700">
            <div className="px-2 py-2 border-r border-gray-700 text-blue-300">
              更新 {summary.updateCount} 筆
            </div>
            <div className="px-2 py-2 border-r border-gray-700 text-purple-300">
              已離校 {summary.withdrawalCount} 筆
            </div>
            <div className="px-2 py-2 border-r border-gray-700 text-gray-300">
              維持現狀 {summary.ignoredCount} 筆
            </div>
            <div className="px-2 py-2 text-amber-300">
              不符 {summary.mismatchCount} 筆
            </div>
          </div>

          <div className="flex space-x-2 text-xs">
            <button
              onClick={() => setActiveTab("listed")}
              className={`flex-1 rounded-lg px-3 py-2 border ${
                activeTab === "listed"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-gray-800 text-gray-300 border-gray-700"
              }`}
            >
              CSV 替換名單 ({listedOps.length})
            </button>
            <button
              onClick={() => setActiveTab("unlisted")}
              className={`flex-1 rounded-lg px-3 py-2 border ${
                activeTab === "unlisted"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-gray-800 text-gray-300 border-gray-700"
              }`}
            >
              未列出 ({unlistedOps.length})
            </button>
          </div>

          <div className="h-56 overflow-auto bg-gray-900/60 border border-gray-800 rounded-lg">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-gray-900/80 backdrop-blur-sm">
                <tr className="text-gray-400">
                  <th className="px-2 py-2 font-medium text-left">姓名</th>
                  <th className="px-2 py-2 font-medium text-left">原班級</th>
                  <th className="px-2 py-2 font-medium text-left">新班級</th>
                  <th className="px-2 py-2 font-medium text-left">操作</th>
                  <th className="px-2 py-2 font-medium text-left">備註</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === "listed" ? listedOps : unlistedOps).map(
                  (op, i) => {
                    const actionStyle =
                      op.action === "update"
                        ? "text-blue-300"
                        : op.action === "withdraw"
                          ? "text-purple-300"
                          : "text-gray-400";
                    return (
                      <tr
                        key={`${op.studentId}-${i}-${op.beforeClass}`}
                        className={`border-t border-gray-800 ${
                          i % 2 === 0 ? "bg-gray-900/40" : ""
                        } ${
                          op.reasonCode &&
                          (op.reasonCode.startsWith("INVALID")
                            ? "bg-red-900/30"
                            : op.reasonCode === "NAME_CLASS_CONFLICT"
                              ? "bg-amber-900/30"
                              : "")
                        }`}
                      >
                        <td className="px-2 py-1 text-white truncate">
                          {op.name || "—"}
                        </td>
                        <td className="px-2 py-1 text-gray-300">
                          {op.beforeClass || "—"}
                        </td>
                        <td className="px-2 py-1 text-gray-300">
                          {op.afterClass ?? "—"}
                        </td>
                        <td className={`px-2 py-1 font-medium ${actionStyle}`}>
                          {op.action === "update"
                            ? "更新"
                            : op.action === "withdraw"
                              ? "已離校"
                              : "維持"}
                        </td>
                        <td className="px-2 py-1 text-gray-400 truncate max-w-[140px] flex items-center space-x-1">
                          {op.reasonCode && (
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                op.reasonCode.startsWith("INVALID")
                                  ? "bg-red-500"
                                  : op.reasonCode === "NAME_CLASS_CONFLICT"
                                    ? "bg-amber-500"
                                    : op.reasonCode === "OLD_MISMATCH"
                                      ? "bg-yellow-500"
                                      : op.action === "withdraw"
                                        ? "bg-purple-500"
                                        : op.action === "update"
                                          ? "bg-blue-500"
                                          : "bg-gray-500"
                              }`}
                            />
                          )}
                          <span className="truncate">
                            {op.reasonText || ""}
                          </span>
                        </td>
                      </tr>
                    );
                  },
                )}
                {(activeTab === "listed" ? listedOps : unlistedOps).length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      無資料
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {parseError && (
            <div className="text-xs text-red-400 bg-red-900/20 border border-red-700 px-3 py-2 rounded-lg">
              {parseError}
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => setStage("form")}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-gray-700/60 hover:bg-gray-600/60 text-gray-200 transition"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                listedOps
                  .concat(unlistedOps)
                  .filter(
                    (o) => o.action === "update" || o.action === "withdraw",
                  ).length === 0
              }
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
            >
              確認執行
            </button>
          </div>
        </div>
      );
    }

    if (stage === "submitting") {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-gray-300">處理中...</p>
        </div>
      );
    }

    if (stage === "result") {
      const totalActioned = summary.updateCount + summary.withdrawalCount;
      const problemParts: string[] = [];
      if (summary.mismatchCount > 0)
        problemParts.push(`舊班級不符 ${summary.mismatchCount}`);
      if (summary.invalidClassCount > 0)
        problemParts.push(`格式無效 ${summary.invalidClassCount}`);
      if (summary.conflictCount > 0)
        problemParts.push(`同名衝突 ${summary.conflictCount}`);
      return (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white text-center">
            編班替換成功
          </h2>
          <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">原始匯入筆數</span>
              <span className="text-gray-200 font-medium">
                {summary.listedRows}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">總異動 (更新+離校)</span>
              <span className="text-gray-200 font-medium">{totalActioned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">更新班級</span>
              <span className="text-blue-300 font-medium">
                {summary.updateCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">標記已離校</span>
              <span className="text-purple-300 font-medium">
                {summary.withdrawalCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">維持原狀</span>
              <span className="text-gray-300 font-medium">
                {summary.ignoredCount}
              </span>
            </div>
            {problemParts.length > 0 && (
              <div className="pt-1 border-t border-gray-700/50">
                <div className="text-gray-400 mb-1">問題摘要</div>
                <div className="text-xs text-amber-300 leading-relaxed">
                  {problemParts.join(" / ")}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center">
            異動已更新至資料庫。若需再次操作，請重新開啟編班替換選單。
          </p>
          <button
            onClick={handleClose}
            className="w-full px-4 py-3 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium"
          >
            關閉
          </button>
        </div>
      );
    }

    return null;
  };

  const modal = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      style={{ position: "fixed" }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 p-6 max-h-[85vh] overflow-y-auto">
        {renderStage()}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
