class GassmaAggregateMaxError extends Error {
  constructor() {
    super("Cannot produce a maximum value of more than one type.");
  }
}

class GassmaAggregateMinError extends GassmaAggregateMaxError {}
class GassmaAggregateSumError extends GassmaAggregateMaxError {}
class GassmaAggregateAvgError extends GassmaAggregateMaxError {}

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

class GassmaAggregateAvgTypeError extends GassmaAggregateSumTypeError {}

export {
  GassmaAggregateMaxError,
  GassmaAggregateMinError,
  GassmaAggregateSumError,
  GassmaAggregateAvgError,
  GassmaAggregateTypeError,
  GassmaAggregateSumTypeError,
  GassmaAggregateAvgTypeError,
};
