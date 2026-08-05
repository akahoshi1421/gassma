class GassmaGroupByHavingDontWriteByError extends Error {
  constructor() {
    super(
      'When using "having" other than "_avg", "_count", "_max", "_min", and "_sum", column names can be used only if they are written in the "by" field.',
    );
    this.name = "GassmaGroupByHavingDontWriteByError";
  }
}

class GassmaGroupByOrderByRequiredError extends Error {
  constructor(...paginationArguments: string[]) {
    const list = paginationArguments.map((name) => `\`${name}\``).join(" and ");
    super(
      `groupBy requires \`orderBy\` when using ${list}. Specify \`orderBy\` with at least one field, or remove ${list}.`,
    );
    this.name = "GassmaGroupByOrderByRequiredError";
  }
}

export {
  GassmaGroupByHavingDontWriteByError,
  GassmaGroupByOrderByRequiredError,
};
