import { GraphAuthService } from './graph/graph-auth.service';
import { GraphApiService } from './graph/graph-api.service';
import { extractFolderPath } from './utils/path.util';
import { shouldIncludeFile } from './utils/file-filter.util';

export class SharePointPreBuilder {
  constructor(private readonly auth: GraphAuthService) {}

  async build(siteUrl: string) {
    const token = await this.auth.getAccessToken();
    const graph = new GraphApiService(token);

    const siteId = await graph.getSiteId(siteUrl);
    const driveId = await graph.getDriveId(siteId);
    const folderPath = extractFolderPath(siteUrl);
    const rootItemId = await graph.getItemIdByPath(
      driveId,
      folderPath,
    );

    const scan = async (): Promise<any[]> => {
      const results: any[] = [];

      const walk = async (itemId: string) => {
        const children =
          await graph.listChildrenPaged(
            driveId,
            itemId,
          );

        for (const c of children) {
          if (c.folder) {
            await walk(c.id);
          } else if (shouldIncludeFile(c)) {
            results.push({
              id: c.id,
              name: c.name,
              size: c.size,
              eTag: c.eTag,
              lastModifiedDateTime:
                c.lastModifiedDateTime,
              path: c.parentReference?.path,
            });
          }
        }
      };

      await walk(rootItemId);
      return results;
    };

    return { scan };
  }
}