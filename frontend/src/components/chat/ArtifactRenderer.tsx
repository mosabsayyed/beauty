import React from "react";
/**
 * ArtifactRenderer Component - CORRECTED VERSION
 * 
 * Extends the Mono-Functional SaaS design system to artifacts:
 * - Monochrome palette with gold accent
 * - Proper color hierarchy
 * - Clean, professional styling
 * 
 * Renders different artifact types:
 * - CHART: Recharts visualizations (translates from Highcharts config)
 * - TABLE: Interactive data tables
 * - REPORT: Markdown/JSON formatted reports
 * - DOCUMENT: HTML/Markdown documents
 */

import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart,
} from 'recharts';
import type {
  Artifact,
  ChartArtifact,
  ReportArtifact,
  DocumentArtifact,
  TableArtifact,
} from '../../types/api';
import { HtmlRenderer } from './renderers/HtmlRenderer';
import { MarkdownRenderer } from './renderers/MarkdownRenderer';
import { CodeRenderer } from './renderers/CodeRenderer';
import { MediaRenderer } from './renderers/MediaRenderer';
import { FileRenderer } from './renderers/FileRenderer';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ArtifactRenderer Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600 }}>Error Rendering Artifact</h3>
          <p style={{ margin: 0, fontSize: 14 }}>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Color constants for charts
const CHART_COLORS = {
  primary: '#D4AF37', // Gold accent
  gray1: '#111827',   // Text primary
  gray2: '#6B7280',   // Text secondary
  gray3: '#9CA3AF',   // Text tertiary
  gray4: '#E5E7EB',   // Border light
  gray5: '#F3F4F6',   // Background light
};

const COLOR_SEQUENCE = [
  '#D4AF37', '#8B5CF6', '#10B981', '#F59E0B', 
  '#EF4444', '#3B82F6', '#EC4899', '#6B7280'
];

// Helper function to transform Highcharts data to Recharts format
function transformChartData(content: any, externalData?: any[]) {
  // 0. If external data (from artifact.data) is provided and looks like Recharts format (array of objects)
  // CRITICAL: Ensure it's NOT a Highcharts series array (which has objects with a 'data' array property)
  if (externalData && Array.isArray(externalData) && externalData.length > 0) {
    const isSeriesArray = externalData.some(item => item && Array.isArray(item.data));
    if (!isSeriesArray) {
      return externalData;
    }
  }

  // Use config if available, otherwise content (handle both wrapper and direct config)
  const source = content.config || content;

  // 1. Direct data array in content
  if (source.data && Array.isArray(source.data)) {
    return source.data;
  }
  
  // 2. Categories + Series (Highcharts style or Radar chart style)
  const categories = source.categories || source.xAxis?.categories;
  
  if (source.series && categories) {
    return categories.map((category: any, index: number) => {
      const point: any = { name: category, category: category }; // Add both for compatibility
      source.series.forEach((series: any) => {
        // Radar charts use series.values, other charts use series.data
        const dataArray = series.values || series.data;
        if (dataArray) {
          const val = dataArray[index];
          point[series.name] = (typeof val === 'object' && val !== null) ? val.y : val;
        }
      });
      return point;
    });
  }
  
  return [];
}



// ============================================================================
// MAIN EXPORTED COMPONENT
// ============================================================================

interface ArtifactRendererProps {
  artifact: Artifact;
  language?: 'en' | 'ar';
  fullHeight?: boolean;
}

export function ArtifactRenderer({ artifact, language = 'en', fullHeight = false }: ArtifactRendererProps) {
  return (
    <ErrorBoundary>
      <ArtifactRendererContent artifact={artifact} language={language} fullHeight={fullHeight} />
    </ErrorBoundary>
  );
}

