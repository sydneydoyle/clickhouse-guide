---
title: How ClickHouse stores data
description: ClickHouse stores each column separately, writes every insert as a new part, and merges parts in the background. The table's sorting key decides how much of that data a query has to read.
sidebar:
  label: How ClickHouse stores data
---

## Before you begin

- A running server with the `events` table from the [Quickstart](/clickhouse-guide/quickstart/), if you want to run the examples.

## Key terms

A few terms explain most of what makes ClickHouse fast:

- **Columns** are stored separately. A query reads only the columns it names.
- **Parts** are the files on disk that hold a table's rows. Every `INSERT` writes at least one new part.
- **Merges** combine small parts into larger ones in the background.
- The **sorting key** is the table's `ORDER BY`. It sets the order rows are stored in.
- **Granules** are blocks of rows, 8,192 by default. ClickHouse decides which granules to read, not which rows.

For example, in the Quickstart's `events` table, a query that counts purchases reads two columns (`event_type` and `user_id`) and skips the other three. Because the table is sorted by `event_type`, it also reads only the granules that hold purchases: 32 of the table's 123.

## When to use `LowCardinality`

Most columns use a plain type, such as `String` or `UInt32`. `LowCardinality(String)` stores each distinct value once in a dictionary, and keeps a small code for each row instead.

| Use `LowCardinality(String)` when | Example |
| --- | --- |
| A column has a small set of values that repeat. | `event_type`: four values across a million rows |
| You filter or group by the column often. | `WHERE event_type = 'purchase'` |

| Use `String` when | Example |
| --- | --- |
| Most values are unique. | A URL with query parameters, or a session ID |
| The set of values keeps growing without limit. | Free-text search terms |

In the Quickstart table, `event_type` takes 4.74 KiB on disk, compared with 3.82 MiB for `page`, even though both hold one million values. To check your own tables, see the [Data engineers guide](/clickhouse-guide/guides/data-engineers/#check-how-much-space-a-table-uses).

## What happens when you insert data

On each `INSERT`, ClickHouse:

1. Sorts the incoming rows by the table's sorting key.
2. Writes them to disk as a new part.
3. Makes the part available to queries as soon as the write finishes.

Later, in the background, ClickHouse merges parts into larger ones. The old parts are marked inactive, then deleted.

You can watch this happen in `system.parts`. Three separate inserts into a new table create three parts:

```sql
CREATE TABLE parts_demo (id UInt32) ENGINE = MergeTree ORDER BY id;

INSERT INTO parts_demo SELECT number FROM numbers(1000);
INSERT INTO parts_demo SELECT number FROM numbers(1000);
INSERT INTO parts_demo SELECT number FROM numbers(1000);

SELECT count() AS active_parts
FROM system.parts
WHERE table = 'parts_demo' AND active;
```

The result is `3`. `OPTIMIZE TABLE parts_demo FINAL` forces a merge right away, which is useful for seeing it happen. Afterwards, `system.parts` shows one active part with all 3,000 rows, and the three original parts marked inactive:

```
┌─name──────┬─rows─┬─active─┐
│ all_1_1_0 │ 1000 │      0 │
│ all_1_3_1 │ 3000 │      1 │
│ all_2_2_0 │ 1000 │      0 │
│ all_3_3_0 │ 1000 │      0 │
└───────────┴──────┴────────┘
```

### How inserts affect parts

- **One row per insert** — Each insert still writes a whole part, so thousands of single-row inserts create thousands of tiny parts for the server to merge. Batch rows into inserts of thousands or more.
- **One large insert** — The Quickstart's single `INSERT` of one million rows created one part.
- **Merges** — Run on their own schedule. You don't need to trigger them. `OPTIMIZE ... FINAL` rewrites the whole table, so use it for demonstrations, not as routine maintenance.

## How the sorting key decides what a query reads

ClickHouse keeps a small index with one entry per granule, in sorting-key order. When a query filters on the leading columns of the sorting key, ClickHouse uses that index to skip granules that can't match.

To see which granules a query reads, use `EXPLAIN indexes = 1`:

```sql
EXPLAIN indexes = 1
SELECT count() FROM events WHERE event_type = 'purchase';
```

| Query filters on | Granules read | Why |
| --- | --- | --- |
| `event_type = 'purchase'` | 32 of 123 | `event_type` is the first column of the sorting key, so purchases are stored together. |
| `page = '/page/3'` | 123 of 123 | `page` isn't in the sorting key, so matching rows could be in any granule. |

When you choose a sorting key, put the columns you filter on most often first. Columns with fewer distinct values usually go before columns with many.

## Why the numbers don't match

Row counts can differ depending on where you look, because each place counts something different:

- **`count()`** — The rows in the table. This is the number to trust.
- **Rows in `system.parts`** — Includes inactive parts until they're deleted. In the example above, the parts list 6,000 rows for a table that holds 3,000. Add `WHERE active` to count only current parts.
- **Rows read by a query** — ClickHouse reads whole granules, so it reads more rows than match. Counting purchases read 262,144 rows (32 granules of 8,192) to find about 250,000 purchases.

## Get started

1. Follow the [Quickstart](/clickhouse-guide/quickstart/) to create the `events` table.
2. Run the `EXPLAIN` example above to see granule skipping.
3. Follow the [Data engineers guide](/clickhouse-guide/guides/data-engineers/) to choose a sorting key for your own data.

For the full reference, see [MergeTree](https://clickhouse.com/docs/reference/engines/table-engines/mergetree-family/mergetree) and [sparse primary indexes](https://clickhouse.com/docs/guides/clickhouse/data-modelling/sparse-primary-indexes) in the ClickHouse docs.
