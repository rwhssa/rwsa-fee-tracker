"use client";
/* eslint-disable jsx-a11y/alt-text */

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import {
  type Student,
  formatAcademicYearLabel,
  getCurrentAcademicYear,
} from "@/lib/utils";
import { Font } from "@react-pdf/renderer";

Font.register({
  family: "EduKai",
  // TODO: This font file provides effectively a single visual weight.
  // react-pdf (pdfkit) does NOT perform synthetic emboldening like the browser.
  // We register the same file twice (normal + bold) so title styles using
  // fontWeight:'bold' remain semantically correct, even if visual difference
  // is minimal. To get a true bold appearance, supply a real bold TTF.
  fonts: [
    { src: "/fonts/edukai-5.0.ttf", fontWeight: "normal" },
    { src: "/fonts/edukai-5.0.ttf", fontWeight: "bold" },
  ],
});

interface PrintCertificateModalProps {
  isOpen: boolean;
  closeAction: () => void;
  academicYears: number[];
  currentYear: number;
  students: Student[];
}

interface PaidStudent {
  id: string;
  name: string;
  class: string;
}

const CERTS_PER_PAGE = 8;
const DEFAULT_AMOUNT = "300";

function maskName(name: string) {
  if (!name) return name;
  if (name.length < 2) return name;
  return name[0] + "O" + name.slice(2);
}

function toChineseDigit(n: string) {
  const map: Record<string, string> = {
    "1": "一",
    "2": "二",
    "3": "三",
    "4": "四",
    "5": "五",
    "6": "六",
    "7": "七",
    "8": "八",
    "9": "九",
  };
  return map[n] ?? n;
}

function formatClassHuman(code: string) {
  if (!/^[456]0[1-9]$/.test(code)) return code;
  const grade = code[0];
  const classNo = code[2];
  const gradeMap: Record<string, string> = { "4": "四", "5": "五", "6": "六" };
  return `${gradeMap[grade]}年${toChineseDigit(classNo)}班`;
}

function buildIssueDateString(date = new Date()) {
  const rocYear = date.getFullYear() - 1911;
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `中華民國 ${rocYear} 年 ${m} 月 ${d} 日`;
}

