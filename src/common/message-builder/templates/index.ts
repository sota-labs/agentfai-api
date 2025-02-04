import * as fs from 'fs';
import * as hbs from 'hbs';
import * as path from 'path';

const templatePath = path.join(process.cwd(), 'src', 'common', 'message-builder', 'templates');
const allFolders = fs.readdirSync(templatePath);
const folders = allFolders.filter((folder) => !folder.includes('.'));
const fileMap = new Map<string, string>();
for (const folder of folders) {
  const PATH = path.join(templatePath, folder);
  const files = fs.readdirSync(PATH);
  for (const file of files) {
    const name = file.split('.')[0];
    fileMap.set(name, `${PATH}/${file}`);
  }
}

export function renderHtml<T>(filename: string, data: T): string {
  if (!data) {
    data = {} as T;
  }
  try {
    const source = fs.readFileSync(fileMap.get(filename), 'utf8').toString();

    hbs.handlebars.registerHelper({
      eq: (v1, v2) => v1 === v2,
      ne: (v1, v2) => v1 !== v2,
      lt: (v1, v2) => v1 < v2,
      gt: (v1, v2) => v1 > v2,
      lte: (v1, v2) => v1 <= v2,
      gte: (v1, v2) => v1 >= v2,
      and: (v1, v2) => v1 && v2,
      or() {
        // eslint-disable-next-line prefer-rest-params
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
      },
    });

    hbs.handlebars.registerHelper('formatPercent', (value) => {
      return value > 0 ? `+${value}` : value;
    });

    const mailTemplate = hbs.handlebars.compile(source);
    return mailTemplate(data);
  } catch (error) {
    console.log(error);
    throw new Error(`Could not render template from ${filename}.hbs`);
  }
}
