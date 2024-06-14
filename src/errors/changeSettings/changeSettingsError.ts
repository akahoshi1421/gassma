class GassmaInValidColumValueError extends Error {
  constructor() {
    super(
      "startColumValue and endColumValue can only use number, [a-z] and [A-Z]."
    );
  }
}

export { GassmaInValidColumValueError };
