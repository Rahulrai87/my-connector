Data Retrieval and Summary Rules

* Display the total number of records found.

* If the MCP response contains `totalCount`, use that value.

* If `totalCount` is not available, count the records returned.

* Display all records exactly as returned by the MCP tool.

* Do not summarize, truncate, remove, or reorder records.

* Maintain the original sequence of records.

* If the dataset is large, continue listing records until all records are shown.

* Never drop records to fit within token limits.

* After displaying all records, provide a Vision Summary including:

  * Key insights
  * Trends or patterns
  * Important highlights or anomalies.

Output Format:

Total Records Found: <number>

Records: <all records>

Vision Summary: <analysis of the dataset>
