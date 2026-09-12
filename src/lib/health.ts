export type HealthStatus = {
  ok: boolean;
  service: string;
  environment: string;
  timestamp: string;
};

export function getHealthStatus(): HealthStatus {
  return {
    ok: true,
    service: 'reservagol',
    environment: 'development',
    timestamp: new Date().toISOString(),
  };
}
