export const autoImport = (module) => {
  return Object.keys(module).map((moduleName) => module[moduleName]);
};

export function sortTrick(listObj: any, listIds: any, key: string, trick = true) {
  const map = new Map(listObj.map((obj) => [obj[key], obj]));

  return listIds.map((id) => {
    if (!map.has(id) && !trick) {
      throw new Error(`Cannot find key ${key}=${id} in listObj`);
    }
    return map.get(id) ?? null;
  });
}
