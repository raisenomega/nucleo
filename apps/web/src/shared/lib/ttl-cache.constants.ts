// TTL para caches de fetch (ver createTtlCache). Semántica por volatilidad del dato.
export const TTL_SHORT_60S = 60 * 1000; // 60s — catálogo/detalle: impactan checkout, refrescar seguido.
export const TTL_MEDIUM_5M = 5 * 60 * 1000; // 5min — home/brand del tenant: cambian rara vez.
export const TTL_LONG_1H = 60 * 60 * 1000; // 1h — data casi estática (reservado para uso futuro).
