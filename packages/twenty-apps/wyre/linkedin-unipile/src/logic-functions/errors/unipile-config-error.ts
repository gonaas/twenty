export class UnipileConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnipileConfigError';
  }
}
