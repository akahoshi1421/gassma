class GassmaAggregateMaxError extends Error {
  constructor() {
    super("Cannot produce a maximum value of more than one type.");
  }
}

class GassmaAggregateMinError extends Error {
  constructor() {
    super("Cannot produce a minimum value of more than one type.");
  }
}

class GassmaAggregateMaxTypeError extends Error {
  constructor() {
    super(
      "Only “number”, “string”, “boolean”, and “Date” types are supported."
    );
  }
}

export {
  GassmaAggregateMaxError,
  GassmaAggregateMinError,
  GassmaAggregateMaxTypeError,
};
