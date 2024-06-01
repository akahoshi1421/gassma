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

class GassmaAggregateSumError extends Error {
  constructor() {
    super("Cannot produce a minimum value of more than one type.");
  }
}

class GassmaAggregateTypeError extends Error {
  constructor() {
    super(
      "Only “number”, “string”, “boolean”, and “Date” types are supported."
    );
  }
}

class GassmaAggregateSumTypeError extends Error {
  constructor() {
    super("Only “number” type is supported.");
  }
}

export {
  GassmaAggregateMaxError,
  GassmaAggregateMinError,
  GassmaAggregateSumError,
  GassmaAggregateTypeError,
  GassmaAggregateSumTypeError,
};
