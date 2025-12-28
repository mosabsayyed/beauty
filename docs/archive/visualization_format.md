# Expected Visualization Format

Based on the analysis of `full_chart_logic.txt`, the frontend expects a **Recharts-friendly** data structure (flat array of objects) rather than a Highcharts-style structure (separate categories and series arrays).

## General Structure

```json
{
  "type": "string", // "bar", "column", "line", "area", "bubble", "radar", "bullet", "combo"
  "title": "string", // Optional title
  "content": {
    // Configuration specific to the chart type (mappings)
  },
  "data": [
    // Array of objects where keys correspond to axis/metric names
    { "key1": "value", "key2": 10, "key3": 20 }
  ]
}
```

## Specific Configurations per Chart Type

### 1. Bar / Column / Line / Area
These charts expect a shared X-axis and one or more numeric data series.

**JSON Structure:**
```json
{
  "type": "bar", // or "column", "line", "area"
  "title": "Project Progress",
  "content": {
    "xAxis": "ProjectName", // The key in 'data' objects to use for X-axis labels
    "color": "#8884d8",     // Optional: Override primary color
    "strokeWidth": 2        // Optional: For line charts
  },
  "data": [
    { "ProjectName": "Alpha", "Completion": 80, "Budget": 50 },
    { "ProjectName": "Beta", "Completion": 45, "Budget": 70 }
  ]
}
```

### 2. Bubble Chart
Requires mapping for X, Y, and Size (Z) axes.

**JSON Structure:**
```json
{
  "type": "bubble",
  "title": "Risk vs Impact",
  "content": {
    "xAxis": "RiskScore",    // Key for X-axis
    "yAxis": "ImpactScore",  // Key for Y-axis
    "sizeMetric": "Budget",  // Key for bubble size
    "title": "Initiatives"   // Legend name
  },
  "data": [
    { "RiskScore": 5, "ImpactScore": 8, "Budget": 1000, "Name": "Project A" },
    { "RiskScore": 2, "ImpactScore": 4, "Budget": 500, "Name": "Project B" }
  ]
}
```

### 3. Radar Chart
Used for comparing multiple variables (axes).

**JSON Structure:**
```json
{
  "type": "radar",
  "title": "Skill Assessment",
  "content": {
    "maxValue": 100, // Optional: Domain max
    "title": "Score" // Legend name
  },
  "data": [
    { "axis": "Coding", "value": 80 },
    { "axis": "Design", "value": 60 },
    { "axis": "Management", "value": 70 }
  ]
}
```
*Note: The code hardcodes the angle key as `'axis'` and value key as `'value'`.*

### 4. Bullet Chart
Used for Actual vs Target comparisons.

**JSON Structure:**
```json
{
  "type": "bullet",
  "title": "KPI Performance",
  "content": {
    "measure": "ActualSales", // Key for the bar
    "target": "TargetSales"   // Key for the target marker
  },
  "data": [
    { "kpi": "Q1", "ActualSales": 80, "TargetSales": 100 },
    { "kpi": "Q2", "ActualSales": 110, "TargetSales": 100 }
  ]
}
```
*Note: The code hardcodes the category key as `'kpi'`.*

### 5. Combo Chart (Bar + Line)
Combines a bar and a line on dual axes.

**JSON Structure:**
```json
{
  "type": "combo",
  "title": "Revenue vs Growth",
  "content": {
    "primary": { "metric": "Revenue" },   // Bar (Left Axis)
    "secondary": { "metric": "Growth" }   // Line (Right Axis)
  },
  "data": [
    { "project": "Project A", "Revenue": 5000, "Growth": 12 },
    { "project": "Project B", "Revenue": 7000, "Growth": 15 }
  ]
}
```
*Note: The code defaults X-axis key to `'project'` or `'name'`.*

## Table Format (Inferred)
Since `full_chart_logic.txt` does not explicitly handle tables, the standard recommendation is:

**JSON Structure:**
```json
{
  "type": "table",
  "title": "Detailed Data",
  "data": [
    { "Column1": "Value1", "Column2": "Value2" },
    { "Column1": "Value3", "Column2": "Value4" }
  ]
}
```

## Recommended Prompt Schema (for `orchestrator_zero_shot.py`)

To align with the frontend, replace the `<visualization_schema>` section in your prompt with this:

```xml
<visualization_schema>
  <!-- 1. Canonical JSON-Schema for Recharts (Flat Data) -->
  {
    "type": "object",
    "properties": {
      "type": { "type": "string", "enum": ["bar","column","line","area","radar","bubble","bullet","combo","table"] },
      "title": { "type": "string" },
      "content": {
        "type": "object",
        "properties": {
          "xAxis": { "type": "string", "description": "Key for X-axis (e.g. 'Year', 'Risk')" },
          "yAxis": { "type": "string", "description": "Key for Y-axis (Bubble/Scatter only)" },
          "sizeMetric": { "type": "string", "description": "Key for Bubble Size (Bubble only)" },
          "measure": { "type": "string", "description": "Key for Bullet Measure" },
          "target": { "type": "string", "description": "Key for Bullet Target" },
          "primary": { "type": "object", "properties": { "metric": { "type": "string" } } },
          "secondary": { "type": "object", "properties": { "metric": { "type": "string" } } }
        }
      },
      "data": {
        "type": "array",
        "description": "Flat array of objects. Each object contains all metrics for a single data point.",
        "items": {
          "type": "object",
          "additionalProperties": true
        }
      }
    },
    "required": ["type", "title", "data"]
  }

  <!-- 2. Single canonical example -->
  "visualizations": [
    {
      "type": "bubble",
      "title": "Project Risk vs Value",
      "content": {
        "xAxis": "RiskScore",
        "yAxis": "ValueScore",
        "sizeMetric": "Budget"
      },
      "data": [
        { "RiskScore": 5, "ValueScore": 80, "Budget": 1000, "Name": "Project A" },
        { "RiskScore": 2, "ValueScore": 40, "Budget": 500, "Name": "Project B" }
      ]
    }
  ]
</visualization_schema>
```
```
