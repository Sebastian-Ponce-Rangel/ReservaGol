import { getHealthStatus } from '@/lib/health';

export async function GET() {
  return Response.json(getHealthStatus());
}
