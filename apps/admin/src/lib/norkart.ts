/**
 * Norkart's aerial photography, which is what the parcel map is drawn on.
 *
 * Kartverket's open cache carries no aerial layer and Esri's imagery runs out
 * of detail two zoom levels earlier, so this is the one source that stays sharp
 * close in. The key travels in the tile URL, so it cannot be kept secret from
 * the browser; it is restricted by Norkart on their side instead.
 */

export const NORKART_KEY =
  process.env.NEXT_PUBLIC_NORKART_API_KEY ?? "b8e36d51-119a-423b-b156-d744d54123d5";

export const NORKART_TILE_URL = `https://waapi.webatlas.no/maptiles/tiles/webatlas-orto-newup/wa_grid/{z}/{x}/{y}.jpeg?api_key=${NORKART_KEY}`;

/** Required by Norkart's terms, and shown in the corner of the map. */
export const NORKART_ATTRIBUTION = "Flyfoto: © Norkart";

/** Their deepest level over Ølberg; past this the service returns nothing. */
export const NORKART_MAX_ZOOM = 21;
