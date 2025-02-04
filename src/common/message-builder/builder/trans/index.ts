import * as en from './en.json';

export class TransBuilder {
  t(key: string, args?: Record<string, any>): string {
    try {
      const colons = key.split('.');
      let obj = en as any;

      for (let i = 0; i < colons.length; i++) {
        if (typeof obj === 'string') {
          break;
        }

        obj = TransBuilder.parse(obj, colons[i]);
      }

      if (typeof obj === 'string') {
        if (args) {
          Object.keys(args).forEach((key) => {
            obj = obj.replace(new RegExp(`{{${key}}}`, 'g'), TransBuilder.replaceKey(args, key));
          });
        }

        obj = obj.replace(/{{.*}}/g, '');
      }

      return obj as string;
    } catch (err) {
      console.warn(`[Translator] cannot get value of key: ${key}`);
      return key;
    }
  }

  static parse(obj: Record<string, string>, key: string): Record<string, string> | string {
    return obj[key];
  }

  static replaceKey(args: Record<string, any>, key: string): string {
    if (Array.isArray(args[key])) {
      return args[key].join(', ');
    } else {
      return args[key];
    }
  }
}
