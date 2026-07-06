import z from "zod";

interface LayerData {
  id: string;
  layerName: string;
  userId: string;
  originalLayerId?: string;
  versionNum: number;
  layerData: Object;
  fileType: string;
  geometryType: string;
  totalRecords: number;
  layerSize: string;
  createdAt: Date;
  updatedAt: Date;
  organization?: string;
  organizationId: string;
  style?: Object;
  rampNo?: string;
  selectedField?: string;
}

export interface MultipleLayersResponse {
  data: LayerData[];
}

export interface SingleLayerResponse {
  data: LayerData;
}

export const layerToolConfig = {
  title: 'LayersTool',
  description: 'Fetch all user layers/ a single user layer using id/ all versions of a given user layer',
  inputSchema: {
    id: z
      .string()
      .optional()
      .describe('Id of the required layer can be specified when user wants to fetch a single layer'),

    originalLayerId: z
      .string()
      .optional()
      .describe('Id of the layer whose related versions need to fetched')

  }
}