/**
 * Architecture page HTML content
 * Embedded as a build-time asset to avoid runtime fetching and proxy issues
 */

export const ARCHITECTURE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <title>Architecture and Features - JOSOOR</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      background: #f5f5f5;
    }

    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
      min-height: 100vh;
    }

    header {
      margin-bottom: 40px;
      text-align: center;
    }

    h1 {
      font-size: 32px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 16px;
      color: #6b7280;
    }

    .content {
      display: flex;
      justify-content: center;
      gap: 40px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .image-wrapper {
      flex: 1;
      min-width: 300px;
      max-width: 600px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .image-wrapper img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .description {
      flex: 1;
      min-width: 300px;
      max-width: 600px;
    }

    .description h2 {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
    }

    .description p {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .container {
        padding: 24px 16px;
      }

      h1 {
        font-size: 24px;
      }

      .content {
        flex-direction: column;
        gap: 24px;
      }

      .description h2 {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Architecture and Features</h1>
      <p class="subtitle">JOSOOR - Cognitive Digital Twin</p>
    </header>

    <div class="content">
      <div class="image-wrapper">
        <img src="/architecture/aaa_files/image001.png" alt="JOSOOR Architecture Diagram - showing the digital twin infrastructure with Middleware Layer, Orchestration Layer, and LLM components">
      </div>

      <div class="description">
        <h2>System Architecture</h2>
        <p>JOSOOR is built on a sophisticated multi-layered architecture designed to support complex cognitive digital twin operations.</p>
        
        <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">Key Components:</h3>
        <ul style="margin-left: 24px; margin-bottom: 16px; color: #4b5563; line-height: 1.8;">
          <li><strong>Middleware Layer:</strong> Handles data routing and system integration</li>
          <li><strong>Orchestration Layer:</strong> Manages complex workflows and data flow</li>
          <li><strong>LLM & Cognitive Layer:</strong> Powers intelligent analysis and decision-making</li>
          <li><strong>Knowledge Graph:</strong> Maintains entity relationships and semantic data</li>
        </ul>

        <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 24px; margin-bottom: 8px;">Core Features:</h3>
        <ul style="margin-left: 24px; color: #4b5563; line-height: 1.8;">
          <li>Real-time data synchronization</li>
          <li>Multi-entity semantic analysis</li>
          <li>Advanced knowledge representation</li>
          <li>Scalable graph-based storage</li>
          <li>AI-powered insights and recommendations</li>
        </ul>
      </div>
    </div>
  </div>
</body>
</html>`;
