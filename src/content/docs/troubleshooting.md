---
title: Troubleshooting
description: Problems found by testing this guide against a running ClickHouse server, with the cause, the fix, and how each was found.
---

Every entry on this page comes from running the commands in this guide. Nothing here is hypothetical.

**Test environment:** macOS on Apple Silicon, single-binary install, ClickHouse `26.12.1.349`, 24 November 2026.

## The install script also installs `clickhousectl` outside your folder

**When it happens:** Step 1, single-binary install.

**What you see:** The script downloads the `clickhouse` binary into the current folder as expected, and then also downloads a second tool, `clickhousectl`, into `~/.local/bin`, adding a `chctl` alias next to it.

**Cause:** This is intended behavior of the script at `https://clickhouse.com/`. `clickhousectl` is a CLI for managing local and Cloud ClickHouse. The quickstart doesn't need it.

**Fix:** To download only the ClickHouse binary, set `CLICKHOUSE_ONLY=1` for the script:

```sh
curl https://clickhouse.com/ | CLICKHOUSE_ONLY=1 sh
```

If you already installed it and don't want it, delete `~/.local/bin/clickhousectl` and `~/.local/bin/chctl`.

**How I found it:** I saved the script to a file and read it before running it (`curl https://clickhouse.com/ -o install.sh`), rather than piping it straight into `sh`.

## The install script downloads a development build, not a release

**When it happens:** Step 1, single-binary install.

**What you see:** `./clickhouse --version` reports a version newer than the latest stable release.

**Cause:** The script downloads from the `master` branch by default. That's fine for learning, but not what you want for anything you depend on.

**Fix:** To get the newest release branch instead:

```sh
curl https://clickhouse.com/ | CLICKHOUSE_BRANCH=latest sh
```

**How I found it:** The line `CLICKHOUSE_BRANCH="${CLICKHOUSE_BRANCH:-master}"` in the script, found while reading it for the previous entry.

## The server fills the current folder with directories

**When it happens:** Step 2, `./clickhouse server`.

**What you see:** New folders appear next to the binary: `access`, `data`, `metadata`, `store`, `tmp`, `user_files` and others.

**Cause:** Started without a config file, the server stores its data and metadata in the directory you ran it from.

**Fix:** Nothing to fix, but it's why the quickstart has you make a dedicated `clickhouse-quickstart` folder first. To remove everything, including your tables, stop the server and delete that folder.

**How I found it:** Ran `ls` after the server started.

## The server prints warnings on startup

**When it happens:** Step 2, `./clickhouse server` on macOS.

**What you see:** A fast-scrolling log that includes `<Warning>` lines, for example about `seccomp`, about the maximum number of threads being lower than 30000, and about `users.list` not existing.

**Cause:** These are normal on a fresh local server. `seccomp` only exists on Linux, macOS has a lower default thread limit, and `users.list` is created on first start.

**Fix:** None needed for the quickstart. The server is ready once `./clickhouse client` connects. In my test that took about a second.

**How I found it:** Searched the server log for `warn` and `error` and checked that queries still ran normally.

## Every column gets the same "random" value

**When it happens:** Step 5, if you write the `INSERT` with plain `rand()` calls.

**What you see:**

```sql
SELECT rand() % 100 AS a, rand() % 100 AS b, rand() % 100 AS c FROM numbers(3);
```

```
┌──a─┬──b─┬──c─┐
│ 76 │ 76 │ 76 │
│ 16 │ 16 │ 16 │
│ 65 │ 65 │ 65 │
└────┴────┴────┘
```

**Cause:** ClickHouse computes identical expressions in one query only once, and `rand()` with no arguments is the same expression each time.

**Fix:** Give each call a different argument (`rand(1)`, `rand(2)`, …). The argument is otherwise ignored. This is what step 5 does.

**How I found it:** Ran the query above, then the same query with `rand(1)`, `rand(2)`, `rand(3)`, which gave different values per column.

## System tables return columns from the wrong table

**When it happens:** Querying `system.columns` or `system.tables` for a table named `events`, as in the [Data engineers guide](/clickhouse-guide/guides/data-engineers/).

**What you see:** `SELECT name, type FROM system.columns WHERE table = 'events'` returns nine columns, including `event`, `value`, and `description`. The Quickstart table has five.

**Cause:** ClickHouse has a built-in table called `system.events`, which counts server events. Filtering on the table name alone matches both:

```
┌─database─┬─name───┐
│ default  │ events │
│ system   │ events │
└──────────┴────────┘
```

**Fix:** Filter on the database too:

```sql
SELECT name, type
FROM system.columns
WHERE database = currentDatabase() AND table = 'events';
```

**How I found it:** While testing a query for the Data engineers guide, the column list included names that weren't in the `CREATE TABLE` statement. Listing every table called `events` in `system.tables` showed the second one.

## `system.query_log` doesn't exist

**When it happens:** Looking up past queries on a server started with `./clickhouse server`, as in the [Quickstart](/clickhouse-guide/quickstart/).

**What you see:**

```
Code: 60. DB::Exception: ... Unknown table expression identifier 'system.query_log'. (UNKNOWN_TABLE)
```

**Cause:** Started without a config file, the server doesn't create its log tables. The startup log says so for each one, including:

```
Not creating system.query_log since corresponding section 'query_log' is missing from config
```

**Fix:** For the Quickstart, use the client instead. It prints the rows read and the time taken under each result. On a production server, the query log is usually configured. See [system.query_log](https://clickhouse.com/docs/reference/system-tables/query_log).

**How I found it:** Tried to use `system.query_log` to check a query's rows read for this guide, and got `UNKNOWN_TABLE`. Searching the server log for `Not creating` showed about 30 log tables that weren't created, `query_log` among them.

## Not tested yet

- **Docker install path.** Docker wasn't available on the test machine.
- Starting a second server when ports `9000` or `8123` are already in use.
- Linux, Intel Macs and Windows (WSL 2).

## How to add an entry

Copy this block for each new problem. Paste the **exact** error text under **What you see**, so people who search for that error land here.

```md
## <Short description of the symptom>

**When it happens:** <which quickstart step, which install method, OS and version>

**What you see:** <paste the exact error message>

**Cause:** <what was actually wrong, once you found out>

**Fix:** <steps>

**How I found it:** <what you checked, in order, including dead ends>
```
