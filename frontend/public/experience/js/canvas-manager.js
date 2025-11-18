/**
 * Canvas Manager - Handles 3-mode layout switching and artifact display
 * Modes: collapsed (25%), expanded (70%), fullscreen (100%)
 */

// Minimal sanitizer to strip tags from untrusted artifact fields.
// This defends against injected HTML like buttons or scripts in title/metadata.
function sanitizeText(s) {
    try {
        if (s === null || s === undefined) return '';
        return String(s).replace(/<\/?[^>]+(>|$)/g, '').trim();
    } catch (e) {
        return String(s || '');
    }
}

class CanvasManager {
    constructor() {
        this.currentMode = 'hidden'; // hidden, collapsed, expanded, fullscreen
        this.currentArtifact = null;
        this.artifacts = [];
        this.init();
    }
    
    init() {
        // Canvas workspace already exists in HTML, just load artifacts
        this.loadRecentArtifacts();
    }
    
    toggleCanvas() {
        if (this.currentMode === 'hidden') {
            this.setMode('collapsed');
        } else {
            this.setMode('hidden');
        }
    }
    
    openCanvas() {
        // Open canvas in collapsed mode if hidden
        if (this.currentMode === 'hidden') {
            this.setMode('collapsed');
        }
    }
    
    cycleMode() {
        const modes = ['collapsed', 'expanded', 'fullscreen'];
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setMode(modes[nextIndex]);
    }
    
    closeCanvas() {
        this.setMode('hidden');
    }
    
    setMode(mode) {
        const workspace = document.getElementById('canvasWorkspace');
        const chatSection = document.querySelector('.chat-section');
        const sidebar = document.getElementById('canvasSidebar');
        const content = document.getElementById('canvasContent');
        const modeLabel = document.getElementById('canvasModeLabel');
        const toggleBtn = document.getElementById('canvasToggle');
        
        // Remove all mode classes
        workspace.classList.remove('mode-collapsed', 'mode-expanded', 'mode-fullscreen');
        chatSection.classList.remove('canvas-active', 'canvas-expanded', 'canvas-fullscreen');
        
        this.currentMode = mode;
        
        switch(mode) {
            case 'hidden':
                workspace.style.width = '0';
                toggleBtn.classList.remove('active');
                toggleBtn.textContent = '📊 Canvas';
                break;
                
            case 'collapsed':
                workspace.style.width = ''; // Clear inline width to let CSS class take over
                workspace.classList.add('mode-collapsed');
                chatSection.classList.add('canvas-active');
                sidebar.style.display = 'block';
                content.style.display = 'none';
                toggleBtn.classList.add('active');
                toggleBtn.textContent = '📊 Canvas (On)';
                modeLabel.textContent = 'Expand';
                break;
                
            case 'expanded':
                workspace.style.width = ''; // Clear inline width to let CSS class take over
                workspace.classList.add('mode-expanded');
                chatSection.classList.add('canvas-expanded');
                sidebar.style.display = 'none';
                content.style.display = 'block';
                modeLabel.textContent = 'Fullscreen';
                break;
                
            case 'fullscreen':
                workspace.style.width = ''; // Clear inline width to let CSS class take over
                workspace.classList.add('mode-fullscreen');
                chatSection.classList.add('canvas-fullscreen');
                sidebar.style.display = 'none';
                content.style.display = 'block';
                modeLabel.textContent = 'Exit Fullscreen';
                break;
        }
    }
    
    closeArtifact() {
        // Return to artifact list view
        const contentContainer = document.getElementById('canvasContent');
        const sidebar = document.getElementById('canvasSidebar');
        
        contentContainer.style.display = 'none';
        sidebar.style.display = 'block';
        
        // Switch to collapsed mode to show list
        if (this.currentMode === 'expanded' || this.currentMode === 'fullscreen') {
            this.setMode('collapsed');
        }
        
        this.currentArtifact = null;
    }
    
