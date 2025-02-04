export const combineMessage = (message: string[]) => {
  return message.join('\n\n');
};

export function capitalizeFirstLetter(str: string): string {
  if (!str) return '';

  return str.charAt(0).toUpperCase() + str.slice(1);
}
