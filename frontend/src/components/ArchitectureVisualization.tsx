import React from 'react';
import './ArchitectureVisualization.css';

export default function ArchitectureVisualization(): React.ReactElement {
  return (
    <div className="arch-wrapper">
      <table className="arch-table">
        <tbody>
          {/* Row 1: Header images + right border */}
          <tr className="arch-row-header">
            <td className="arch-col-left-border"></td>
            <td colSpan={5} className="arch-col-header-main">
              <img src="/architecture/aaa_files/image001.png" alt="JOSOOR Architecture Header" />
              <img src="/architecture/aaa_files/image002.png" alt="Architecture Overview" />
            </td>
            <td rowSpan={6} className="arch-col-right-spacer"></td>
          </tr>

          {/* Row 2: Divider */}
          <tr className="arch-row-divider">
            <td className="arch-col-left-border"></td>
            <td colSpan={5} className="arch-col-divider-main"></td>
          </tr>

          {/* Row 3: System Components + right sidebar starts */}
          <tr className="arch-row-large">
            <td className="arch-col-left-border"></td>
            <td colSpan={4} className="arch-col-main-content">
              <img src="/architecture/aaa_files/image003.png" alt="System Components" />
            </td>
            <td rowSpan={4} className="arch-col-right-sidebar">
              <img
                src="/architecture/aaa_files/image004.png"
                alt="Architecture Flow"
                style={{ width: '90%', height: '90%', objectFit: 'contain', display: 'block' }}
              />
            </td>
          </tr>

          {/* Row 4: Core Systems */}
          <tr className="arch-row-large">
            <td className="arch-col-left-border"></td>
            <td colSpan={4} className="arch-col-main-content">
              <img src="/architecture/aaa_files/image005.png" alt="Core Systems" />
            </td>
          </tr>

          {/* Row 5: Two-column layout */}
          <tr className="arch-row-two-col">
            <td className="arch-col-left-border"></td>
            <td className="arch-col-small-left" style={{ width: '175px' }}>
              <img
                src="/architecture/aaa_files/image006.png"
                alt="Data Processing Layer"
                style={{ width: '110%', display: 'block' }}
              />
            </td>
            <td colSpan={3} className="arch-col-large-right">
              <img
                src="/architecture/aaa_files/image007.png"
                alt="Knowledge Graph Integration"
                style={{ width: '90%', textAlign: 'right', marginLeft: 'auto', display: 'block' }}
              />
            </td>
          </tr>

          {/* Row 6: Bottom three panels */}
          <tr className="arch-row-bottom">
            <td className="arch-col-left-border"></td>
            <td colSpan={2} className="arch-col-bottom-left">
              <img
                src="/architecture/aaa_files/image008.png"
                alt="Middleware Layer"
                style={{ width: '90%', display: 'block' }}
              />
            </td>
            <td className="arch-col-bottom-center">
              <img src="/architecture/aaa_files/image009.png" alt="Orchestration Layer" />
            </td>
            <td className="arch-col-bottom-right">
              <img src="/architecture/aaa_files/image010.png" alt="LLM Integration" />
            </td>
          </tr>

          {/* Row 7: Additional content image spanning the three bottom panels */}
          <tr className="arch-row-additional-content">
            <td className="arch-col-left-border"></td>
            <td colSpan={4} className="arch-col-additional-image">
              <img
                loading="lazy"
                srcSet="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F55d3a367c34b48b8a7637b19d2e0f9db?width=100 100w, https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F55d3a367c34b48b8a7637b19d2e0f9db?width=200 200w, https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F55d3a367c34b48b8a7637b19d2e0f9db?width=400 400w, https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F55d3a367c34b48b8a7637b19d2e0f9db?width=800 800w, https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F55d3a367c34b48b8a7637b19d2e0f9db?width=1200 1200w, https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F55d3a367c34b48b8a7637b19d2e0f9db?width=1600 1600w, https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F55d3a367c34b48b8a7637b19d2e0f9db?width=2000 2000w, https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F55d3a367c34b48b8a7637b19d2e0f9db"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '4.72',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                alt="Additional architecture content"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
