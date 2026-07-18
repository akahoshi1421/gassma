const skip: unique symbol = Symbol("Gassma.skip");

const isSkipValue = (value: unknown): value is typeof skip => value === skip;

export { skip, isSkipValue };
