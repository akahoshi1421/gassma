class FieldRef {
  readonly modelName: string;
  readonly name: string;

  constructor(modelName: string, name: string) {
    this.modelName = modelName;
    this.name = name;
  }
}

const isFieldRef = (value: unknown): value is FieldRef => {
  return value instanceof FieldRef;
};

export { FieldRef, isFieldRef };
