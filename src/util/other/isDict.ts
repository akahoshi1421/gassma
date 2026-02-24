const isDict = (val: any): boolean => {
  return (
    val !== null &&
    typeof val === "object" &&
    (val.constructor === Object ||
      val.constructor === undefined ||
      val.constructor?.name === "Object")
  );
};

export { isDict };
