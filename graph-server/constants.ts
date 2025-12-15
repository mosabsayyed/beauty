export const DASHBOARD_DATA = {
    dimensions: [
        { id: 'strategicPlan', title: 'Strategic Plan Alignment', label: 'Progress vs Target', kpi: '-', lastQuarterKpi: '-', nextQuarterKpi: '-', delta: '-', trendDirection: 'up', baseline: '-', quarterlyActual: '-', quarterlyTarget: '-', finalTarget: '-', planned: '-', actual: '-' },
        { id: 'operations', title: 'Operational Efficiency Gains', label: 'Process Automation Rate', kpi: '-', lastQuarterKpi: '-', nextQuarterKpi: '-', delta: '-', trendDirection: 'up', baseline: '-', quarterlyActual: '-', quarterlyTarget: '-', finalTarget: '-', planned: '-', actual: '-' },
        { id: 'risksControl', title: 'Risk Mitigation Rate', label: 'Critical Risks Mitigated', kpi: '-', lastQuarterKpi: '-', nextQuarterKpi: '-', delta: '-', trendDirection: 'up', baseline: '-', quarterlyActual: '-', quarterlyTarget: '-', finalTarget: '-', planned: '-', actual: '-' },
        { id: 'investment', title: 'Investment Portfolio Spending', label: 'Adherence to procurement plans', kpi: '-', lastQuarterKpi: '-', nextQuarterKpi: '-', delta: '-', trendDirection: 'steady', baseline: '-', quarterlyActual: '-', quarterlyTarget: '-', finalTarget: '-', planned: '-', actual: '-' },
        { id: 'adoption', title: 'Quarterly Investor Activities', label: 'New investors vs Target', kpi: '-', lastQuarterKpi: '-', nextQuarterKpi: '-', delta: '-', trendDirection: 'down', baseline: '-', quarterlyActual: '-', quarterlyTarget: '-', finalTarget: '-', planned: '-', actual: '-' },
        { id: 'culture', title: 'Employee Engagement Score', label: 'Annual Survey Score', kpi: '-', lastQuarterKpi: '-', nextQuarterKpi: '-', delta: '-', trendDirection: 'up', baseline: '-', quarterlyActual: '-', quarterlyTarget: '-', finalTarget: '-', planned: '-', actual: '-' },
        { id: 'delivery', title: 'Project Delivery Velocity', label: 'Avg Story Points/Sprint', kpi: '-', lastQuarterKpi: '-', nextQuarterKpi: '-', delta: -5, trendDirection: 'up', baseline: '-', quarterlyActual: '-', quarterlyTarget: '-', finalTarget: '-', planned: '-', actual: '-' },
        { id: 'technology', title: 'Tech Stack SLA Compliance', label: 'Platform Uptime', kpi: '-', lastQuarterKpi: '-', nextQuarterKpi: '-', delta: 0.3, trendDirection: 'steady', baseline: '-', quarterlyActual: '-', quarterlyTarget: '-', finalTarget: '-', planned: '-', actual: '-' }
    ],
    insight1: { 
        title: 'Investment Portfolio Health',
        subtitle: 'Are we prioritizing our big needle movers? Portfolio distribution against strategic alignment and risk.',
        initiatives: [{ name: 'Cloud Migration', budget: '-', risk: '-', alignment: '-' }, { name: 'AI Platform', budget: '-', risk: '-', alignment: '-' }, { name: 'ERP Upgrade', budget: '-', risk: '-', alignment: '-' }, { name: 'Legacy Decom.', budget: '-', risk: '-', alignment: '-' }, { name: 'Data Lake', budget: '-', risk: '-', alignment: '-' }] 
    },
    insight2: { 
        title: 'Projects & Operations Integration',
        subtitle: 'How integrated are projects and operations quarter over quarter?',
        labels: ['Last Q', 'Current Q', 'Next Q'], 
        projectVelocity: ['-', '-', '-'],
        operationalEfficiency: ['-', '-', '-']
    },
    insight3: {
        title: 'Economic Impact Correlation',
        subtitle: 'The better we do, the better the economy: connecting internal efficiencies with external outcomes.',
        labels: ['Last Q', 'Current Q', 'Next Q'],
        operationalEfficiency: ['-', '-', '-'],
        citizenQoL: ['-', '-', '-'],
        jobsCreated: ['-', '-', '-']
    },
    outcomes: {
        outcome1: { 
            title: 'Macroeconomic Impact', 
            macro: { 
                labels: ['2023', '2024', '2025'], 
                fdi: { actual: ['-', '-', '-'], target: ['-', '-', '-'], baseline: ['-', '-', '-'] },
                trade: { actual: ['-', '-', '-'], target: ['-', '-', '-'], baseline: ['-', '-', '-'] }, 
                jobs: { actual: ['-', '-', '-'], target: ['-', '-', '-'], baseline: ['-', '-', '-'] }
            } 
        },
        outcome2: { 
            title: 'Private Sector Partnerships', 
            partnerships: { actual: 60, target: 65, baseline: 45 }
        },
        outcome3: { 
            title: 'Citizen Quality of Life', 
            qol: { 
                labels: ['Water', 'Energy', 'Transport'], 
                coverage: { actual: ['-', '-', '-'], target: ['-', '-', '-'], baseline: ['-', '-', '-'] }, 
                quality: { actual: ['-', '-', '-'], target: ['-', '-', '-'], baseline: ['-', '-', '-'] }
            } 
        },
        outcome4: { 
            title: 'Community Engagement', 
            community: { actual: 45, target: 50, baseline: 30 }
        }
    }
};
