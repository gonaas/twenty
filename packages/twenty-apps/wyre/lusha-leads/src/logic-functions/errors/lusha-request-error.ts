export class LushaRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'LushaRequestError';
    this.status = status;
    this.body = body;
  }
}
