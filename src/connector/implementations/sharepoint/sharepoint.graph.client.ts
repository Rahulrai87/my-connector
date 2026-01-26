import axios, { AxiosInstance } from 'axios';
import { SharePointAuthProvider } from './sharepoint.auth';

export class SharePointGraphClient {
  private readonly client: AxiosInstance;

  constructor(private readonly auth: SharePointAuthProvider) {
    this.client = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      timeout: 30000,
    });
  }

  private async headers() {
    return {
      Authorization: `Bearer ${await this.auth.getAccessToken()}`,
    };
  }

  /**
   * Convert site URL to Graph format
   * https://contoso.sharepoint.com/sites/hr
   * -> /sites/contoso.sharepoint.com:/sites/hr
   */
  private toGraphSitePath(siteUrl: string) {
    const url = new URL(siteUrl);
    return `${url.hostname}:${url.pathname}`;
  }

  async getSiteId(siteUrl: string): Promise<string> {
    const path = this.toGraphSitePath(siteUrl);
    const res = await this.client.get(`/sites/${path}`, {
      headers: await this.headers(),
    });
    return res.data.id;
  }

  async getDefaultDriveId(siteId: string): Promise<string> {
    const res = await this.client.get(
      `/sites/${siteId}/drive`,
      { headers: await this.headers() },
    );
    return res.data.id;
  }

  async listFilesRecursive(
    driveId: string,
    recursive: boolean,
  ): Promise<any[]> {
    const collected: any[] = [];

    const walk = async (url: string) => {
      const res = await this.client.get(url, {
        headers: await this.headers(),
      });

      for (const item of res.data.value) {
        if (item.folder && recursive) {
          await walk(
            `/drives/${driveId}/items/${item.id}/children`,
          );
        } else if (item.file) {
          collected.push(item);
        }
      }

      if (res.data['@odata.nextLink']) {
        await walk(
          res.data['@odata.nextLink'].replace(
            'https://graph.microsoft.com/v1.0',
            '',
          ),
        );
      }
    };

    await walk(`/drives/${driveId}/root/children`);
    return collected;
  }
}