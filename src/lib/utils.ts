export const getCurrentAcademicYear = (): number => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (currentMonth >= 8) {
    return currentYear - 1911;
  } else {
    return currentYear - 1912;
  }
};

export const getGradeStatus = (
  schoolYear: number,
  currentYear: number,
): string => {
  const yearsElapsed = currentYear - schoolYear;
  if (yearsElapsed === 0) return "高一";
  if (yearsElapsed === 1) return "高二";
  if (yearsElapsed === 2) return "高三";
  return `已畢業 ${yearsElapsed - 2} 年`;
};
export const formatAcademicYearLabel = (
  schoolYear: number,
  currentYear: number,
): string => {
  return `${schoolYear} 年 (${getGradeStatus(schoolYear, currentYear)})`;
};

export const formatStudentId = (studentId: string): string => {
  return studentId.padStart(7, "0");
};

export const isValidStudentId = (studentId: string): boolean => {
  return /^\d{7}$/.test(studentId);
};

export const getSchoolYearFromStudentId = (studentId: string): number => {
  if (!isValidStudentId(studentId)) {
    throw new Error("Invalid student ID format");
  }
  return parseInt(studentId.substring(0, 3));
};

export type FeeStatus = "已繳納" | "有會員資格（但未繳納）" | "未繳納" | null;

export interface Student {
  id: string;
  class: string;
  studentId: string;
  name: string;
  status: FeeStatus;
  schoolYear: number;
  isWithdrawn?: boolean;
}

export const getStatusStyle = (status: FeeStatus): string => {
  switch (status) {
    case "已繳納":
      return "status-paid";
    case "有會員資格（但未繳納）":
      return "status-exempt";
    case "未繳納":
      return "status-unpaid";
    default:
      return "bg-gray-400 text-gray-900";
  }
};

export const getShortStatus = (status: FeeStatus): string => {
  switch (status) {
    case "已繳納":
      return "已繳納";
    case "有會員資格（但未繳納）":
      return "免繳費";
    case "未繳納":
      return "未繳納";
    default:
      return "未記錄";
  }
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString("zh-TW");
};

export const calculatePercentage = (
  part: number,
  total: number,
  decimalPlaces: number = 1,
): string => {
  if (total === 0) return "0%";
  const percentage = (part / total) * 100;
  return `${percentage.toFixed(decimalPlaces)}%`;
};
export interface StudentStats {
  total: number;
  paid: number;
  exempt: number;
  unpaid: number;
  paymentRate: number;
}

export const calculateStudentStats = (students: Student[]): StudentStats => {
  const active = students.filter((s) => !s.isWithdrawn);
  const total = active.length;
  const paid = active.filter((s) => s.status === "已繳納").length;
  const exempt = active.filter(
    (s) => s.status === "有會員資格（但未繳納）",
  ).length;
  const unpaid = active.filter(
    (s) => s.status === "未繳納" || s.status === null,
  ).length;
  const paymentRate = total === 0 ? 0 : (paid / total) * 100;
  return { total, paid, exempt, unpaid, paymentRate };
};
