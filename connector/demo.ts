import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GraphService {
  private async getAccessToken(): Promise<string> {
    const params = new URLSearchParams({
      client_id: process.env.SP_CLIENT_ID!,
      client_secret: process.env.SP_CLIENT_SECRET!,
      grant_type: 'client_credentials',
      scope: 'https://graph.microsoft.com/.default',
    });

    const res = await axios.post(
      `https://login.microsoftonline.com/${process.env.SP_TENANT_ID}/oauth2/v2.0/token`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return res.data.access_token;
  }

  async getSiteId(siteBaseUrl: string): Promise<string> {
    const token = await this.getAccessToken();
    const url = new URL(siteBaseUrl);

    const res = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${url.hostname}:${url.pathname}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return res.data.id;
  }

  async getDriveId(siteId: string): Promise<string> {
    const token = await this.getAccessToken();

    const res = await axios.get(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return res.data.id;
  }

  async folderExists(
    driveId: string,
    folderPath: string,
  ): Promise<boolean> {
    const token = await this.getAccessToken();

    try {
      await axios.get(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/root:${folderPath}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return true;
    } catch (e: any) {
      if (e.response?.status === 404) return false;
      throw e;
    }
  }
}
