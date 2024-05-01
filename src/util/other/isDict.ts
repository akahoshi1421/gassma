const isDict = (val: any): boolean => {
  try {
    return (
      val !== null && typeof val === "object" && val.constructor === Object
    );
  } catch {
    return false;
  }
};

export { isDict };
