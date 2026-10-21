---
name: "Dashboard Privacy and Data Governance"
description: "Use when creating or modifying the sales dashboard, calculating KPIs, querying dashboard data, handling user attributes, or publishing dashboard documentation."
applyTo: ["**/*.html", "**/*.js", "**/*.md"]
---

# Dashboard Privacy and Data Governance

These rules are mandatory for every dashboard, analysis, and generated document in this repository.

## Dashboard Data Source

- Use Supabase MCP in read-only mode as the only data source. After the learning exercise, do not use CSV files or `resources/` as a data source or fallback.
- Validate the schemas and tables before using them, and identify the source tables for each metric.
- Never embed credentials or a live database connection in the dashboard, source examples, or generated documents. Embed only a validated, privacy-safe data snapshot.
- If Supabase is unavailable, stop and report the limitation. Do not fall back to CSV, sample, or invented data.

## Privacy and GDPR

- Never expose customer or data-subject first names, last names, email addresses, dates of birth, postal codes, or other identifying fields anywhere, including charts, KPIs, tooltips, labels, filters, tables, embedded JavaScript data, source examples, and Confluence documentation.
- Limit user-profile analysis to `segmento_cliente`, `genero`, and `comunidad_autonoma`. Do not retrieve or embed identifying attributes merely to hide them in the interface.
- Document in source code why names are excluded: they identify individuals and are unnecessary for aggregate sales analysis.

## Data-Quality Gate

- Validate each required table separately and report an explicit PASS or FAIL result for each table before calculating KPIs. Check missing values, referential integrity, and anomalous values.
- Check expected join cardinality and row counts before and after every join, including whether sales records remain unique at their intended grain.
- Abort if a join duplicates sales or inflates row counts. Report the failed checks instead of producing misleading KPIs.
- If any required table fails validation, stop the affected analysis and report the failure before presenting results.

## Confluence Publishing

- Create documentation only as a child of page ID `1430576442` in space `IADEIADATAENGINEERS`.
- Use the title exactly `{creator name} - Informe ventas`, replacing `{creator name}` with the document creator's name, not a name retrieved from customer data.
- Never publish at the space root or under another parent. Confirm the parent, space, and title before publishing.

## Project Constraints

- Keep the dashboard as a single self-contained HTML file with an embedded, validated, privacy-safe data snapshot.
- Do not introduce external dependencies without explicit approval.
- Prefer simple, business-readable dashboards with interactive filtering.
- Report data-quality limitations before making recommendations.