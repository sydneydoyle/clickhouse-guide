---
title: Data engineers
description: Get set up to design tables and load data in ClickHouse, including the decisions you make when creating a table, the tools you'll use, and how to check what's on disk.
---

## How data engineering works in ClickHouse

You decide how data is stored, and analysts query it. Most of your decisions happen when you create a table: its columns and types, its engine, and its sorting key. These choices are hard to change later, and they decide how much data each query reads.

After that, your work is loading data in batches and checking that it lands the way you expect. ClickHouse writes each insert as a new part on disk, and merges parts in the background. See [How ClickHouse stores data](/clickhouse-guide/concepts/).

## Find your way around

These are the tools you'll use most. The examples use the `events` table from the [Quickstart](/clickhouse-guide/quickstart/).

| Tool | What you do there |
| --- | --- |
| `clickhouse client` | Create tables, load files with `INSERT ... FROM INFILE`, and run checks. |
| `clickhouse local` | Inspect and query a file before you load it, with no server. See [clickhouse-local](https://clickhouse.com/docs/concepts/features/tools-and-utilities/clickhouse-local). |
| `system.parts` | See the parts that make up a table, with their row counts and sizes. See [system.parts](https://clickhouse.com/docs/reference/system-tables/parts). |
| `system.columns` | See each column's type and how much space it takes on disk. |
| `EXPLAIN indexes = 1` | Check whether a table's sorting key lets a query skip data. |

## Before you begin

- A running ClickHouse server. To run one on your computer, follow the [Quickstart](/clickhouse-guide/quickstart/).
- A sample of the data you'll load, such as a CSV file.
- The questions analysts will ask most often. They decide the sorting key.

## Decisions you make when creating a table

| Decision | What to consider | In the Quickstart table |
| --- | --- | --- |
| **Column types** | Use the smallest type that fits, such as `UInt32` for IDs. Use `LowCardinality(String)` for text with few distinct values. | `user_id UInt32`, `event_type LowCardinality(String)` |
| **Engine** | Use `MergeTree` unless you have a specific reason not to. | `ENGINE = MergeTree` |
| **Sorting key** | Put the columns analysts filter on most often first, usually with fewer distinct values before more. | `ORDER BY (event_type, event_time)` |

To see what these choices do, see [How ClickHouse stores data](/clickhouse-guide/concepts/).

## Load a file

The steps follow one example: loading a CSV export of new events into the `events` table.

1. **Inspect the file first.** `clickhouse local` reads the file and infers its columns, without a server:

   ```sh
   ./clickhouse local -q "DESCRIBE file('new_events.csv', CSVWithNames)"
   ```

   ```
   event_time   Nullable(DateTime)
   user_id      Nullable(Int64)
   event_type   Nullable(String)
   page         Nullable(String)
   duration_ms  Nullable(Int64)
   ```

   Inferred types are a starting point, not a table definition. Every column is `Nullable`, and numbers are `Int64`. Define your table's types yourself, as in the Quickstart.

2. **Load the file.** In `clickhouse client`, from the folder that holds the file:

   ```sql
   INSERT INTO events FROM INFILE 'new_events.csv' FORMAT CSVWithNames;
   ```

   ClickHouse converts each value to the table's column types as it loads.

3. **Confirm it landed.** Check the row count, then the parts:

   ```sql
   SELECT name, rows
   FROM system.parts
   WHERE database = currentDatabase() AND table = 'events' AND active
   ORDER BY name;
   ```

   Each insert adds a part. In testing, loading a two-row file added a second part, `all_2_2_0`, next to the Quickstart's one-million-row part. ClickHouse merges them later on its own.

Load data in batches of thousands of rows or more. Loading one row at a time creates one part per row. See [Selecting an insert strategy](https://clickhouse.com/docs/concepts/best-practices/selecting-an-insert-strategy).

## Check how much space a table uses

```sql
SELECT
    name,
    formatReadableSize(data_compressed_bytes)   AS compressed,
    formatReadableSize(data_uncompressed_bytes) AS uncompressed
FROM system.columns
WHERE database = currentDatabase() AND table = 'events'
ORDER BY data_compressed_bytes DESC;
```

In the Quickstart table, `page` takes 3.82 MiB on disk, and `event_type` takes 4.74 KiB. That's the effect of `LowCardinality`, and of sorting by `event_type`, which stores identical values together.

<details>
<summary>Why filter on <code>database</code>?</summary>

ClickHouse has a built-in table called `system.events`. Filtering on `table = 'events'` alone matches both tables, and returns columns that aren't in yours. See [Troubleshooting](/clickhouse-guide/troubleshooting/#system-tables-return-columns-from-the-wrong-table).

</details>

## Find the docs for your task

| If you want to… | Start here |
| --- | --- |
| Choose column types | [Data types](https://clickhouse.com/docs/reference/data-types) |
| Understand engines, parts, and merges | [MergeTree](https://clickhouse.com/docs/reference/engines/table-engines/mergetree-family/mergetree) |
| Choose a sorting key | [Sparse primary indexes](https://clickhouse.com/docs/guides/clickhouse/data-modelling/sparse-primary-indexes) |
| Load data from a URL or object storage | [url table function](https://clickhouse.com/docs/reference/functions/table-functions/url) |
| Decide how often and how much to insert | [Selecting an insert strategy](https://clickhouse.com/docs/concepts/best-practices/selecting-an-insert-strategy) |
| Look up any system table | [System tables](https://clickhouse.com/docs/reference/system-tables/overview) |

## Troubleshooting

If something isn't working, see [Troubleshooting](/clickhouse-guide/troubleshooting/). Data engineers most often run into:

- [The server fills the current folder with directories](/clickhouse-guide/troubleshooting/#the-server-fills-the-current-folder-with-directories)
- [Querying `system.columns` returns columns you didn't expect](/clickhouse-guide/troubleshooting/#system-tables-return-columns-from-the-wrong-table)
- [`system.query_log` doesn't exist on a local server](/clickhouse-guide/troubleshooting/#systemquery_log-doesnt-exist)

## Next steps

- Read [How ClickHouse stores data](/clickhouse-guide/concepts/) to see how parts, merges, and the sorting key work.
- Share the [Analysts guide](/clickhouse-guide/guides/analysts/) with the people who'll query your tables.
