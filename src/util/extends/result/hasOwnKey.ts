const hasOwnKey = (target: Record<string, unknown>, key: string): boolean =>
  Object.getOwnPropertyDescriptor(target, key) !== undefined;

export { hasOwnKey };
