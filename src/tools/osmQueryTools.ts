import z from "zod";

export const getOsmQueryConfig = {
  title: 'GetOsmQueryTool',
  description: 'The tool for fetching all available OSM queries/ or a single query (using id) in the playground application',
  inputSchema: z.object({
    queryId: z
      .uuid()
      .optional()
      .describe('Id of the OSM query required when fetching a single OSM query')
  })
}

export const runOsmConfig = {
  title: 'RunOsmQueryTool',
  description: 'The tool for running canned OSM queries available in the playground application',
  inputSchema: z.object({
    queryId: z
      .uuid()
      .describe('queryId is the valid UUID of the required osm query user wants to run'),

    parameters: z
      .looseObject({})
      .describe('Parameters that need to be specified for the given query to run successfully'),

    amenities: z
      .string()
      .array()
      .optional()
      .describe('Amenities requested by the user when running a given query')
  })
}