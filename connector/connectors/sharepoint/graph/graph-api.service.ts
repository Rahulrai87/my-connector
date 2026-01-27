import axios, { AxiosInstance } from 'axios';
import { Config } from '../../../config/config';

export class GraphApiService {
  private client: AxiosInstance;

  constructor(token: string) {
    this.client = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getSiteId(siteUrl: string): Promise<string> {
    const { hostname, pathname } = new URL(siteUrl);
    const res = await this.client.get(
      `/sites/${hostname}:${pathname}`,
    );
    return res.data.id;
  }

  async getDriveId(siteId: string): Promise<string> {
    const res = await this.client.get(
      `/sites/${siteId}/drive`,
    );
    return res.data.id;
  }

  async getItemIdByPath(
    driveId: string,
    path?: string,
  ): Promise<string> {
    if (!path || path === '/') return 'root';

    const res = await this.client.get(
      `/drives/${driveId}/root:${path}`,
    );
    return res.data.id;
  }

  async listChildrenPaged(
    driveId: string,
    itemId: string,
  ): Promise<any[]> {
    let url = `/drives/${driveId}/items/${itemId}/children`;
    const all: any[] = [];

    while (url) {
      const res = await this.client.get(url);
      all.push(...res.data.value);
      url = res.data['@odata.nextLink']
        ? res.data['@odata.nextLink'].replace(
            'https://graph.microsoft.com/v1.0',
            '',
          )
        : null;
    }

    return all;
  }
}