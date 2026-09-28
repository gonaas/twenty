export class LushaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LushaConfigError';
  }
}
