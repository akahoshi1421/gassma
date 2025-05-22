class GassmaInValidColumnValueError extends Error {
  constructor() {
    super(
      "startColumnValue and endColumnValue can only use number, [a-z] and [A-Z]."
    );
  }
}

export { GassmaInValidColumnValueError };
