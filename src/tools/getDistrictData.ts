import z from "zod";

export interface DistrictData {
  properties: {
    id: string;
    dtname: string;
  };
  geometry: {
    type: string;
    coordinates: Array<number>[][];
  }
}

export interface DistrictDataResp {
  data: DistrictData;
}

export interface DistrictDataRespArray {
  data: DistrictData[];
}

export const districtToolCfg = {
  title: 'DistrictDataTool',
  description: 'Get district boundary data using the given district name',
  inputSchema: z.object({
    multipleDtnames: z
      .array(z.string())
      .optional()
      .describe('Array of district names for fetching boundary data'),
    id: z
      .uuid()
      .optional()
      .describe('Id of the required district whose boundary data will be fetched'),
    dtname: z
      .string()
      .optional()
      .describe('Name of the required district for fetching boundary data')
  })
}

