# SLB Optisite Multiselect Column Filters Design Specification

## Overview
This specification details the implementation of SLB Optisite-style multiselect column filters in `CustomTable.tsx` for all data tables in the CBM application (**Equipment List**, **Work Order List**, and **Recommendations List**).

## Goals & User Experience
- Replace the basic text string column filters with interactive popover multiselect dropdowns.
- Match the visual aesthetics and behavior of SLB Optisite:
  - Header filter summary: Displays `(N) Item1,Item2,...` when specific options are selected, or blank when all items are selected.
  - Filter Icon: `SlidersHorizontal` icon placed on the left side of the filter input line.
  - Dropdown Popover:
    - Search input (`Search...`) at top of popover for quick option filtering.
    - `(Select All)` checkbox with all-checked, unchecked, and partial (`-` icon) states.
    - Scrollable list of checkboxes for all distinct column values extracted from dataset.
    - Automatic close when clicking outside the popover.

## Component & Data Flow Architecture

### 1. State Management (`CustomTable.tsx`)
- `activeFilterCol`: `string | null` — Stores the key of the column whose filter popover is currently open.
- `selectedFilters`: `Record<string, Set<string>>` — Maps column key -> `Set` of allowed values for that column.
  - If a column key is not present or set to all unique values, no filter is applied.
  - If a subset is selected, only rows matching those values are shown.
- `searchQuery`: `Record<string, string>` — Stores the text entered into the `Search...` input inside the popover of each column.

### 2. Value Extraction & Formatting
- Distinct values for column `col.key` are extracted from `data`:
  - Extract raw cell values `row[col.key]`.
  - Deduplicate values into a sorted array of unique strings.

### 3. Summary Text Rendering
- For a column `col.key`:
  - `totalCount`: total count of unique values.
  - `selectedCount`: count of currently selected values.
  - If `selectedCount === totalCount` or `selectedCount === 0`: render blank input (no active filter restriction).
  - Else: render `(${selectedCount}) ${selectedItemsArray.join(',')}`.

### 4. Filter Evaluation (`filteredData`)
```ts
const filteredData = data.filter(row => {
  return columns.every(col => {
    const colSelected = selectedFilters[col.key];
    const totalVals = getUniqueValuesForColumn(col.key);
    if (!colSelected || colSelected.size === totalVals.length) return true;
    const val = String(row[col.key] || '');
    return colSelected.has(val);
  });
});
```

## Security & Verification
- Framework-native React JSX escaping prevents XSS injection when rendering option text or filter summaries.
- Unit & Lint verification via `npm run lint`.
