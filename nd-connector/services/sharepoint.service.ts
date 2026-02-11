import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

@Injectable()
export class SharePointService {
  private readonly logger = new Logger(SharePointService.name);
  private client: Client;

  constructor() {
    if (!process.env.GRAPH_TOKEN) {
      throw new Error('GRAPH_TOKEN not set');
    }

    this.client = Client.init({
      authProvider: (done) => done(null, process.env.GRAPH_TOKEN),
    });
  }

  async fetchFiles(config: any) {
    const files: any[] = [];

    await this.walkFolder(
      config.typeId.siteId,
      config.typeId.listId,
      config.folderId,
      config,
      files,
    );

    this.logger.log(`Fetched ${files.length} files`);
    return files;
  }

  private async walkFolder(
    siteId: string,
    listId: string,
    folderId: string,
    config: any,
    acc: any[],
  ) {
    let url = `/sites/${siteId}/lists/${listId}/items/${folderId}/driveItem/children`;

    while (url) {
      const res = await this.client.api(url).get();

      for (const item of res.value) {
        if (item.folder) {
          await this.walkFolder(
            siteId,
            listId,
            item.parentReference.id,
            config,
            acc,
          );
          continue;
        }

        if (!item.file) continue;

        if (!this.isAllowed(item, config)) continue;

        if (
          config.lastRunAt &&
          new Date(item.lastModifiedDateTime) <= config.lastRunAt
        ) {
          continue;
        }

        acc.push(item);
      }

      url = res['@odata.nextLink']
        ? res['@odata.nextLink'].replace('https://graph.microsoft.com/v1.0', '')
        : null;
    }
  }

  private isAllowed(file: any, config: any): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (
      config.acceptedExtensions?.length &&
      !config.acceptedExtensions.includes(ext)
    ) {
      return false;
    }

    if (
      config.maxSizeInMB &&
      file.size > config.maxSizeInMB * 1024 * 1024
    ) {
      return false;
    }

    return true;
  }
}
