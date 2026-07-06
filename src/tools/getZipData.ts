import z from "zod";

interface ZipData {
  id?: string;
  zipcode?: string;
  officeName?: string;
  division?: string;
  region?: string;
  circle?: string;
  type?: string;
  coordinates?: Array<number>[];
}

export interface ZipResponse {
  data: ZipData[];
}

export const zipToolConfig = {
  title: 'ZipDataTool',
  description: `Get zip boundary data using any of the following keys - ${['id', 'zipcode', 'officeName', 'division', 'region', 'circle'].join(', ')}.`,
  inputSchema: {
    key: z
      .enum(['id', 'zipcode', 'officeName', 'division', 'region', 'circle'])
      .describe('Keys that can be used to fetch zip boundary data'),

    value: z
      .string()
      .describe('Value of the provided key using which zip boundary data will be fetched'),

    requiredFields: z
      .string()
      .optional()
      .describe(`requiredFields must be a valid string with comma separated values of required field names, and no spaces. It is an optional field and can include any of the following fields (except 'id', which is returned by default): ${['zipcode', 'officeName', 'division', 'region', 'circle', 'type', 'coordinates'].join(', ')}.`)
  }
}