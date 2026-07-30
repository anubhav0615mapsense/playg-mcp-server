import z from "zod";

export const duckDBToolConfig = {
  title: 'duckDBQueryTool',
  description: 'Tool for running queries provided by user on duckDB',
  inputSchema: {
    queryText: z
      .string()
      .describe('Actual query provided by the user to run'),

    saveAsJSON: z
      .boolean()
      .optional()
      .describe('Boolean param for choosing whether to save the query response as a JSON file'),

    fileNameJSON: z
      .string()
      .optional()
      .describe('File name for saving the query response as a JSON file')
  }
}