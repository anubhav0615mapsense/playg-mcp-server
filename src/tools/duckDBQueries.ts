import z from "zod";

export const duckDBToolConfig = {
  title: 'duckDBQueryTool',
  description: 'Tool for running queries provided by user on duckDB',
  inputSchema: z.object({
    queryText: z
      .string()
      .describe('Actual query provided by the user to run'),

    remoteQuery: z
      .boolean()
      .optional()
      .describe('Boolean param for switching between normal and remote duckDB queries (using Quack). Can be set to true when normal queries do not work/throw errors, otherwise it can be skipped.')
  })
}

export interface ddbData {
  message: string;
  responseURL: string;
}

export interface ddbResponse {
  data: ddbData;
}