// --- TOP-LEVEL DATA STRUCTURE ---
export interface DashboardData {
    dimensions: Dimension[];
    insight1: Insight1Data;
    insight2: Insight2Data;
    insight3: Insight3Data;
    outcomes: OutcomesData;
}

// --- GRAPH DATA ---
export interface GraphData {
    nodes: Array<{
        id: string;
        group: string;
        label: string;
        val: number;
        color?: string;
        health?: number;
        x?: number;
        y?: number;
        z?: number;
        links?: any[];
    }>;
    links: Array<{
        source: string | any;
        target: string | any;
        value: number;
        type: string;
    }>;
}

// --- ZONE 1 & 3: TRANSFORMATION HEALTH & INTERNAL OUTPUTS ---
export interface Dimension {
    id: string;
    title: string;
    label: string;
    
    // Formatted strings for main display
    kpi: string; // Formatted quarterlyActual
    lastQuarterKpi: string; // Formatted lastQuarterActual
    nextQuarterKpi: string; // Formatted nextQuarterTarget

    delta: number; // quarterlyActual - planned
    trendDirection: 'up' | 'down' | 'steady';

    // Values for the 4 bars
    baseline: number;
    quarterlyTarget: number;
    quarterlyActual: number;
    finalTarget: number;

    // Raw values for spider chart (normalized to 0-100 scale)
    planned: number;
    actual: number; // Normalized using finalTarget as 100%
    
    // Health and trend indicators
    healthState?: string; // 'Healthy', 'At Risk', 'Distressed'
    healthScore?: number;
    trend?: string; // 'Growth', 'Decline', 'Steady'
    year?: number;
}

// --- ZONE 2: STRATEGIC INSIGHTS ---
export interface Insight1Data {
    title: string;
    subtitle: string;
    initiatives: {
        name: string;
        budget: number; // Used for bubble radius
        risk: number; // x-axis
        alignment: number; // y-axis
    }[];
}

export interface Insight2Data {
    title: string;
    subtitle: string;
    labels: string[]; // e.g., ['Last Q', 'Current Q', 'Next Q']
    projectVelocity: number[];
    operationalEfficiency: number[];
}

export interface Insight3Data {
    title: string;
    subtitle: string;
    labels: string[]; // e.g., ['Last Q', 'Current Q', 'Next Q']
    operationalEfficiency: number[];
    citizenQoL: number[];
    jobsCreated: number[];
}

// --- ZONE 4: SECTOR-LEVEL OUTCOMES ---
export interface OutcomesData {
    outcome1: Outcome1Data;
    outcome2: Outcome2Data;
    outcome3: Outcome3Data;
    outcome4: Outcome4Data;
}

export interface Outcome1Data {
    title: string;
    macro: {
        labels: string[];
        fdi: { actual: number[], target: number[], baseline: number[] };
        trade: { actual: number[], target: number[], baseline: number[] };
        jobs: { actual: number[], target: number[], baseline: number[] };
    };
}

export interface Outcome2Data {
    title: string;
    partnerships: {
        actual: number;
        target: number;
        baseline: number;
    };
}

export interface Outcome3Data {
    title: string;
    qol: {
        labels: string[];
        coverage: { actual: number[], target: number[], baseline: number[] };
        quality: { actual: number[], target: number[], baseline: number[] };
    };
}

export interface Outcome4Data {
    title: string;
    community: {
        actual: number;
        target: number;
        baseline: number;
    };
}

// --- FOR GEMINI ANALYSIS ---
export type InsightId = 'insight1' | 'insight2' | 'insight3' | 'outcome1' | 'outcome2' | 'outcome3' | 'outcome4';

export interface AnalysisData {
    title: string;
    content: string;
}