const CASCADE_TEMP_PREFIX = "__gassma_cascade_tmp_";

const MAX_PROBE_ATTEMPTS = 32;

const createTempValueFactory = (
  isTaken: (candidate: string) => boolean,
): (() => string) => {
  let counter = 0;
  return () => {
    let candidate = `${CASCADE_TEMP_PREFIX}${counter}`;
    counter += 1;
    let attempts = 0;
    while (attempts < MAX_PROBE_ATTEMPTS && isTaken(candidate)) {
      candidate += "_";
      attempts += 1;
    }
    return candidate;
  };
};

export { CASCADE_TEMP_PREFIX, createTempValueFactory };
