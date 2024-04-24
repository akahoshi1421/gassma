type OrderBy = {
  [key: string]: "asc" | "desc";
};

type Select = {
  [key: string]: true;
};

type AnyUse = {
  [key: string]: any;
};

export { OrderBy, Select, AnyUse };