export default function PrintCertificateModal({
  isOpen,
  closeAction,
  academicYears,
  currentYear,
  students,
}: PrintCertificateModalProps) {
  const [mounted, setMounted] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [instagram, setInstagram] = useState("");
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [hasEditedAmount, setHasEditedAmount] = useState(false);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [hasEditedInstagram, setHasEditedInstagram] = useState(false);

  const [previewReady, setPreviewReady] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const dynamicDefaultInsta = (): string => {
    const base = getCurrentAcademicYear() + 2;
    return `rwsa_${base}th`;
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!instagram) {
      setInstagram(dynamicDefaultInsta());
    }
  }, [selectedYear, instagram]);

  const defaultInstagram = dynamicDefaultInsta();
  const isInstagramDefault = instagram === defaultInstagram;

  const paidStudents: PaidStudent[] = students
    .filter(
      (s) =>
        !s.isWithdrawn &&
        s.status === "已繳納" &&
        (selectedYear == null || s.schoolYear === selectedYear),
    )
    .map((s) => ({ id: s.id, name: s.name, class: s.class }))
    .sort((a, b) => a.class.localeCompare(b.class));

  const certCount = paidStudents.length;
  const totalPages = Math.ceil(certCount / CERTS_PER_PAGE);

  const instagramUrl =
    instagram.trim() === ""
      ? ""
      : `https://www.instagram.com/${instagram.trim().replace(/^@/, "")}/`;

  const firstStudent = paidStudents[0];
  const issueDate = buildIssueDateString();

  const buildQr = useCallback(async () => {
    if (!instagramUrl) {
      if (qrDataUrl) setQrDataUrl(null);
      return;
    }
    setGeneratingQr(true);
    try {
      const data = await QRCode.toDataURL(instagramUrl, {
        margin: 0,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
        scale: 4,
      });
      if (data !== qrDataUrl) setQrDataUrl(data);
    } catch {
      setQrDataUrl(null);
    } finally {
      setGeneratingQr(false);
    }
  }, [instagramUrl, qrDataUrl]);

  useEffect(() => {
    if (previewReady) buildQr();
  }, [previewReady, buildQr]);

  const reset = () => {
    setSelectedYear(null);
    setInstagram("");
    setAmount(DEFAULT_AMOUNT);
    setQrDataUrl(null);
    setPreviewReady(false);
    setDownloading(false);
  };

  const handleClose = () => {
    if (downloading) return;
    closeAction();
    setTimeout(() => reset(), 200);
  };

  const handleGeneratePreview = () => {
    if (!selectedYear) return;
    setPreviewReady(true);
  };

  const handleDownload = async () => {
    if (!previewReady || downloading) return;
    setDownloading(true);
    try {
      const { pdf, Document, Page, View, Text, Image, StyleSheet } =
        await import("@react-pdf/renderer");

      const styles = StyleSheet.create({
        page: {
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          padding: 6,
          fontFamily: "EduKai",
        },
        outer: {
          flex: 1,
          padding: 4,
          flexDirection: "column",
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          width: "100%",
        },
        certCell: {
          width: "50%",
          height: "25%",
          padding: 6,
          borderRight: "0.5pt dashed #000",
          borderBottom: "0.5pt dashed #000",
          flexDirection: "row",
        },
        left: {
          width: "65%",
          paddingRight: 6,
          flexDirection: "column",
          justifyContent: "space-between",
        },
        right: {
          width: "35%",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
        },
        title: {
          fontFamily: "EduKai",
          fontWeight: "bold",
          fontSize: 12,
          textAlign: "center",
          letterSpacing: 0.5,
          marginBottom: 8,
        },
        body: {
          fontSize: 8,
          lineHeight: 1.45,
          color: "#000",
        },
        paragraph: {
          marginBottom: 6,
        },
        salutation: {
          fontSize: 8,
          marginTop: 8,
          marginLeft: 0,
        },
        footerRow: {
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 4,
        },
        footerText: {
          fontSize: 7,
        },
        footerOrg: {
          fontSize: 7,
          marginTop: 4,
        },
        qr: {
          width: 68,
          height: 68,
          marginBottom: 3,
        },
        qrCaption: {
          fontFamily: "EduKai",
          fontSize: 8,
          marginTop: 4,
          textAlign: "center",
        },

        date: {
          textAlign: "right",
          fontSize: 7,
        },
      });

      const chunks: PaidStudent[][] = [];
      for (let i = 0; i < paidStudents.length; i += CERTS_PER_PAGE) {
        chunks.push(paidStudents.slice(i, i + CERTS_PER_PAGE));
      }
      if (chunks.length === 0) chunks.push([]);

      const Cert = ({
        student,
        idx,
      }: {
        student: PaidStudent;
        idx: number;
      }) => {
        const humanClass = formatClassHuman(student.class);
        const borderExtras = {
          borderTop: idx < 2 ? "0.5pt dashed #000" : undefined,
          borderLeft: idx % 2 === 0 ? "0.5pt dashed #000" : undefined,
        } as const;
        return (
          <View style={[styles.certCell, borderExtras]}>
            <View style={styles.left}>
              <View>
                <Text style={styles.title}>學生會會費繳費證明</Text>
                <View style={styles.paragraph}>
                  <Text style={styles.body}>
                    茲收到{humanClass}
                    {maskName(student.name)}
                    繳交之會費新臺幣 {amount || DEFAULT_AMOUNT}{" "}
                    元，特立此據以茲證明。
                  </Text>
                </View>
                <Text style={styles.salutation}>此致</Text>
                <Text style={styles.footerOrg}>市立仁武高中學生代表聯合會</Text>
              </View>
              <View style={styles.footerRow}>
                <Text style={[styles.footerText, styles.date]}>
                  {issueDate}
                </Text>
              </View>
            </View>
            <View style={styles.right}>
              {qrDataUrl && (
                <>
                  <Image style={styles.qr} src={qrDataUrl} />
                  <Text style={styles.qrCaption}>追蹤學生會 IG</Text>
                </>
              )}
            </View>
          </View>
        );
      };

      const PlaceholderCert = ({ idx }: { idx: number }) => {
        const borderExtras = {
          borderTop: idx < 2 ? "0.5pt dashed #000" : undefined,
          borderLeft: idx % 2 === 0 ? "0.5pt dashed #000" : undefined,
        } as const;
        return (
          <View style={[styles.certCell, borderExtras]}>
            <View style={styles.left}>
              <View>
                <Text style={styles.title}>學生會會費繳費證明</Text>
                <View style={styles.paragraph}>
                  <Text style={styles.body}>
                    茲收到＿＿＿＿＿＿＿＿＿＿＿＿＿ 繳交之會費新臺幣{" "}
                    {amount || DEFAULT_AMOUNT} 元，特立此據以茲證明。
                  </Text>
                </View>
                <Text style={styles.salutation}>此致</Text>
                <Text style={styles.footerOrg}>市立仁武高中學生代表聯合會</Text>
              </View>
              <View style={styles.footerRow}>
                <Text style={[styles.footerText, styles.date]}>
                  {issueDate}
                </Text>
              </View>
            </View>
            <View style={styles.right}>
              {qrDataUrl && (
                <>
                  <Image style={styles.qr} src={qrDataUrl} />
                  <Text style={styles.qrCaption}>追蹤學生會 IG</Text>
                </>
              )}
            </View>
          </View>
        );
      };

      const doc = (
        <Document>
          {chunks.map((pageStudents, idx) => {
            const cells: any[] = [];
            pageStudents.forEach((st, i) => {
              cells.push(<Cert key={st.id} student={st} idx={i} />);
            });
            for (let i = pageStudents.length; i < CERTS_PER_PAGE; i++) {
              cells.push(<PlaceholderCert key={`ph-${i}`} idx={i} />);
            }
            return (
              <Page
                key={idx}
                size="A4"
                style={styles.page}
                wrap={false}
                orientation="portrait"
              >
                <View style={styles.outer}>
                  <View style={styles.grid}>{cells}</View>
                </View>
              </Page>
            );
          })}
        </Document>
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const chineseYearSegment = selectedYear
        ? `${selectedYear} 學年度`
        : "未指定學年度";
      a.download = `仁中學生會繳費證明（${chineseYearSegment}）.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Swallow error – pdf generation failed
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const sampleClass = firstStudent
    ? formatClassHuman(firstStudent.class)
    : "四年一班";
  const sampleName = firstStudent ? firstStudent.name : "王小明";
  const sampleAmount = amount || DEFAULT_AMOUNT;
  const canPreview = selectedYear != null;
  const canDownload = previewReady && certCount > 0 && !generatingQr;

  const modal = (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-800 p-6 max-h-[90vh] overflow-y-auto">
        {!previewReady && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white text-center">
              列印繳費證明
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              從選定學年度中將已繳納會費且未離校的學生名單，轉換成繳費證明的 PDF
              檔（格式為 A4，每頁 8 張）。
            </p>

            <div className="space-y-2">
              <label className="text-xs text-gray-300">學年度</label>
              <select
                value={selectedYear ?? ""}
                onChange={(e) =>
                  setSelectedYear(
                    e.target.value ? Number(e.target.value) : null,
                  )
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
                Instagram 帳號 (選填)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => {
                  setInstagram(e.target.value);
                  if (e.target.value !== defaultInstagram)
                    setHasEditedInstagram(true);
                }}
                placeholder={defaultInstagram}
                className={`w-full text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 ${isInstagramDefault && !hasEditedInstagram ? "text-gray-400" : "text-white"}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-300">會費金額（選填）</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value;
                  const digits = raw.replace(/[^0-9]/g, "");
                  setAmount(digits);
                  if (!hasEditedAmount) setHasEditedAmount(true);
                }}
                className={`w-full text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 ${hasEditedAmount ? "text-white" : "text-gray-400"}`}
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-gray-700/60 hover:bg-gray-600/60 text-gray-200 transition"
              >
                取消
              </button>
              <button
                disabled={!canPreview}
                onClick={handleGeneratePreview}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                生成預覽
              </button>
            </div>
          </div>
        )}

        {previewReady && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white text-center tracking-wide">
              預覽與下載
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-3 text-center">
                <div className="text-sm font-medium text-gray-100 tracking-wide">
                  有繳會費的學生
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">
                  {certCount}
                  <span className="ml-0.5 text-[10px] text-gray-400">人</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-800/70 px-3 py-3 text-center">
                <div className="text-sm font-medium text-gray-100 tracking-wide">
                  PDF 總頁數
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white">
                  {totalPages || 1}
                  <span className="ml-0.5 text-[10px] text-gray-400">頁</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-300">繳費證明樣式預覽</div>
              <div
                className="bg-white text-black font-edukai rounded-lg border border-gray-700 p-4 flex"
                style={{ fontFamily: "EduKai, KaiTi, DFKai-SB, serif" }}
              >
                <div className="w-2/3 pr-4 flex flex-col justify-between">
                  <div>
                    <div className="text-center font-bold mb-2 text-[14px] tracking-wide">
                      學生會會費繳費證明
                    </div>
                    <p className="text-[11px] leading-[1.45] mb-3">
                      茲收到
                      {sampleClass}
                      {sampleName}繳交之會費新臺幣{" "}
                      {sampleAmount || DEFAULT_AMOUNT}
                      元，特立此據以茲證明。
                    </p>
                    <p className="text-[11px] mt-4 mb-1">此致</p>
                  </div>
                  <div className="flex flex-col text-[10px]">
                    <span className="leading-tight mt-2 tracking-wide">
                      市立仁武高中學生代表聯合會
                    </span>
                    <span className="text-right mt-1">{issueDate}</span>
                  </div>
                </div>
                <div className="w-1/3 flex flex-col items-center justify-center">
                  {qrDataUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="qr"
                        className="w-24 h-24 object-contain"
                      />
                      <span className="mt-1 text-[10px]">追蹤學生會 IG</span>
                    </>
                  ) : (
                    <div className="w-24 h-24 border border-dashed border-gray-400 text-[10px] text-gray-600 flex items-center justify-center">
                      無 QR
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-4 space-y-2">
                <p className="text-xs text-gray-300 leading-relaxed">
                  本列印檔以 A4 黑白格式輸出，每頁有 8
                  張證明單。虛線處為裁切線，請使用 100% 比例列印以避免縮放誤差。
                </p>
                <p className="text-xs text-amber-300 font-medium">
                  列印後，建議加蓋「學生會會章」以確保繳費證明之有效性。
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  setPreviewReady(false);
                  setQrDataUrl(null);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-gray-700/60 hover:bg-gray-600/60 text-gray-200 transition flex-1"
                disabled={downloading}
              >
                返回
              </button>
              <button
                onClick={handleDownload}
                disabled={!canDownload || downloading}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition flex-1"
              >
                {downloading ? "生成中..." : "下載 PDF"}
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition"
              >
                關閉
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
