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


import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import "isomorphic-fetch";

export interface SharePointFileMeta {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  eTag?: string;
  version?: number | null;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  parentReference?: any;
}

export class SharePointGraphService {
  private client: Client;

  constructor(
    private tenantId: string,
    private clientId: string,
    private clientSecret: string,
  ) {
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );

    this.client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            "https://graph.microsoft.com/.default",
          );
          return token?.token ?? "";
        },
      },
    });
  }

  // =====================================================
  // ENTRY METHOD
  // =====================================================
  async syncFilesBasedOnLastRun(
    siteId: string,
    listId: string,
    rootItemId: string,
    lastRunAt: Date | null,
    acceptedExtensions: string[],
  ): Promise<SharePointFileMeta[]> {

    const normalizedExtensions = this.normalizeExtensions(acceptedExtensions);

    if (!lastRunAt) {
      return this.fetchAllFilesRecursively(
        siteId,
        listId,
        rootItemId,
        normalizedExtensions,
      );
    }

    return this.fetchFilesRecursivelyWithDateFilter(
      siteId,
      listId,
      rootItemId,
      lastRunAt,
      normalizedExtensions,
    );
  }

  // =====================================================
  // FULL RECURSIVE FETCH
  // =====================================================
  private async fetchAllFilesRecursively(
    siteId: string,
    listId: string,
    rootItemId: string,
    acceptedExtensions: string[],
  ): Promise<SharePointFileMeta[]> {

    const results: SharePointFileMeta[] = [];
    const stack: string[] = [rootItemId];

    while (stack.length > 0) {

      const currentId = stack.pop()!;

      let response = await this.client
        .api(`/sites/${siteId}/lists/${listId}/items/${currentId}/driveItem/children`)
        .select("id,name,webUrl,size,eTag,createdDateTime,lastModifiedDateTime,folder,file,parentReference")
        .top(999)
        .get();

      while (true) {

        for (const item of response.value) {

          if (item.folder) {
            stack.push(item.id);
          }

          if (
            item.file &&
            this.isAcceptedExtension(item.name, acceptedExtensions)
          ) {
            results.push(this.mapToMeta(item));
          }
        }

        if (!response["@odata.nextLink"]) break;

        response = await this.client
          .api(response["@odata.nextLink"])
          .get();
      }
    }

    return results;
  }

  // =====================================================
  // INCREMENTAL RECURSIVE FETCH
  // =====================================================
  private async fetchFilesRecursivelyWithDateFilter(
    siteId: string,
    listId: string,
    rootItemId: string,
    modifiedAfter: Date,
    acceptedExtensions: string[],
  ): Promise<SharePointFileMeta[]> {

    const results: SharePointFileMeta[] = [];
    const stack: string[] = [rootItemId];
    const filterISO = modifiedAfter.toISOString();

    while (stack.length > 0) {

      const currentId = stack.pop()!;

      let response = await this.client
        .api(`/sites/${siteId}/lists/${listId}/items/${currentId}/driveItem/children`)
        .select("id,name,webUrl,size,eTag,createdDateTime,lastModifiedDateTime,folder,file,parentReference")
        .top(999)
        .get();

      while (true) {

        for (const item of response.value) {

          if (item.folder) {
            stack.push(item.id);
          }

          if (
            item.file &&
            item.lastModifiedDateTime &&
            item.lastModifiedDateTime > filterISO &&
            this.isAcceptedExtension(item.name, acceptedExtensions)
          ) {
            results.push(this.mapToMeta(item));
          }
        }

        if (!response["@odata.nextLink"]) break;

        response = await this.client
          .api(response["@odata.nextLink"])
          .get();
      }
    }

    return results;
  }

  // =====================================================
  // NORMALIZE EXTENSIONS
  // =====================================================
  private normalizeExtensions(extensions: string[]): string[] {
    if (!extensions || extensions.length === 0) return [];

    return extensions.map(ext => {
      const lower = ext.toLowerCase().trim();
      return lower.startsWith(".") ? lower : `.${lower}`;
    });
  }

  // =====================================================
  // EXTENSION VALIDATION
  // =====================================================
  private isAcceptedExtension(
    fileName?: string,
    acceptedExtensions?: string[],
  ): boolean {

    if (!fileName) return false;

    if (!acceptedExtensions || acceptedExtensions.length === 0)
      return true; // If no filter provided → allow all

    const lowerName = fileName.toLowerCase();

    return acceptedExtensions.some(ext =>
      lowerName.endsWith(ext),
    );
  }

  // =====================================================
  // ETAG VERSION EXTRACTOR
  // =====================================================
  private extractVersionFromEtag(eTag?: string): number | null {
    if (!eTag) return null;

    const cleaned = eTag.replace(/"/g, "");
    const parts = cleaned.split(",");

    const versionPart = parts.length > 1 ? parts[1] : parts[0];

    const version = Number(versionPart);

    return isNaN(version) ? null : version;
  }

  // =====================================================
  // MAPPING FUNCTION
  // =====================================================
  private mapToMeta(item: any): SharePointFileMeta {
    return {
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      size: item.size,
      eTag: item.eTag,
      version: this.extractVersionFromEtag(item.eTag),
      createdDateTime: item.createdDateTime,
      lastModifiedDateTime: item.lastModifiedDateTime,
      parentReference: item.parentReference,
    };
  }
}

