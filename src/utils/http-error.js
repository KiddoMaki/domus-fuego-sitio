export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export const badRequest = (message) => new HttpError(400, message);
export const notFoundError = (message) => new HttpError(404, message);
export const unprocessable = (message) => new HttpError(422, message);
export const conflict = (message) => new HttpError(409, message);
export const unauthorized = (message) => new HttpError(401, message);
export const forbidden = (message) => new HttpError(403, message);