    async loadRecentArtifacts() {
        try {
            const API_BASE_URL = window.EXPERIENCE_API_BASE_URL || 'http://localhost:8008/api/v1';
            try {
                const response = await fetch(`${API_BASE_URL}/canvas/artifacts?limit=10`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                this.artifacts = Array.isArray(data.artifacts) ? data.artifacts : [];
            } catch (e) {
                console.error('Failed to load artifacts from backend:', e);
                this.artifacts = [];
            }
            
            // For now, show empty state
            this.renderArtifactList();
        } catch (error) {
            console.error('Failed to load artifacts:', error);
        }
    }
    
    renderArtifactList() {
        const listContainer = document.getElementById('artifactList');
        
        console.log(`Rendering artifact list: ${this.artifacts.length} artifacts`);
        this.artifacts.forEach((art, idx) => {
            console.log(`  ${idx}: ${art.artifact_type} - ${art.title}`);
        });
        
        if (this.artifacts.length === 0) {
            listContainer.innerHTML = '<div class="canvas-empty-text">No artifacts yet</div>';
            return;
        }
        
        listContainer.innerHTML = this.artifacts.map(artifact => `
            <div class="artifact-card" onclick="canvasManager.loadArtifact('${artifact.id}')">
                ${artifact.artifact_type === 'CHART' ? `
                    <div class="artifact-thumbnail" id="thumb-${artifact.id}"></div>
                ` : ''}
                <div class="artifact-card-title">${artifact.title}</div>
                <div class="artifact-card-meta">${artifact.created_at}</div>
                <span class="artifact-type-badge">${artifact.artifact_type}</span>
            </div>
        `).join('');
        
        // Render thumbnail charts after DOM update
        this.artifacts.forEach(artifact => {
            if (artifact.artifact_type === 'CHART') {
                this.renderThumbnailChart(artifact);
            }
        });
    }
    
    renderThumbnailChart(artifact) {
        const thumbId = `thumb-${artifact.id}`;
        const thumbContainer = document.getElementById(thumbId);
        if (!thumbContainer) return;
        
        ChartRenderer.loadHighcharts().then(() => {
            // Clone and simplify chart config for thumbnail
            const chartConfig = JSON.parse(JSON.stringify(artifact.content));
            
            // Override settings for thumbnail display
            chartConfig.chart = {
                ...chartConfig.chart,
                height: 150,
                width: null,
                backgroundColor: 'transparent',
                animation: false
            };
            chartConfig.title = { text: null };
            chartConfig.subtitle = { text: null };
            chartConfig.legend = { enabled: false };
            chartConfig.credits = { enabled: false };
            chartConfig.exporting = { enabled: false };
            
            // Simplify axes
            if (chartConfig.xAxis) {
                chartConfig.xAxis.title = { text: null };
                chartConfig.xAxis.labels = { style: { fontSize: '9px' } };
            }
            if (chartConfig.yAxis) {
                chartConfig.yAxis.title = { text: null };
                chartConfig.yAxis.labels = { style: { fontSize: '9px' } };
            }
            
            Highcharts.chart(thumbId, chartConfig);
        }).catch(err => {
            console.error('Failed to render thumbnail:', err);
            thumbContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">📊</div>';
        });
    }
    
    async loadArtifact(artifactId) {
        const contentContainer = document.getElementById('canvasContent');
        
        // Show loading state
        contentContainer.innerHTML = `
            <div class="canvas-loading">
                <div class="canvas-loading-spinner"></div>
            </div>
        `;
        
        try {
            // Find artifact in local cache
            const artifact = this.artifacts.find(a => a.id === artifactId);
            
            if (!artifact) {
                throw new Error('Artifact not found');
            }
            
            // Render based on artifact type
            this.renderArtifactByType(artifact);
            
            // Switch to expanded mode if in collapsed
            if (this.currentMode === 'collapsed') {
                this.setMode('expanded');
            }
            
        } catch (error) {
            console.error('Failed to load artifact:', error);
            contentContainer.innerHTML = `
                <div class="canvas-empty">
                    <div class="canvas-empty-icon">⚠️</div>
                    <div class="canvas-empty-text">Failed to load artifact</div>
                </div>
            `;
        }
    }
    
    renderArtifactByType(artifact) {
        switch(artifact.artifact_type.toUpperCase()) {
            case 'CHART':
                if (typeof chartRenderer !== 'undefined') {
                    chartRenderer.render(artifact);
                } else {
                    console.error('ChartRenderer not loaded');
                }
                break;
            
            case 'REPORT':
                // TODO: Implement ReportRenderer
                this.renderPlaceholder(artifact, 'Report rendering coming soon');
                break;
            
            case 'TABLE':
                this.renderTable(artifact);
                break;
            
            case 'DOCUMENT':
                // TODO: Implement DocumentRenderer
                this.renderPlaceholder(artifact, 'Document rendering coming soon');
                break;
            
            default:
                this.renderPlaceholder(artifact, `Renderer for ${artifact.artifact_type} not implemented`);
        }
    }
    
    renderTable(artifact) {
        const contentContainer = document.getElementById('canvasContent');
        const sidebar = document.getElementById('canvasSidebar');
        
        contentContainer.style.display = 'block';
        sidebar.style.display = 'none';
        this.currentArtifact = artifact;
        
        const { columns = [], rows = [], total_rows = 0 } = artifact.content;
        
        // Build table HTML (sanitize title/description and omit action buttons
        // to avoid duplicate UI when other renderers provide controls).
        const safeTitle = sanitizeText(artifact.title) || 'Data Table';
        const safeDesc = sanitizeText(artifact.description) || `${total_rows} rows × ${columns.length} columns`;

        // Build table header cells safely (columns content assumed trusted strings, but still escape)
        const headerCells = columns.map(col => `
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #2c3e50; position: sticky; top: 0; background-color: #34495e;">
                ${sanitizeText(col)}
            </th>
        `).join('');

        const bodyRows = rows.map((row, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                ${row.map(cell => `
                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #2c3e50;">
                        ${cell !== null && cell !== undefined ? sanitizeText(cell) : ''}
                    </td>
                `).join('')}
            </tr>
        `).join('');

        const tableHTML = `
            <div class="artifact-container">
                <div class="artifact-header">
                    <div class="artifact-title-main">${safeTitle}</div>
                    <div class="artifact-meta-row">
                        <div class="artifact-meta-item">
                            <span>📋</span>
                            <span>${safeDesc}</span>
                        </div>
                    </div>
                    <!-- Intentionally omitted artifact-actions to avoid duplicate buttons -->
                </div>
                <div style="overflow-x: auto; max-height: calc(100vh - 250px);">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background-color: #34495e; color: white;">
                                ${headerCells}
                            </tr>
                        </thead>
                        <tbody>
                            ${bodyRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        contentContainer.innerHTML = tableHTML;
    }
    
    renderPlaceholder(artifact, message) {
        const contentContainer = document.getElementById('canvasContent');
        const safeTitle = sanitizeText(artifact.title) || '';
        const safeType = sanitizeText(artifact.artifact_type) || '';
        const safeCreated = (() => {
            try {
                return new Date(artifact.created_at).toLocaleDateString();
            } catch (e) {
                return sanitizeText(artifact.created_at);
            }
        })();

        contentContainer.innerHTML = `
            <div class="artifact-container">
                <div class="artifact-header">
                    <div class="artifact-title-main">${safeTitle}</div>
                    <div class="artifact-meta-row">
                        <div class="artifact-meta-item">
                            <span>📅</span>
                            <span>Created: ${safeCreated}</span>
                        </div>
                        <div class="artifact-meta-item">
                            <span>📦</span>
                            <span>Type: ${safeType}</span>
                        </div>
                    </div>
                </div>
                <div class="artifact-body">
                    <p>${sanitizeText(message)}</p>
                </div>
            </div>
        `;
    }
    
    createArtifact(type, title, content, autoLoad = true) {
        // This will be called when agent creates an artifact from chat
        const artifact = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // More unique ID
            artifact_type: type,
            title: title,
            content: content,
            created_at: new Date().toISOString()
        };
        
        this.artifacts.unshift(artifact);
        this.renderArtifactList();
        
        // Auto-open canvas when first artifact is created
        if (this.currentMode === 'hidden') {
            this.setMode('collapsed');
        }
        
        // Only auto-load if requested (for single artifacts, not batch loading from history)
        if (autoLoad) {
            this.loadArtifact(artifact.id);
        }
        
        return artifact;
        return artifact;
    }
    
    // Helper method for testing - create sample chart
    createSampleChart() {
        const sampleChart = {
            type: 'radar',
            chart_title: 'Capability Maturity Assessment',
            subtitle: 'Current vs Target State',
            categories: ['Digital Twin', 'Process Mining', 'AI Orchestration', 'Analytics', 'Data Quality'],
            max_value: 5,
            series: [
                {
                    name: 'Current State',
                    data: [2, 3, 1, 4, 3],
                    pointPlacement: 'on',
                    color: '#ff6b6b'
                },
                {
                    name: 'Target State',
                    data: [5, 5, 4, 5, 5],
                    pointPlacement: 'on',
                    color: '#667eea'
                }
            ],
            description: 'This spider chart shows the current maturity level versus target state across five key transformation capabilities.'
        };
        
        return this.createArtifact('CHART', 'Capability Maturity Assessment', sampleChart);
    }
}

// Initialize canvas manager when DOM is loaded
let canvasManager;
document.addEventListener('DOMContentLoaded', () => {
    canvasManager = new CanvasManager();
});
