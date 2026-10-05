// src/lib/salary-utils.ts
// Philippine Government Salary Grade Monthly Rates (SSL V / 2024)
// Shared by the Apply Leave form and the HR review modal so both always
// compute the same monetization amount.

export const SALARY_GRADE_TABLE: Record<number, number> = {
  1:  13000,  2:  13519,  3:  14060,  4:  14623,  5:  15211,
  6:  15823,  7:  16461,  8:  17126,  9:  17819,  10: 18549,
  11: 19316,  12: 20124,  13: 20972,  14: 21863,  15: 22799,
  16: 23781,  17: 24812,  18: 25895,  19: 27000,  20: 28000,
  21: 29165,  22: 30531,  23: 33584,  24: 36942,  25: 40637,
  26: 44700,  27: 49171,  28: 54083,  29: 59492,  30: 65441,
  31: 72000,  32: 79200,  33: 87120,
};

/** Monthly salary for a salary grade, or 0 if unknown. */
export const getMonthlySalary = (salaryGrade?: number | string | null): number => {
  return SALARY_GRADE_TABLE[Number(salaryGrade)] || 0;
};

/** CSC daily rate = monthly salary ÷ 22 working days (not rounded). */
export const getDailyRate = (salaryGrade?: number | string | null): number => {
  return getMonthlySalary(salaryGrade) / 22;
};

/** Cash value = (monthly salary ÷ 22) × days, rounded to centavos. */
export const computeCashValue = (
  salaryGrade: number | string | null | undefined,
  days: number
): number => {
  return Math.round(getDailyRate(salaryGrade) * days * 100) / 100;
};