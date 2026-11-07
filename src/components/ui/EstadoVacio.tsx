type EstadoVacioProps = {
  titulo: string;
  detalle?: string;
};

export function EstadoVacio({ titulo, detalle }: EstadoVacioProps) {
  return (
    <div className="estado-vacio">
      <h2>{titulo}</h2>
      {detalle && <p>{detalle}</p>}
    </div>
  );
}