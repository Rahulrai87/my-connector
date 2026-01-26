import axios from 'axios';

export class SharePointAuthProvider {
  private accessToken?: string;
  private expiresAt = 0;

  async getAccessToken(): Promise<string> {
    const now = Date.now();

    // reuse token if valid (1 min buffer)
    if (this.accessToken && now < this.expiresAt - 60_000) {
      return this.accessToken;
    }

    const tenantId = process.env.SP_TENANT_ID!;
    const clientId = process.env.SP_CLIENT_ID!;
    const clientSecret = process.env.SP_CLIENT_SECRET!;

    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'https://graph.microsoft.com/.default',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    this.accessToken = response.data.access_token;
    this.expiresAt =
      now + response.data.expires_in * 1000;

    return this.accessToken;
  }
}