const isDict = (val: any): val is Record<string, unknown> => {
  return (
    val !== null &&
    typeof val === "object" &&
    (val.constructor === Object ||
      val.constructor === undefined ||
      val.constructor?.name === "Object")
  );
};

export { isDict };
