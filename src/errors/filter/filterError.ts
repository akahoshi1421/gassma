class GassmaFilterError extends Error {
  constructor(kind: string) {
    super(`”${kind}” is only allowed for ”string” types.`);
  }
}

class GassmaFilterContainsError extends GassmaFilterError {
  constructor() {
    super("contains");
  }
}

class GassmaFilterStartsWithError extends GassmaFilterError {
  constructor() {
    super("startsWith");
  }
}

class GassmaFilterEndsWithError extends GassmaFilterError {
  constructor() {
    super("endsWith");
  }
}

export {
  GassmaFilterContainsError,
  GassmaFilterStartsWithError,
  GassmaFilterEndsWithError,
};
