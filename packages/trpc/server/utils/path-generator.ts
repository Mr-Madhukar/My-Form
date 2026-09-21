function trimSlashes(str: string): string {
  let start = 0;
  while (start < str.length && str.codePointAt(start) === 47) {
    start++;
  }
  let end = str.length;
  while (end > start && str.codePointAt(end - 1) === 47) {
    end--;
  }
  return str.slice(start, end);
}

export function generatePath(base: string) {
  return function (path: string): `/${string}` {
    const cleanBase = trimSlashes(base);
    const cleanPath = trimSlashes(path);
    return `/${[cleanBase, cleanPath].filter(Boolean).join("/")}`;
  };
}
