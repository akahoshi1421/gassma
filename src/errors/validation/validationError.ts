class GassmaValidationErrror extends Error {
  constructor(message: string) {
    super(`Key ${message} is not defined in the schema`);
  }
}

export { GassmaValidationErrror };
