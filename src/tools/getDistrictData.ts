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
  data: DistrictDataResp;
}

export const districtToolCfg = {
  title: 'DistrictDataTool',
  description: 'Get district boundary data using the given district name',
  inputSchema: {
    dtname: z
      .string()
      .describe('Name of the required district for fetching boundary data')
  }
}

