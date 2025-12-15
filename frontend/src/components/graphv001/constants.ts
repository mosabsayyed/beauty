import type { DashboardData } from './types';

// This initial data is largely a placeholder and will be overwritten
// by the mock API call on component mount. It's structured to prevent
// runtime errors before the first data fetch completes.
export const DASHBOARD_DATA: DashboardData = {
    dimensions: [],
    insight1: { title: '', subtitle: '', initiatives: [] },
    insight2: { title: '', subtitle: '', labels: [], projectVelocity: [], operationalEfficiency: [] },
    insight3: { title: '', subtitle: '', labels: [], operationalEfficiency: [], citizenQoL: [], jobsCreated: [] },
    outcomes: {
        outcome1: { title: '', macro: { labels: [], fdi: { actual: [], target: [], baseline: [] }, trade: { actual: [], target: [], baseline: [] }, jobs: { actual: [], target: [], baseline: [] } } },
        outcome2: { title: '', partnerships: { actual: 0, target: 0, baseline: 0 } },
        outcome3: { title: '', qol: { labels: [], coverage: { actual: [], target: [], baseline: [] }, quality: { actual: [], target: [], baseline: [] } } },
        outcome4: { title: '', community: { actual: 0, target: 0, baseline: 0 } }
    }
};