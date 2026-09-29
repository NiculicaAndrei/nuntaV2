// Constante și funcții geometrice folosite pentru limita sălii
// și pozitionarea/blocarea meselor în interiorul ei.

export const TABLE_RADIUS = 55;

/**
 * Verifică dacă un punct se află în interiorul unui poligon
 * (algoritm ray-casting, standard și robust pentru poligoane convexe/concave).
 * @param {{x:number,y:number}} point
 * @param {{x:number,y:number}[]} polygonPoints
 */
export function isPointInPolygon(point, polygonPoints) {
  const { x, y } = point;
  let inside = false;

  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const xi = polygonPoints[i].x;
    const yi = polygonPoints[i].y;
    const xj = polygonPoints[j].x;
    const yj = polygonPoints[j].y;

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

/**
 * Centrul (media vârfurilor) unui poligon — suficient de precis pentru
 * a alege o poziție implicită pentru o masă nou-adăugată.
 */
export function polygonCentroid(points) {
  if (!points.length) return { x: 0, y: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Cele 4 colțuri ale unui dreptunghi centrat în (centerX, centerY).
 * Folosit de butonul "Cameră Rectangulară Rapidă" — rezultatul e tratat
 * apoi ca orice alt poligon (vârfurile se pot trage individual pt resize).
 */
export function defaultRectangle(centerX, centerY, width = 520, height = 360) {
  const halfW = width / 2;
  const halfH = height / 2;
  return [
    { x: centerX - halfW, y: centerY - halfH },
    { x: centerX + halfW, y: centerY - halfH },
    { x: centerX + halfW, y: centerY + halfH },
    { x: centerX - halfW, y: centerY + halfH },
  ];
}
