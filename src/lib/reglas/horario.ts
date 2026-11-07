export function haySolape(
  aInicio: string,
  aFin: string,
  bInicio: string,
  bFin: string,
): boolean {
  return aInicio < bFin && bInicio < aFin;
}

export function finPosteriorAInicio(inicio: string, fin: string): boolean {
  return fin > inicio;
}