function ArtifactRendererContent({ artifact, language = 'en', fullHeight = false }: ArtifactRendererProps) {
  const [showDebug, setShowDebug] = useState(false);

  console.log('[ArtifactRenderer] Rendering artifact type:', artifact.artifact_type);
  
  const renderContent = () => {
    const type = artifact.artifact_type.toUpperCase();
    switch (type) {
      case 'CHART':
        return <ChartRenderer artifact={artifact as ChartArtifact} />;
      case 'TABLE':
        return <TableRenderer artifact={artifact as TableArtifact} />;
      case 'REPORT':
        return <ReportRenderer artifact={artifact as ReportArtifact} language={language} fullHeight={fullHeight} />;
      case 'DOCUMENT':
        return <DocumentRenderer artifact={artifact as DocumentArtifact} language={language} fullHeight={fullHeight} />;
      case 'HTML':
        // Assuming HtmlRenderer exists and takes artifact
        return <HtmlRenderer artifact={artifact} />;
      case 'MARKDOWN':
        // Assuming MarkdownRenderer exists and takes artifact
        return <MarkdownRenderer artifact={artifact} />;
      case 'CODE':
        // Assuming CodeRenderer exists and takes code, language, title
        return <CodeRenderer code={artifact.content} language={artifact.language || 'text'} title={artifact.title} />;
      case 'MEDIA':
        // Assuming MediaRenderer exists and takes artifact
        return <MediaRenderer artifact={artifact} />;
      case 'FILE':
        // Assuming FileRenderer exists and takes artifact
        return <FileRenderer artifact={artifact} />;
      case 'JSON':
        // Assuming CodeRenderer can render JSON
        return <CodeRenderer code={JSON.stringify(artifact.content, null, 2)} language="json" title={artifact.title} />;
      default:
        return (
          <div style={{ padding: 20, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Unsupported artifact type: {artifact.artifact_type}
          </div>
        );
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="absolute top-0 right-0 p-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-500 z-50"
      >
        {showDebug ? 'Hide Debug' : 'Debug'}
      </button>
      {showDebug && (
        <pre className="text-xs bg-gray-50 p-2 overflow-auto max-h-40 border-b mb-2">
          {JSON.stringify({
            artifact_type: artifact.artifact_type,
            content_keys: Object.keys(artifact.content),
            // @ts-ignore
            external_data_length: artifact.data?.length,
            // @ts-ignore
            external_data_sample: artifact.data?.[0],
            full_artifact: artifact
          }, null, 2)}
        </pre>
      )}
      {renderContent()}
    </div>
  );
}

// ============================================================================
// CHART RENDERER
// ============================================================================

function ChartRenderer({ artifact }: { artifact: ChartArtifact }) {
  console.log('[ChartRenderer] Received artifact:', artifact);
  console.log('[ChartRenderer] FULL ARTIFACT JSON:', JSON.stringify(artifact, null, 2));
  const { content } = artifact;
  
  // Debug: Log all possible locations where type might be
  console.log('[ChartRenderer] content.chart?.type:', content.chart?.type);
  console.log('[ChartRenderer] content.type:', (content as any).type);
  console.log('[ChartRenderer] artifact.content:', content);
  
  // Try to get type from various locations
  let rawType = content.chart?.type || (content as any).type;
  
  // If no type found, infer from content structure
  if (!rawType) {
    console.log('[ChartRenderer] No type found, inferring from content structure');
    
    // Check for radar chart indicators
    if ((content as any).categories && (content as any).series && (content as any).maxValue) {
      rawType = 'radar';
      console.log('[ChartRenderer] Inferred type: radar (has categories, series, maxValue)');
    }
    // Check for line chart indicators
    else if ((content as any).strokeWidth || artifact.title?.toLowerCase().includes('line')) {
      rawType = 'line';
      console.log('[ChartRenderer] Inferred type: line (has strokeWidth or title contains "line")');
    }
    // Check for bubble chart indicators
    else if (artifact.title?.toLowerCase().includes('bubble')) {
      rawType = 'bubble';
      console.log('[ChartRenderer] Inferred type: bubble (title contains "bubble")');
    }
    // Check for bullet chart indicators
    else if (artifact.title?.toLowerCase().includes('bullet')) {
      rawType = 'bullet';
      console.log('[ChartRenderer] Inferred type: bullet (title contains "bullet")');
    }
    // Check for combo chart indicators
    else if (artifact.title?.toLowerCase().includes('combo')) {
      rawType = 'combo';
      console.log('[ChartRenderer] Inferred type: combo (title contains "combo")');
    }
    // Default to column/bar for simple data
    else {
      rawType = 'column';
      console.log('[ChartRenderer] Inferred type: column (default)');
    }
  }
  
  const chartType = String(rawType).toLowerCase();
  console.log('[ChartRenderer] Chart type detected:', chartType);
  // @ts-ignore - artifact.data comes from MessageBubble enrichment
  const externalData = artifact.data;
  // @ts-ignore - config comes from CanvasPanel
  const rawConfig = content.config;

  // Transform Highcharts data to Recharts format
  let data = transformChartData(content, externalData);
  
  console.log('[ChartRenderer] Data after transformation:', {
    data,
    dataLength: data?.length,
    externalData,
    externalDataLength: externalData?.length,
    contentData: content.data,
    contentDataLength: content.data?.length,
    contentSeries: content.series
  });

  // Special handling for Bubble chart data mapping
  if ((chartType as string) === 'bubble' && rawConfig?.data) {
    data = rawConfig.data.map((item: any) => ({
      ...item,
      z: item.z || item.r || item.value || 1 // Ensure z-axis exists
    }));
  }

  // Special handling for Bullet chart data construction
  if ((chartType as string) === 'bullet' && rawConfig) {
    // Bullet chart simulation:
    // We need a single data point with ranges, value, and target
    const { value, target, ranges } = rawConfig;
    if (value !== undefined) {
      const dataPoint: any = { name: 'Current' };
      
      // Add ranges as stacked bars
      // Recharts stacks values, so we need deltas if ranges are cumulative maxes
      // Assuming ranges are sorted by max
      let prevMax = 0;
      (ranges || []).forEach((r: any, i: number) => {
        dataPoint[`range${i}`] = r.max - prevMax;
        dataPoint[`range${i}Color`] = r.color;
        prevMax = r.max;
      });

      dataPoint.value = value;
      dataPoint.target = target;
      data = [dataPoint];
    }
  }

  const commonProps = {
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
    style: { fontSize: '12px' }
  };

  // Custom tooltip styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--canvas-card-bg)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: 'var(--shadow-card)', padding: 12 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: entry.color }}>
                {entry.name}:
              </span>{' '}
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderSeries = (series: any, index: number, typeOverride?: string) => {
    const type = typeOverride || series.type || 'column';
    const color = series.color || COLOR_SEQUENCE[index % COLOR_SEQUENCE.length];
    
    if (type === 'line') {
      return (
        <Line
          key={index}
          type="monotone"
          dataKey={series.name}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      );
    }
    if (type === 'area') {
      return (
        <Area
          key={index}
          type="monotone"
          dataKey={series.name}
          fill={color}
          stroke={color}
          fillOpacity={0.3}
        />
      );
    }
    return (
      <Bar
        key={index}
        dataKey={series.name}
        fill={color}
        radius={[4, 4, 0, 0]}
      />
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 400, padding: 20 }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Title removed to avoid duplication with CanvasHeader */}
        <ResponsiveContainer width="100%" height="100%">
          {(() => {
            console.log('[ChartRenderer] Rendering chart type:', chartType);
            if (chartType === 'bar' || chartType === 'column') {
              // Extract data keys (excluding the x-axis key)
              const xAxisKey = content.xAxis || 'name';
              const dataKeys = data && data.length > 0 
                ? Object.keys(data[0]).filter(key => key !== xAxisKey)
                : [];
              
              console.log('[ChartRenderer] Bar chart data keys:', { xAxisKey, dataKeys, firstDataPoint: data?.[0] });
              
              return (
            <BarChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} vertical={false} />
              <XAxis dataKey={xAxisKey} stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} />
              <YAxis stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} domain={[content.yAxis?.min || 0, content.yAxis?.max || 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              {content.legend?.enabled !== false && <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.gray2 }} />}
              {/* Render bars dynamically based on data keys */}
              {dataKeys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={content.color || CHART_COLORS.primary} />
              ))}
            </BarChart>
              );
            } else if (chartType === 'line') {
              const xAxisKey = content.xAxis || 'name';
              const dataKeys = data && data.length > 0 
                ? Object.keys(data[0]).filter(key => key !== xAxisKey)
                : [];
              
              return (
            <LineChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} vertical={false} />
              <XAxis dataKey={xAxisKey} stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} />
              <YAxis stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} domain={[content.yAxis?.min || 0, content.yAxis?.max || 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              {content.legend?.enabled !== false && <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.gray2 }} />}
              {dataKeys.map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={content.color || CHART_COLORS.primary} strokeWidth={content.strokeWidth || 2} />
              ))}
            </LineChart>
              );
            } else if (chartType === 'area') {
              const xAxisKey = content.xAxis || 'name';
              const dataKeys = data && data.length > 0 
                ? Object.keys(data[0]).filter(key => key !== xAxisKey)
                : [];
              
              return (
            <AreaChart data={data} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} vertical={false} />
              <XAxis dataKey={xAxisKey} stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} />
              <YAxis stroke={CHART_COLORS.gray2} fontSize={12} tickLine={false} axisLine={{ stroke: CHART_COLORS.gray4 }} domain={[content.yAxis?.min || 0, content.yAxis?.max || 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              {content.legend?.enabled !== false && <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.gray2 }} />}
              {dataKeys.map((key, index) => (
                <Area key={key} type="monotone" dataKey={key} fill={content.color || CHART_COLORS.primary} stroke={content.color || CHART_COLORS.primary} />
              ))}
            </AreaChart>
              );
            } else if (chartType === 'pie') {
              return (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLOR_SEQUENCE[index % COLOR_SEQUENCE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
              );
            } else if (chartType === 'bubble') {
              // Transform bubble data: map xAxis, yAxis, bubbleSize fields to x, y, z
              const bubbleData = data.map((item: any) => ({
                ...item,
                x: item[content.xAxis] || item.x,
                y: item[content.yAxis] || item.y,
                z: item[content.bubbleSize] || item.z || 100
              }));
              
              return (
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} />
              <XAxis type="number" dataKey="x" name={content.xAxis || "x"} stroke={CHART_COLORS.gray2} fontSize={12} />
              <YAxis type="number" dataKey="y" name={content.yAxis || "y"} stroke={CHART_COLORS.gray2} fontSize={12} />
              <ZAxis type="number" dataKey="z" range={[60, 400]} name={content.bubbleSize || "size"} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter
                name="Bubbles"
                data={bubbleData}
                fill={content.colors?.[0] || CHART_COLORS.primary}
              />
            </ScatterChart>
              );
            } else if (chartType === 'radar') {
              console.log('[ChartRenderer] Radar chart data:', { data, categories: content.categories, series: content.series });
              
              return (
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke={CHART_COLORS.gray4} />
              <PolarAngleAxis dataKey="category" stroke={CHART_COLORS.gray2} fontSize={12} />
              <PolarRadiusAxis angle={30} domain={[0, content.maxValue || 100]} stroke={CHART_COLORS.gray4} />
              {content.series && Array.isArray(content.series) && content.series.map((s: any, i: number) => (
                <Radar
                  key={i}
                  name={s.name}
                  dataKey={s.name}
                  stroke={content.colorPalette?.[i] || COLOR_SEQUENCE[i % COLOR_SEQUENCE.length]}
                  fill={content.colorPalette?.[i] || COLOR_SEQUENCE[i % COLOR_SEQUENCE.length]}
                  fillOpacity={0.3}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
              );
            } else if (chartType === 'bullet') {
              // Transform bullet data from comparativeRanges format
              const bulletData = content.comparativeRanges?.map((range: any, i: number) => ({
                name: range.range,
                value: range.max,
                fill: range.color
              })) || [];
              
              return (
            <ComposedChart layout="vertical" data={[{name: content.title || 'Performance', measure: content.measure, target: content.target}]} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} horizontal={false} />
              <XAxis type="number" domain={[0, content.target || 100]} stroke={CHART_COLORS.gray2} fontSize={12} />
              <YAxis type="category" dataKey="name" stroke={CHART_COLORS.gray2} fontSize={12} width={150} />
              <Tooltip />
              <Bar dataKey="target" fill="#000" barSize={2} />
              <Bar dataKey="measure" fill={CHART_COLORS.primary} barSize={20} />
            </ComposedChart>
              );
            } else if (chartType === 'combo') {
              const xAxisKey = content.xAxis || 'name';
              
              return (
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gray4} />
              <XAxis dataKey={xAxisKey} stroke={CHART_COLORS.gray2} fontSize={12} />
              <YAxis stroke={CHART_COLORS.gray2} fontSize={12} />
              <Tooltip />
              <Legend />
              {content.barSeries && <Bar dataKey={content.barSeries.field} fill={content.barSeries.color || CHART_COLORS.primary} />}
              {content.lineSeries && <Line type="monotone" dataKey={content.lineSeries.field} stroke={content.lineSeries.color || CHART_COLORS.secondary} strokeWidth={content.lineSeries.strokeWidth || 2} />}
            </ComposedChart>
              );
            } else {
              return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              Unsupported chart type: {chartType}
            </div>
              );
            }
          })()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================================
