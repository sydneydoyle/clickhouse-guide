---
title: Analysts
description: Get set up to analyze data in ClickHouse, including what data engineers set up first, the tools you'll use, and how to write and check your first analytical queries.
---

## How analysis works in ClickHouse

ClickHouse answers analytical questions in SQL, over tables that can hold billions of rows. You write a query, and ClickHouse reads only the columns it needs, skips the blocks of rows that can't match, and returns the answer, often in milliseconds.

Data engineers create the tables and load the data. You explore those tables and query them. You don't need to know how the data is stored to get correct answers, but knowing a little helps you write queries that stay fast. See [How ClickHouse stores data](/clickhouse-guide/concepts/).

ClickHouse SQL works like the SQL you already know, with extra functions for analytics, such as `uniq()` for distinct counts and `countIf()` for conditional counts.

## Find your way around

These are the tools you'll use most. The examples use the `events` table from the [Quickstart](/clickhouse-guide/quickstart/).

| Tool | What you do there |
| --- | --- |
| `clickhouse client` | Run queries in a terminal. Each result shows how many rows were read and how long it took. |
| Play UI | Run queries in a browser at `http://localhost:8123/play`, with no install. |
| HTTP interface | Send a query to `http://localhost:8123` from a script, a notebook, or `curl`. See [HTTP interface](https://clickhouse.com/docs/concepts/features/connect-to-clickhouse/protocols/http). |
| `SHOW TABLES` and `DESCRIBE TABLE` | See which tables exist, and the columns and types in each. |
| `EXPLAIN indexes = 1` | See how much of a table a query reads, before you run it on a large table. |

## Before you begin

- A running ClickHouse server you can connect to. To run one on your computer, follow the [Quickstart](/clickhouse-guide/quickstart/).
- The names of the tables you'll query, from your data engineers.
- Permission to read those tables. On a local server, the `default` user can read everything.

## What you can do yourself vs. what requires setup

| You can usually do this yourself | Your data engineers set this up |
| --- | --- |
| Explore tables and columns | Create tables and choose their sorting keys |
| Write and run `SELECT` queries | Load data, and keep it loading on a schedule |
| Export results as CSV, JSON, or other formats | Add new columns or tables when you need them |
| Check what a query reads with `EXPLAIN` | Create users and grant access |

## Write your first queries

These examples answer common questions about the `events` table. Each one was run against the Quickstart data.

**How many purchases were there, and by how many users?**

```sql
SELECT count() AS purchases, uniq(user_id) AS buyers
FROM events
WHERE event_type = 'purchase';
```

`uniq()` estimates distinct values, which is fast and accurate enough for most reporting. When you need an exact number, use `uniqExact()`.

**How many signups and purchases happened each day?**

```sql
SELECT
    toDate(event_time) AS day,
    countIf(event_type = 'signup')   AS signups,
    countIf(event_type = 'purchase') AS purchases
FROM events
WHERE event_time >= now() - INTERVAL 3 DAY
GROUP BY day
ORDER BY day;
```

`countIf()` counts the rows that match a condition, so you get several counts from one pass over the data.

**How long do the slowest 10% of each event take?**

```sql
SELECT event_type, quantileExact(0.9)(duration_ms) AS p90_ms
FROM events
GROUP BY event_type
ORDER BY event_type;
```

`quantile()` is faster, but it approximates and can return values such as `4492.900000000001`. Use `quantileExact()` when you report the number.

**Export a result to share it:**

```sql
SELECT event_type, count() AS events
FROM events
GROUP BY event_type
ORDER BY event_type
FORMAT CSVWithNames;
```

`FORMAT` changes the output, not the query. Other formats include `JSONEachRow`, `TabSeparated`, and `Markdown`. See [Formats](https://clickhouse.com/docs/reference/formats).

## Check what a query reads

A query that filters on the table's sorting key reads less data. To see how much of a table a query will read, add `EXPLAIN indexes = 1`:

```sql
EXPLAIN indexes = 1
SELECT count() FROM events WHERE event_type = 'purchase';
```

Look for the `Granules:` line. In the Quickstart table, filtering on `event_type` reads 32 of 123 granules, and filtering on `page` reads all 123. If a query you run often reads every granule, ask your data engineers whether the sorting key fits it. See [How the sorting key decides what a query reads](/clickhouse-guide/concepts/#how-the-sorting-key-decides-what-a-query-reads).

## Find the docs for your task

| If you want to… | Start here |
| --- | --- |
| See every aggregate function, such as `uniq` and `quantile` | [Aggregate functions](https://clickhouse.com/docs/reference/functions/aggregate-functions/reference-index) |
| Group or filter by day, week, or month | [Date and time functions](https://clickhouse.com/docs/reference/functions/regular-functions/date-time-functions) |
| Look up `SELECT` syntax, such as `WITH`, `JOIN`, or `LIMIT BY` | [SELECT](https://clickhouse.com/docs/reference/statements/select) |
| Export results in another format | [Formats](https://clickhouse.com/docs/reference/formats) |
| Query a file on your computer without loading it | [clickhouse-local](https://clickhouse.com/docs/concepts/features/tools-and-utilities/clickhouse-local) |
| Understand why a query is slow | [EXPLAIN](https://clickhouse.com/docs/reference/statements/explain) |

## Troubleshooting

If something isn't working, see [Troubleshooting](/clickhouse-guide/troubleshooting/). Analysts most often run into:

- [Querying `system.columns` returns columns you didn't expect](/clickhouse-guide/troubleshooting/#system-tables-return-columns-from-the-wrong-table)
- [`system.query_log` doesn't exist on a local server](/clickhouse-guide/troubleshooting/#systemquery_log-doesnt-exist)

## Next steps

- Read [How ClickHouse stores data](/clickhouse-guide/concepts/) to write queries that stay fast as tables grow.
