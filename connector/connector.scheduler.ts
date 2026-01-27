import { CronJob } from 'cron';
import { randomUUID } from 'crypto';
import { ConnectorLockService } from './locks/connector-lock.service';
import { Logger } from './infra/logger/logger.interface';
import { Metrics } from './infra/metrics/metrics.interface';
import { Tracer } from './infra/tracing/tracer';

export class ConnectorScheduler {
  private jobs = new Map<string, CronJob>();

  constructor(
    private readonly lock: ConnectorLockService,
    private readonly logger: Logger,
    private readonly metrics: Metrics,
    private readonly tracer: Tracer,
  ) { }



  register(connector: {
    id: string;
    cron: string;
    runner: any;
    context: any;
  }) {
    if (this.jobs.has(connector.id)) return;

    const job = new CronJob(connector.cron, async () => {
      const runId = randomUUID();
      this.logger.info('Cron fired', {
        connectorId: connector.id,
      });

      const acquired = await this.lock.acquire(
        connector.id,
        runId,
      );
      if (!acquired) return; // another run is active

      try {
        await connector.runner.execute({
          connectorId: connector.id,
          runId,
          ...connector.context,
        });

        this.metrics.increment('connector.cron.triggered', {
          connectorId: connector.id,
        });
      } finally {
        await this.tracer.trace('connector.run', async () => {
          await connector.runner.execute({
            connectorId: connector.id,
            runId,
            ...connector.context,
          });
        });
        await this.lock.release(connector.id, runId);
      }
    });

    job.start();
    this.jobs.set(connector.id, job);
  }
}