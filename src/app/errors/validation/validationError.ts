class GassmaValidationErrror extends Error {
  constructor(message: string) {
    super(`Key ${message} is not defined in the schema`);
  }
}

class GassmaHavingValidationError extends Error {
  constructor() {
    super(
      `The “having” field must be one of the following: “_avg”, “_count”, “_max”, “_min”, and “_sum”.`
    );
  }
}

export { GassmaValidationErrror, GassmaHavingValidationError };
