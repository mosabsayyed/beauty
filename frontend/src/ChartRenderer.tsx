import React, { useState, useRef, useCallback, useEffect } from 'react';
import Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import 'highcharts/modules/exporting';
import 'highcharts/modules/bullet';
import { Artifact, ChartData } from './types/chat';

interface ChartRendererProps {
  artifact: Artifact;
  showHeader?: boolean;
}

declare global {
  interface Window {
    Highcharts?: any;
  }
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ artifact, showHeader = true }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const buildChartConfig = useCallback((chartData: ChartData) => {
    // If chartData already has proper Highcharts structure, use it directly
    if (chartData.xAxis && chartData.yAxis && chartData.series) {
      return {
        chart: {
          type: chartData.type || chartData.chart?.type || 'column',
          backgroundColor: '#ffffff',
          style: {
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          },
          ...chartData.chart
        },
        title: chartData.title || {
          text: chartData.chart_title || '',
          style: {
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a'
          }
        },
        subtitle: chartData.subtitle || {
          text: chartData.subtitle || '',
          style: {
            fontSize: '14px',
            color: '#666'
          }
        },
        xAxis: chartData.xAxis,
        yAxis: chartData.yAxis,
        series: chartData.series,
        tooltip: chartData.tooltip || {
          shared: true,
          useHTML: true
        },
        legend: chartData.legend || {
          enabled: true
        },
        plotOptions: chartData.plotOptions || {},
        credits: {
          enabled: false
        },
        exporting: {
          buttons: {
            contextButton: {
              enabled: false
            }
          }
        }
      };
    }

    // Otherwise, build from custom format
    const baseConfig = {
      chart: {
        type: chartData.type || 'column',
        backgroundColor: '#ffffff',
        style: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }
      },
      title: {
        text: chartData.chart_title || '',
        style: {
          fontSize: '20px',
          fontWeight: '600',
          color: '#1a1a1a'
        }
      },
      subtitle: {
        text: chartData.subtitle || '',
        style: {
          fontSize: '14px',
          color: '#666'
        }
      },
      credits: {
        enabled: false
      },
      exporting: {
        buttons: {
          contextButton: {
            enabled: false
          }
        }
      },
      series: chartData.series || []
    };

    switch (chartData.type) {
      case 'radar':
      case 'spider':
        return buildRadarConfig(chartData, baseConfig);
      case 'bubble':
        return buildBubbleConfig(chartData, baseConfig);
      case 'bullet':
        return buildBulletConfig(chartData, baseConfig);
      case 'column':
        return buildColumnConfig(chartData, baseConfig);
      case 'line':
        return buildLineConfig(chartData, baseConfig);
      case 'combo':
        return buildComboConfig(chartData, baseConfig);
      default:
        return buildColumnConfig(chartData, baseConfig);
    }
  }, []);

  const renderChart = useCallback(() => {
    if (!chartContainerRef.current) {
      return;
    }

    try {
      // Destroy the existing chart instance if it exists
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying previous chart:', e);
        }
        chartRef.current = null;
      }

      // Validate artifact content
      if (!artifact || !artifact.content) {
        setError('Invalid chart data: missing content');
        return;
      }

      const chartData = artifact.content as ChartData;
      
      // Validate chart data structure
      if (typeof chartData !== 'object') {
        setError('Invalid chart data: content is not an object');
        return;
      }

      const config = buildChartConfig(chartData);

      // Validate config before creating chart
      if (!config || !config.series || config.series.length === 0) {
        setError('Invalid chart configuration: no data series');
        return;
      }

      // Ensure all series have supported types and valid data
      const supportedTypes = ['line', 'spline', 'area', 'areaspline', 'column', 'bar', 'pie', 'scatter', 'bubble', 'bullet', 'radar', 'spider', 'combo'];
      const validatedSeries = config.series.map((series: any) => {
        const validType = supportedTypes.includes(series.type) ? series.type : 'column';
        return {
          ...series,
          type: validType,
          data: Array.isArray(series.data) ? series.data : []
        };
      });

      // Create new config with validated series
      const validatedConfig = {
        ...config,
        series: validatedSeries,
        chart: {
          ...config.chart,
          type: supportedTypes.includes(config.chart?.type) ? config.chart.type : 'column'
        },
        accessibility: {
          enabled: false
        }
      };

      console.log('Validated chart config:', validatedConfig);

      // Create new chart
      chartRef.current = Highcharts.chart(chartContainerRef.current, validatedConfig);
    } catch (error) {
      console.error('Error rendering chart:', error);
      setError(`Failed to render chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [artifact, buildChartConfig]);

  const loadHighchartsAndRender = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      renderChart();
    } catch (error) {
      console.error('Failed to render chart:', error);
      setError('Failed to render chart');
    } finally {
      setIsLoading(false);
    }
  }, [renderChart]);

  useEffect(() => {
    loadHighchartsAndRender();
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying chart on unmount:', e);
        }
      }
    };
  }, [loadHighchartsAndRender]);

  const buildRadarConfig = (chartData: ChartData, baseConfig: any) => {
    return {
      ...baseConfig,
      chart: {
        ...baseConfig.chart,
        polar: true,
        type: 'line'
      },
      pane: {
        size: '80%'
      },
      xAxis: {
        categories: chartData.categories || [],
        tickmarkPlacement: 'on',
        lineWidth: 0
      },
      yAxis: {
        gridLineInterpolation: 'polygon',
        lineWidth: 0,
        min: 0,
        max: chartData.max_value || 5
      },
      tooltip: {
        shared: true,
        pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y}</b><br/>'
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal'
      },
      series: chartData.series
    };
  };

  const buildBubbleConfig = (chartData: ChartData, baseConfig: any) => {
    return {
      ...baseConfig,
      chart: {
        ...baseConfig.chart,
        type: 'bubble',
        plotBorderWidth: 1,
        zoomType: 'xy'
      },
      xAxis: {
        title: {
          text: (chartData as any).x_axis_label || 'X Axis'
        },
        gridLineWidth: 1
      },
      yAxis: {
        title: {
          text: (chartData as any).y_axis_label || 'Y Axis'
        }
      },
      tooltip: {
        useHTML: true,
        headerFormat: '<table>',
        pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
          '<tr><th>{series.xAxis.axisTitle.textStr}:</th><td>{point.x}</td></tr>' +
          '<tr><th>{series.yAxis.axisTitle.textStr}:</th><td>{point.y}</td></tr>' +
          '<tr><th>Size:</th><td>{point.z}</td></tr>',
        footerFormat: '</table>',
        followPointer: true
      },
      plotOptions: {
        bubble: {
          minSize: 20,
          maxSize: 80
        }
      },
      series: chartData.series
    };
  };

  const buildBulletConfig = (chartData: ChartData, baseConfig: any) => {
    return {
      ...baseConfig,
      chart: {
        ...baseConfig.chart,
        type: 'bullet',
        inverted: true,
        marginLeft: 200,
        height: 80 * (chartData.series?.length || 1) + 100
      },
      xAxis: {
        categories: chartData.categories || []
      },
      yAxis: {
        plotBands: (chartData as any).plot_bands || [],
        title: null
      },
      plotOptions: {
        bullet: {
          pointPadding: 0.25,
          borderWidth: 0,
          color: '#667eea',
          targetOptions: {
            width: '200%',
            color: '#333'
          }
        }
      },
      tooltip: {
        pointFormat: '<b>{point.y}</b> (target: {point.target})'
      },
      series: chartData.series
    };
  };

  const buildColumnConfig = (chartData: ChartData, baseConfig: any) => {
    return {
      ...baseConfig,
      xAxis: {
        categories: chartData.categories || [],
        crosshair: true,
        title: {
          text: (chartData as any).x_axis_label || ''
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: (chartData as any).y_axis_label || 'Values'
        }
      },
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
          '<td style="padding:0"><b>{point.y}</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          dataLabels: {
            enabled: (chartData as any).show_data_labels || false
          }
        }
      },
      series: chartData.series
    };
  };

  const buildLineConfig = (chartData: ChartData, baseConfig: any) => {
    return {
      ...baseConfig,
      xAxis: {
        categories: chartData.categories || [],
        title: {
          text: (chartData as any).x_axis_label || ''
        }
      },
      yAxis: {
        title: {
          text: (chartData as any).y_axis_label || 'Values'
        }
      },
      tooltip: {
        shared: true,
        crosshairs: true
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: (chartData as any).show_data_labels || false
          },
          enableMouseTracking: true
        }
      },
      series: chartData.series
    };
  };

  const buildComboConfig = (chartData: ChartData, baseConfig: any) => {
    return {
      ...baseConfig,
      chart: {
        ...baseConfig.chart,
        type: undefined
      },
      xAxis: {
        categories: chartData.categories || [],
        crosshair: true,
        title: {
          text: (chartData as any).x_axis_label || ''
        }
      },
      yAxis: (chartData as any).y_axes || [
        {
          title: {
            text: (chartData as any).y_axis_label || 'Values'
          }
        }
      ],
      tooltip: {
        shared: true
      },
      series: chartData.series
    };
  };

  const exportChart = async (format: 'png' | 'svg') => {
    if (!chartRef.current) {
      alert('No chart to export');
      return;
    }

    try {
      if (format === 'png') {
        chartRef.current.exportChart({
          type: 'image/png',
          filename: 'chart'
        });
      } else if (format === 'svg') {
        chartRef.current.exportChart({
          type: 'image/svg+xml',
          filename: 'chart'
        });
      }
    } catch (error) {
      console.error('Failed to export chart:', error);
      alert('Failed to export chart. Please try again.');
    }
  };

  const getChartTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'radar': 'Spider/Radar Chart',
      'spider': 'Spider/Radar Chart',
      'bubble': 'Bubble Chart',
      'bullet': 'Bullet Chart',
      'column': 'Column Chart',
      'line': 'Line Chart',
      'combo': 'Combo Chart'
    };
    return labels[type] || 'Chart';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="artifact-container">
      {showHeader && (
        <div className="artifact-header">
          <div className="artifact-title-main">{artifact.title}</div>
          <div className="artifact-meta-row">
            <div className="artifact-meta-item">
              <span>📊</span>
              <span>Chart Type: {getChartTypeLabel(artifact.content.type)}</span>
            </div>
            <div className="artifact-meta-item">
              <span>📅</span>
              <span>Created: {formatDate(artifact.created_at)}</span>
            </div>
          </div>
          <div className="artifact-actions">
            <button className="export-btn secondary" onClick={() => exportChart('svg')}>
              📥 Export SVG
            </button>
            <button className="export-btn" onClick={() => exportChart('png')}>
              📥 Export PNG
            </button>
          </div>
        </div>
      )}
      
      <div className="chart-container" style={{ minHeight: '500px' }}>
        {isLoading && (
          <div className="canvas-loading">
            <div className="canvas-loading-spinner"></div>
            <div style={{ marginTop: '10px' }}>Loading Highcharts...</div>
          </div>
        )}
        
        {error && (
          <div className="canvas-empty">
            <div className="canvas-empty-icon">⚠️</div>
            <div className="canvas-empty-text">{error}</div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </div>
      
      {artifact.content.description && (
        <div className="chart-description">
          {artifact.content.description}
        </div>
      )}
    </div>
  );
};

export default ChartRenderer;