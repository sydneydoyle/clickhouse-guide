---
title: Troubleshooting
description: Problems and surprises encountered while following the quickstart, and how to handle them.
---

Every entry on this page comes from actually running the [Quickstart](/clickhouse-guide/quickstart/). Nothing here is hypothetical.

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
