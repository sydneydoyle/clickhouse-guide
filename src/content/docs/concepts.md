---
title: Concepts
description: The handful of ClickHouse terms a new user needs to understand.
---

These are the terms you met in the [Quickstart](/clickhouse-guide/quickstart/), in the order you met them.

## Column-oriented storage

A row-oriented database stores every value of one row together. ClickHouse stores every value of one **column** together, in its own files.

When you run `SELECT avg(duration_ms) FROM events`, ClickHouse reads only the `duration_ms` column and skips the others. Similar values stored next to each other also compress well, so even less data comes off disk.

## Table engines

Every ClickHouse table has an **engine** that decides how its data is stored and queried. You choose it with `ENGINE = ...` in `CREATE TABLE`. Most tables use the MergeTree family.

## MergeTree

`MergeTree` is the default engine for most tables. Each `INSERT` writes a new immutable chunk of data on disk called a **part**. In the background, ClickHouse **merges** small parts into larger ones, which is where the name comes from.

:::caution
Because every insert creates a part, inserting one row at a time creates a lot of small parts that the server then has to merge. Insert in batches: thousands of rows or more per `INSERT`.
:::

To see your table's parts:

```sql
SELECT name, rows, active
FROM system.parts
WHERE table = 'events';
```

## Sorting key (`ORDER BY`)

The `ORDER BY` in `CREATE TABLE` is not about query output. It sets the order rows are **stored** in on disk. ClickHouse builds a small **sparse primary index** over that order, so a query that filters on the leading key columns can skip most of the data.

In the quickstart, `ORDER BY (event_type, event_time)` means a filter like `WHERE event_type = 'purchase'` only reads the part of the table holding purchases.

You can see this with `EXPLAIN indexes = 1`. The data is stored in blocks called **granules** (8,192 rows each by default):

```sql
EXPLAIN indexes = 1
SELECT count() FROM events WHERE event_type = 'purchase';
```

In testing, the output included `Granules: 32/123`: the index let ClickHouse skip about three quarters of the table. Filtering on `page` instead, which isn't in the sorting key, showed `Granules: 123/123`, a full scan.

:::tip[Choosing a sorting key]
Put the columns you filter on most often first. Columns with fewer distinct values usually go before columns with many.
:::

## `LowCardinality`

`LowCardinality(String)` stores each distinct value once in a dictionary and keeps small numeric codes in the column instead. Use it for string columns with a limited set of values, like `event_type` (4 values) or a country code. Don't use it for values that are mostly unique, like `user_id` or a URL with query parameters.

## Further reading

- [ClickHouse docs: Core concepts](https://clickhouse.com/docs/concepts)
- [ClickHouse docs: MergeTree](https://clickhouse.com/docs/engines/table-engines/mergetree-family/mergetree)
