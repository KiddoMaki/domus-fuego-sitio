const baseHeaders = { "Content-Type": "application/json; charset=utf-8" };

export const json = (data, status = 200, extraHeaders = {}) => ({
  statusCode: status,
  headers: { ...baseHeaders, ...extraHeaders },
  body: JSON.stringify(data),
});
export const ok = (data, status = 200) => json(data, status);
export const fail = (status, message) => json({ error: message }, status);
