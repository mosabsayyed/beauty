/**
 * ExcelRenderer - CSV and XLSX file viewing
 * Parses and displays spreadsheet data in a table
 */

import { useState, useEffect } from 'react';

interface ExcelRendererProps {
  data?: any[][];
  csvContent?: string;
  title?: string;
}

export function ExcelRenderer({ data, csvContent, title }: ExcelRendererProps) {
  const [tableData, setTableData] = useState<any[][]>([]);

  useEffect(() => {
    if (data) {
      setTableData(data);
    } else if (csvContent) {
      // Parse CSV
      const rows = csvContent.split('\n').map(row => 
        row.split(',').map(cell => cell.trim())
      );
      setTableData(rows);
    }
  }, [data, csvContent]);

  if (tableData.length === 0) {
    return <div style={{ padding: 24 }}>No data to display</div>;
  }

  const headers = tableData[0];
  const rows = tableData.slice(1);

  return (
    <div style={{ 
      padding: 16,
      background: '#fff',
      height: '100%',
      overflow: 'auto',
    }}>
      {title && (
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
          {title}
        </h3>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {headers.map((header, i) => (
                <th key={i} style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: 600,
                  borderBottom: '2px solid #e5e7eb',
                  whiteSpace: 'nowrap',
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{
                background: i % 2 === 0 ? '#fff' : '#f9fafb',
              }}>
                {row.map((cell, j) => (
                  <td key={j} style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
