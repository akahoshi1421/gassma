const FORMULA_PREFIXES = ["=", "+", "-", "@"];

const escapeFormulaInjection = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(escapeFormulaInjection);
  if (typeof value !== "string") return value;
  if (value.length === 0) return value;
  if (FORMULA_PREFIXES.includes(value[0])) return `'${value}`;
  return value;
};

const escapeFormulaInjectionRow = (row: unknown[]): unknown[] => {
  return row.map(escapeFormulaInjection);
};

export { escapeFormulaInjection, escapeFormulaInjectionRow };
