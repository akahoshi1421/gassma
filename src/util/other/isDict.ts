const isDict = (val: any): boolean => {
  try {
    const valCopied = JSON.parse(JSON.stringify(val));
    return (
      valCopied !== null &&
      typeof valCopied === "object" &&
      valCopied.constructor === Object
    );
  } catch {
    return false;
  }
};

export { isDict };
