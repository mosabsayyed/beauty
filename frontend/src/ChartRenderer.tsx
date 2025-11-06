
import React, { useEffect, useRef } from 'react';
import './canvas.css';

type ChartArtifact = {
  title: string;
  created_at: string;
  content: any;
};

declare global {
  interface Window {
    Highcharts?: any;
  }
}

function loadHighcharts(): Promise<void> {
  if (window.Highcharts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://code.highcharts.com/highcharts.js';
    script.onload = () => {
      const moreScript = document.createElement('script');
      moreScript.src = 'https://code.highcharts.com/highcharts-more.js';
      moreScript.onload = () => {
        const exportingScript = document.createElement('script');
        exportingScript.src = 'https://code.highcharts.com/modules/exporting.js';
        exportingScript.onload = () => resolve();
        exportingScript.onerror = () => reject('Failed to load exporting module');
        document.head.appendChild(exportingScript);
      };
      moreScript.onerror = () => reject('Failed to load highcharts-more module');
      document.head.appendChild(moreScript);
    };
    script.onerror = () => reject('Failed to load Highcharts');
    document.head.appendChild(script);
  });
}

const ChartRenderer: React.FC<{ artifact: ChartArtifact }> = ({ artifact }) => {
  const chartDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chartInstance: any = null;
    let mounted = true;
    async function renderChart() {
      await loadHighcharts();
      if (!mounted || !chartDivRef.current) return;
      const Highcharts = window.Highcharts;
      if (!Highcharts) return;
      chartInstance = Highcharts.chart(chartDivRef.current, buildChartConfig(artifact.content));
    }
    renderChart();
    return () => {
      mounted = false;
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [artifact]);

  function buildChartConfig(chartData: any) {
    // If chartData already has proper Highcharts structure, use it directly
    if (chartData.xAxis && chartData.yAxis && chartData.series) {
      return {
        chart: {
          type: chartData.type || chartData.chart?.type || 'column',
          backgroundColor: '#ffffff',
          ...chartData.chart
        },
        title: chartData.title || { text: chartData.chart_title || '' },
        subtitle: chartData.subtitle || { text: chartData.subtitle || '' },
        xAxis: chartData.xAxis,
        yAxis: chartData.yAxis,
        series: chartData.series,
        credits: { enabled: false },
        exporting: { enabled: true }
      };
    }
    // Otherwise, build from custom format
    return {
      chart: {
        type: chartData.type || 'column',
        backgroundColor: '#ffffff'
      },
      title: { text: chartData.chart_title || '' },
      subtitle: { text: chartData.subtitle || '' },
      credits: { enabled: false },
      exporting: { enabled: true },
      series: chartData.series || []
    };
  }

  return (
    <div className="chart-container">
      <div className="artifact-header">
        <div className="artifact-title-main">{artifact.title}</div>
        <div className="artifact-meta-row">
          <div className="artifact-meta-item">
            <span>📊</span>
            <span>Chart</span>
          </div>
          <div className="artifact-meta-item">
            <span>📅</span>
            <span>Created: {new Date(artifact.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      <div ref={chartDivRef} style={{ minHeight: 400 }} />
      {artifact.content.description && (
        <div className="chart-description">{artifact.content.description}</div>
      )}
    </div>
  );
};

export default ChartRenderer;
