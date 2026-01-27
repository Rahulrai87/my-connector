import axios from 'axios';
import { Config } from '../../../config/config';

export class GraphAuthService {
 client: any;
    constructor(token: string) {
  if (!Config.sharepoint.enabled) {
    this.client = {
      get: async () => ({
        data: { value: [] },
      }),
    } as any;
    return;
  }

  this.client = axios.create({
    baseURL: 'https://graph.microsoft.com/v1.0',
    headers: { Authorization: `Bearer ${token}` },
  });
}
    


  async getAccessToken(): Promise<string> {
    if (!Config.sharepoint.enabled) {
      return 'mock-token';
    }

    const res = await axios.post(
      `https://login.microsoftonline.com/${Config.sharepoint.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: Config.sharepoint.clientId,
        client_secret:
          Config.sharepoint.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    );

    return res.data.access_token;
  }
}