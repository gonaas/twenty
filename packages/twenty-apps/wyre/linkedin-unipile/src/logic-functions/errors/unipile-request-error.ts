export class UnipileRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'UnipileRequestError';
    this.status = status;
    this.body = body;
  }
}
