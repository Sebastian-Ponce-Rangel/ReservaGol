import { notFound } from 'next/navigation';
import { PanelCobro } from '@/components/reservagol/PanelCobro';
import { obtenerReserva } from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DetalleReservaPage({ params }: Props) {
  const { id } = await params;
  try {
    const reserva = await obtenerReserva(id);
    return (
      <main className="app-contenido">
        <PanelCobro reserva={reserva} />
      </main>
    );
  } catch (error) {
    if (error instanceof ErrorDeNegocio && error.codigo === 'RESERVA_NO_ENCONTRADA') {
      notFound();
    }
    throw error;
  }
}