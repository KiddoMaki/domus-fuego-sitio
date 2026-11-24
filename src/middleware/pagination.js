// MIDDLEWARE de paginación:?page=1&limit=20. Expone req.pagination (offset listo)
// y cabeceras X-* para que el cliente sepa cuántas páginas hay.
export const PAGINATION_HEADERS = "X-Page, X-Per-Page, X-Total-Count, X-Total-Pages";

export function paginate({ defaultLimit = 50, maxLimit = 100 } = {}) {
  return (req, _res, next) => {
    const query = req.sanitized?.query ?? {};
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
    req.pagination = { page, limit, offset: (page - 1) * limit };
    next();
  };
}

export function setPaginationHeaders(res, pagination, total) {
  if (!pagination) return;
  res.set("X-Page", String(pagination.page));
  res.set("X-Per-Page", String(pagination.limit));
  if (total != null) {
    res.set("X-Total-Count", String(total));
    res.set("X-Total-Pages", String(Math.ceil(total / pagination.limit)));
  }
}
