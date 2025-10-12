const isDict = (val: any): boolean => {
  return (
    val !== null &&
    typeof val === "object" &&
    (val.constructor === Object || val.constructor === undefined)
  );
};

export { isDict };
