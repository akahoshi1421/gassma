const rawBrand: unique symbol = Symbol("Gassma.raw");

class RawValue {
  readonly [rawBrand]: unknown;

  constructor(value: unknown) {
    this[rawBrand] = value;
  }
}

const raw = (value: string): RawValue => new RawValue(value);

const isRawValue = (value: unknown): value is RawValue =>
  typeof value === "object" && value !== null && rawBrand in value;

const unwrapRawValue = (value: RawValue): unknown => value[rawBrand];

const unwrapRawCell = (value: unknown): unknown =>
  isRawValue(value) ? unwrapRawValue(value) : value;

export { RawValue, raw, isRawValue, unwrapRawValue, unwrapRawCell, rawBrand };
