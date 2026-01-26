import cron from 'cron';
import { SharePointGraphClient } from './sharepoint.graph.client';
import { FatalError } from '../../errors/connector.error';

export class SharePointRegistrationPreBuilder {
  constructor(
    private readonly graph: SharePointGraphClient,
  ) {}

  async validate(config: any) {
    if (!cron.validate(config.cronJobExpression)) {
      throw new FatalError('Invalid cron expression');
    }

    if (!config.siteUrl?.startsWith('https://')) {
      throw new FatalError('Invalid SharePoint siteUrl');
    }

    // one-time validation
    const siteId = await this.graph.getSiteId(
      config.siteUrl,
    );
    await this.graph.getDefaultDriveId(siteId);
  }
}