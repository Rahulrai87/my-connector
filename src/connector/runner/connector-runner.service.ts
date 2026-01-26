import { Injectable } from '@nestjs/common';
import { ConnectorRepository } from '../persistence/repositories/connector.repository';
import { ConnectorRunRepository } from '../persistence/repositories/connector-run.repository';
import { ConnectorJobRepository } from '../persistence/repositories/connector-job.repository';
import { ConnectorFactory } from '../factory/connector.factory';
import { ConnectorError } from '../errors/connector.error';
import { RETRY_POLICY } from './retry/retry.policy';
import { sleep } from '../utils/sleep.util';

@Injectable()
export class ConnectorRunnerService {
  constructor(
    private readonly connectorRepo: ConnectorRepository,
    private readonly runRepo: ConnectorRunRepository,
    private readonly jobRepo: ConnectorJobRepository,
    private readonly factory: ConnectorFactory,
  ) {}

  async run(connectorId: string) {
    const connector = await this.connectorRepo.findById(connectorId);
    if (!connector || connector.status !== 'ACTIVE') return;

    const failures = await this.runRepo.recentFailures(
  connector._id,
  3,
);

if (HealthGuard.shouldPause(failures)) {
  await this.connectorRepo.updateStatus(
    connector._id.toString(),
    'PAUSED',
  );
}

    const run = await this.runRepo.start(connector._id);

    let attempt = 1;
    while (attempt <= RETRY_POLICY.maxAttempts) {
      const job = await this.jobRepo.start(
        connector._id,
        run._id,
        attempt,
      );

      try {
        const impl = this.factory.get(
          connector.connectorType,
          connector,
        );

        // ✅ Runtime PreBuilder (correct place)
        if (impl.preBuilder) {
          await impl.preBuilder.validate();
        }

        await impl.execute();

        await this.jobRepo.success(job._id);
        await this.runRepo.success(run._id);
        return;
      } catch (err: any) {
        await this.jobRepo.fail(job._id, err.message);

        if (!(err instanceof ConnectorError) || !err.retryable) {
          await this.runRepo.fail(run._id, err.message);
          throw err;
        }

        if (attempt === RETRY_POLICY.maxAttempts) {
          await this.runRepo.fail(run._id, err.message);
          throw err;
        }

        await sleep(
          RETRY_POLICY.baseDelayMs *
            Math.pow(RETRY_POLICY.backoffMultiplier, attempt - 1),
        );
        attempt++;
      }
    }
  }
}