// src/connector/connector.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import { randomUUID } from 'crypto';
import { RunnerFactory } from './lifecycle/runner.factory';
import { Metrics } from './infra/metrics/metrics.interface';
import { Tracer } from './infra/tracer/tracer.interface';

export interface ScheduledConnector {
  id: string;
  type: 'sharepoint' | 's3';
  cron: string;
  context: any;
}

@Injectable()
export class ConnectorScheduler {
  private readonly logger = new Logger(ConnectorScheduler.name);
  private readonly jobs = new Map<string, CronJob>();

  constructor(
    private readonly runnerFactory: RunnerFactory,
    private readonly metrics: Metrics,   // ✅ normal DI
    private readonly tracer: Tracer,     // ✅ normal DI
  ) {}

  register(connector: ScheduledConnector): void {
    if (!connector?.id) throw new Error('id required');
    if (!connector?.type) throw new Error('type required');
    if (!connector?.cron) throw new Error('cron required');

    if (this.jobs.has(connector.id)) {
      this.logger.warn(`Connector ${connector.id} already registered`);
      return;
    }

    this.logger.log(
      `Registering connector ${connector.id} (${connector.type})`,
    );

    const job = new CronJob(connector.cron, async () => {
      const runId = randomUUID();

      this.logger.log('Cron fired', {
        connectorId: connector.id,
        runId,
      });

      this.metrics.increment('connector.cron.triggered', {
        type: connector.type,
      });

      try {
        await this.tracer.trace(
          `connector.${connector.type}.run`,
          async () => {
            const runner = this.runnerFactory.get(connector.type);

            await runner.execute({
              connectorId: connector.id,
              runId,
              ...connector.context,
            });
          },
        );

        this.metrics.increment('connector.cron.success', {
          type: connector.type,
        });
      } catch (err: any) {
        this.metrics.increment('connector.cron.failure', {
          type: connector.type,
        });

        this.logger.error(
          `Cron failed for ${connector.id}`,
          err?.stack || err,
        );
      }
    });

    job.start();
    this.jobs.set(connector.id, job);
  }

  unregister(id: string) {
    const job = this.jobs.get(id);
    if (!job) return;

    job.stop();
    this.jobs.delete(id);
    this.logger.log(`Connector ${id} unregistered`);
  }

  shutdown() {
    for (const job of this.jobs.values()) job.stop();
    this.jobs.clear();
  }
}
