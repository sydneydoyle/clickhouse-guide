---
title: Overview
description: What ClickHouse is and what you can do with it.
---

ClickHouse is an open-source **column-oriented database** built for **analytical queries**: questions that scan and summarize lots of rows, like "how many signups did we get per day last month, broken down by country?"

## Who this guide is for

You know some SQL, and you want to understand what ClickHouse is for and get it running quickly. You don't need any prior ClickHouse experience.

## What ClickHouse is good at

- **Aggregating large tables quickly.** `COUNT`, `SUM`, `AVG`, `GROUP BY` and percentiles over millions or billions of rows.
- **Append-heavy data.** Events, logs, metrics, clickstreams, and other data that mostly gets inserted, not updated.
- **Real-time analytics.** Dashboards and user-facing analytics that need answers in milliseconds to seconds.

## What it isn't designed for

- **Transactional workloads** (OLTP) with many small single-row updates and deletes, like an order system's primary database. A row-oriented database such as PostgreSQL or MySQL is usually a better fit there.
- **Fetching one whole row by key, many times per second.** It works, but that isn't where ClickHouse's design pays off.

:::tip[Rule of thumb]
If your query reads **a few columns across many rows**, ClickHouse is a strong fit. If it reads **all the columns of one row**, it probably isn't.
:::

## Ways to run it

| Option | Good for |
| --- | --- |
| `clickhouse local` | Querying files on your laptop with no server at all |
| `clickhouse server` + `clickhouse client` | Learning how a real deployment behaves (used in the [Quickstart](/clickhouse-guide/quickstart/)) |
| Docker image | An isolated, disposable environment |
| ClickHouse Cloud | A managed service, nothing to install |

## What's next

Go to the [Quickstart](/clickhouse-guide/quickstart/) to load sample data and run a query, then read [Concepts](/clickhouse-guide/concepts/) to understand why it was fast.