// TABLE RENDERER
// ============================================================================

function TableRenderer({ artifact }: { artifact: any }) {
  console.log('[TableRenderer] Received artifact:', artifact);
  
  const { content } = artifact;
  console.log('[TableRenderer] Content:', content);
  
  // Extract columns - handle both string arrays and object arrays
  const rawColumns = content.columns || content.config?.columns || [];
  const columns = rawColumns.map((col: any) => 
    typeof col === 'string' ? col : (col.name || col.field || col.key || col)
  );
  console.log('[TableRenderer] Extracted columns:', columns);
  
  // Extract rows - try multiple sources
  const rows = content.rows || content.data || content.config?.rows || content.config?.data || [];
  const totalRows = content.total_rows || (rows ? rows.length : 0);
  
  console.log('[TableRenderer] Raw rows:', rows);
  
  // Robust data normalization
  let tableData: any[] = [];
  
  if (Array.isArray(rows) && rows.length > 0) {
    if (Array.isArray(rows[0])) {
      // Array of arrays - map to objects using columns
      tableData = rows.map((row: any[], i: number) => {
        const rowObj: any = { id: i };
        columns.forEach((colName: string, j: number) => {
          if (j < row.length) {
            rowObj[colName] = row[j];
          }
        });
        return rowObj;
      });
    } else if (typeof rows[0] === 'object') {
      // Already array of objects - use directly
      tableData = rows.map((row, i) => ({ ...row, id: row.id || i }));
    }
  }

  console.log('TableRenderer Debug:', { 
    columns, 
    rowsCount: rows?.length, 
    firstRow: rows?.[0], 
    tableDataCount: tableData.length,
    firstTableData: tableData?.[0],
    rawContent: content
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col: any, i: number) => (
              <th
                key={i}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {typeof col === 'string' ? col : (col.name || col.title || JSON.stringify(col))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {tableData.map((row: any, i: number) => (
            <tr key={i}>
              {columns.map((col: any, j: number) => {
                const colKey = typeof col === 'string' ? col : (col.name || col.key || `col${j}`);
                return (
                  <td
                    key={j}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                  >
                    {row[colKey] !== undefined ? row[colKey] : row[j]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {totalRows > tableData.length && (
        <div className="px-6 py-3 text-xs text-gray-500 text-center border-t border-gray-200 dark:border-gray-700">
          Showing {tableData.length} of {totalRows} rows
        </div>
      )}
    </div>
  );
}

// ============================================================================
// REPORT RENDERER
// ============================================================================

function ReportRenderer({ artifact, language, fullHeight }: { artifact: ReportArtifact; language: 'en' | 'ar'; fullHeight?: boolean | number }) {
  const { content } = artifact;
  const isRTL = language === 'ar';

  if (content.format === 'markdown') {
    return (
      <div className="w-full overflow-auto rounded-lg" style={{ border: "1px solid rgba(226,232,240,1)", padding: 8, maxHeight: fullHeight ? "100%" : "400px" }}>
        <div
          className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary prose-a:text-interactive-primary-default"
          dir={isRTL ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(content.body) }}
        />
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto rounded-lg" style={{ border: "1px solid rgba(226,232,240,1)", padding: 8, maxHeight: fullHeight ? "100%" : "400px" }}>
      <pre className="whitespace-pre-wrap text-sm text-text-primary bg-canvas-page p-4 rounded-lg overflow-auto border border-border-default">
        {JSON.stringify(content.body, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================================
// DOCUMENT RENDERER
// ============================================================================

function DocumentRenderer({ artifact, language, fullHeight }: { artifact: DocumentArtifact; language: 'en' | 'ar'; fullHeight?: boolean | number }) {
  const { content } = artifact;
  const isRTL = language === 'ar';

  return (
    <div className="w-full overflow-auto rounded-lg" style={{ border: "1px solid rgba(226,232,240,1)", padding: 8, maxHeight: fullHeight ? "100%" : "400px" }}>
      <div
        className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-strong:text-text-primary prose-li:text-text-primary prose-a:text-interactive-primary-default"
        dir={isRTL ? 'rtl' : 'ltr'}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content.body) }}
      />
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Simple markdown parser
 * In production, use a library like react-markdown
 */
function parseMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in paragraphs, but avoid wrapping block-level elements (h1-6, ul, ol, pre, blockquote)
  html = html.replace(/<p>\s*(<(?:(?:h[1-6])|ul|ol|pre|blockquote)[\s\S]*?>)/g, '$1');
  html = html.replace(/(<\/(?:(?:h[1-6])|ul|ol|pre|blockquote)>)[\s\S]*?<\/p>/g, '$1');

  // Wrap list items (make sure to wrap all occurrences)
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

  return html;
}