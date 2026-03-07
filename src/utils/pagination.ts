import type { PaginationParams } from '../types.js';

export function buildPaginationUrl(basePath: string, params?: PaginationParams): string {
  if (!params) return basePath;

  const qp = new URLSearchParams();
  if (params.limit != null) qp.append('limit', params.limit.toString());
  if (params.start) qp.append('start', params.start);
  if (params.end) qp.append('end', params.end);
  if (params.nextToken) qp.append('nextToken', params.nextToken);

  const qs = qp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
