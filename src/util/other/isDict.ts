// constructor は自前のプロパティで上書きできるがプロトタイプは隠せない。
// 別 realm の Object.prototype もその先が null なので realm を跨いでも成立する。
const isDict = (val: unknown): val is Record<string, unknown> => {
  if (val === null || typeof val !== "object") return false;
  const proto = Object.getPrototypeOf(val);
  if (proto === null) return true;
  return Object.getPrototypeOf(proto) === null;
};

export { isDict };
