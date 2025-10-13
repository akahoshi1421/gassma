class GassmaAggregateMaxError extends Error {
	constructor() {
		super("Cannot produce a maximum value of more than one type.");
		this.name = "GassmaAggregateMaxError";
	}
}

class GassmaAggregateMinError extends GassmaAggregateMaxError {
	constructor() {
		super();
		this.name = "GassmaAggregateMinError";
	}
}

class GassmaAggregateSumError extends GassmaAggregateMaxError {
	constructor() {
		super();
		this.name = "GassmaAggregateSumError";
	}
}

class GassmaAggregateAvgError extends GassmaAggregateMaxError {
	constructor() {
		super();
		this.name = "GassmaAggregateAvgError";
	}
}

class GassmaAggregateTypeError extends Error {
	constructor() {
		super(
			'Only "number", "string", "boolean", and "Date" types are supported.',
		);
		this.name = "GassmaAggregateTypeError";
	}
}

class GassmaAggregateSumTypeError extends Error {
	constructor() {
		super('Only "number" type is supported.');
		this.name = "GassmaAggregateSumTypeError";
	}
}

class GassmaAggregateAvgTypeError extends GassmaAggregateSumTypeError {
	constructor() {
		super();
		this.name = "GassmaAggregateAvgTypeError";
	}
}

export {
	GassmaAggregateMaxError,
	GassmaAggregateMinError,
	GassmaAggregateSumError,
	GassmaAggregateAvgError,
	GassmaAggregateTypeError,
	GassmaAggregateSumTypeError,
	GassmaAggregateAvgTypeError,
};
