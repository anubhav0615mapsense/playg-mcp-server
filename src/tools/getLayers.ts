import z from "zod";

export const layerToolConfig = {
  title: 'LayersTool',
  description: 'Fetch all user layers/ a single user layer using id/ all versions of a given user layer',
  inputSchema: z.object({
    id: z
      .uuid()
      .optional()
      .describe('Id of the required layer can be specified when user wants to fetch a single layer'),

    originalLayerId: z
      .uuid()
      .optional()
      .describe('Id of the layer whose related versions need to fetched'),

    fetchAll: z
      .boolean()
      .optional()
      .describe("Boolean param that can be set to true when fetching all layers saved under the given user's organization. Fetches all saved layers regardless of org if given user is the Super Admin.")

  })
}