const isDict = (val: any): boolean => {
  const valCopied = JSON.parse(JSON.stringify(val));

  try {
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
