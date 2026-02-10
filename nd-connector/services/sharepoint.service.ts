@Injectable()
export class SharePointService {
  private client = Client.init({
    authProvider: done => done(null, process.env.GRAPH_TOKEN),
  });

  async fetchFiles(config: any) {
    const acc = [];
    await this.walk(config.typeId.siteId, config.typeId.driveId, config.folderId, config, acc);
    return acc;
  }

  private async walk(siteId, driveId, folderId, config, acc) {
    const res = await this.client
      .api(`/sites/${siteId}/drives/${driveId}/items/${folderId}/children`)
      .get();

    for (const item of res.value) {
      if (item.folder) {
        await this.walk(siteId, driveId, item.id, config, acc);
      } else if (item.file && this.allowed(item, config)) {
        if (!config.lastRunAt || new Date(item.lastModifiedDateTime) > config.lastRunAt) {
          acc.push(item);
        }
      }
    }
  }

  private allowed(file, config) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (config.acceptedExtensions?.length && !config.acceptedExtensions.includes(ext)) return false;
    if (config.maxSizeInMB && file.size > config.maxSizeInMB * 1024 * 1024) return false;
    return true;
  }
}
