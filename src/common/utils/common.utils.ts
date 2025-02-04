export const autoImport = (module) => {
  return Object.keys(module).map((moduleName) => module[moduleName]);
};
