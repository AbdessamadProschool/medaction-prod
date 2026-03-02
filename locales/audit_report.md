# Translation Audit Report

**Date:** 01/03/2026 14:32:14

## Summary Statistics

| Metric | Count |
| :--- | :--- |
| French Keys | 4052 |
| Arabic Keys | 4052 |
| Missing in Arabic | 0 |
| Missing in French | 0 |
| Interpolation Mismatches | 5 |
| Potential Placeholders (AR == FR) | 0 |

## ⚠️ Interpolation Mismatches (5)

Variable names must match for proper functionality.

| Key | French | Arabic |
| :--- | :--- | :--- |
| `campaigns.detail.status_days_left` | `count` | `count, {count, يومان متبقيان` |
| `notifications.new` | `count, nouvelles` | `count, جديدة` |
| `delegation.dashboard.my_events.count_label` | `count, un événement, {count` | `count, {count` |
| `delegation.dashboard.articles.count_label` | `none` | `count, {count` |
| `delegation.dashboard.campaigns.count_label` | `none` | `count, {count` |

