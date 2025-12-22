export interface ChainDefinition {
    id: string;
    description: string;
    // Returns the MATCH clause (defining 'path')
    getQueryPattern: () => string;
}

export class GraphOntology {
    static getChain(key: string): ChainDefinition | undefined {
        return CHAINS[key];
    }

    static getAggregateQuery(): string {
        // "Capabilities is the bridge" pattern
        // High Level (Strategy/Performance) -> Capability -> Low Level (Project/Risk/Ops)
        // We use shortestPath or bounded variable length to find these bridges
        return `
            MATCH path = (high:SectorObjective|SectorPerformance)
            -[:REALIZED_VIA|CASCADED_VIA|SETS_TARGETS|SETS_PRIORITIES*1..2]-> (cap:EntityCapability)
            -[:MONITORED_BY|ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS|GAPS_SCOPE*1..2]-> (low:EntityProject|EntityRisk|EntityOrgUnit|EntityProcess|EntityITSystem)
            WHERE ($year = 0 OR cap.year = $year)
        `;
    }
}

const CHAINS: Record<string, ChainDefinition> = {
    'sector_ops': {
        id: 'sector_ops',
        description: 'SectorObjective -> Policy -> Admin -> Stakeholders -> Txn -> Perf -> Objective',
        getQueryPattern: () => `
            MATCH path = (obj:SectorObjective)
            -[:REALIZED_VIA]-> (tool:SectorPolicyTool)
            -[:REFERS_TO]-> (record:SectorAdminRecord)
            -[:APPLIED_ON]-> (stakeholder)
            -[:TRIGGERS_EVENT]-> (txn:SectorDataTransaction)
            -[:MEASURED_BY]-> (perf:SectorPerformance)
            -[:AGGREGATES_TO]-> (obj)
            WHERE (stakeholder:SectorBusiness OR stakeholder:SectorGovEntity OR stakeholder:SectorCitizen)
            AND ($id IS NULL OR obj.id = $id OR elementId(obj) = $id)
            AND ($year = 0 OR (obj.year = $year AND tool.year = $year))
        `
    },
    'strategy_to_tactics_priority': {
        id: 'strategy_to_tactics_priority',
        description: 'Objective -> Policy -> Capability -> Gaps -> Project -> Adoption',
        getQueryPattern: () => `
            MATCH path = (obj:SectorObjective)
            -[:REALIZED_VIA]-> (tool:SectorPolicyTool)
            -[:SETS_PRIORITIES]-> (cap:EntityCapability)
            -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> (gap_layer)
            -[:GAPS_SCOPE]-> (proj:EntityProject)
            -[:ADOPTION_RISKS]-> (adopt:EntityChangeAdoption)
            WHERE (gap_layer:EntityOrgUnit OR gap_layer:EntityProcess OR gap_layer:EntityITSystem)
            AND ($id IS NULL OR obj.id = $id OR elementId(obj) = $id)
            AND ($year = 0 OR (obj.year = $year AND tool.year = $year))
        `
    },
    'strategy_to_tactics_targets': {
        id: 'strategy_to_tactics_targets',
        description: 'Objective -> Perf -> Capability -> Gaps -> Project -> Adoption',
        getQueryPattern: () => `
            MATCH path = (obj:SectorObjective)
            -[:CASCADED_VIA]-> (perf:SectorPerformance)
            -[:SETS_TARGETS]-> (cap:EntityCapability)
            -[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]-> (gap_layer)
            -[:GAPS_SCOPE]-> (proj:EntityProject)
            -[:ADOPTION_RISKS]-> (adopt:EntityChangeAdoption)
            WHERE (gap_layer:EntityOrgUnit OR gap_layer:EntityProcess OR gap_layer:EntityITSystem)
            AND ($id IS NULL OR obj.id = $id OR elementId(obj) = $id)
            AND ($year = 0 OR (obj.year = $year AND perf.year = $year))
        `
    },
    'tactical_to_strategy': {
        id: 'tactical_to_strategy',
        description: 'Adoption -> Project -> Ops -> Capability -> Strategy',
        getQueryPattern: () => `
            MATCH path = (adopt:EntityChangeAdoption)
            -[:INCREASE_ADOPTION]-> (proj:EntityProject)
            -[:CLOSE_GAPS]-> (ops_layer)
            -[:OPERATES]-> (cap:EntityCapability)
            -[:REPORTS|EXECUTES]-> (strategic_layer)
            -[:AGGREGATES_TO|GOVERNED_BY]-> (obj:SectorObjective)
            WHERE (ops_layer:EntityOrgUnit OR ops_layer:EntityProcess OR ops_layer:EntityITSystem)
            AND ($id IS NULL OR adopt.id = $id OR elementId(adopt) = $id)
            AND ($year = 0 OR (adopt.year = $year AND proj.year = $year))
        `
    },
    'risk_build_mode': {
        id: 'risk_build_mode',
        description: 'Capability -> Risk -> Policy',
        getQueryPattern: () => `
            MATCH path = (cap:EntityCapability)
            -[:MONITORED_BY]-> (risk:EntityRisk)
            -[:INFORMS]-> (tool:SectorPolicyTool)
            WHERE ($id IS NULL OR cap.id = $id OR elementId(cap) = $id)
            AND ($year = 0 OR (cap.year = $year AND risk.year = $year))
        `
    },
    'risk_operate_mode': {
        id: 'risk_operate_mode',
        description: 'Capability -> Risk -> Performance',
        getQueryPattern: () => `
            MATCH path = (cap:EntityCapability)
            -[:MONITORED_BY]-> (risk:EntityRisk)
            -[:INFORMS]-> (perf:SectorPerformance)
            WHERE ($id IS NULL OR cap.id = $id OR elementId(cap) = $id)
            AND ($year = 0 OR (cap.year = $year AND risk.year = $year))
        `
    },
    'internal_efficiency': {
        id: 'internal_efficiency',
        description: 'Culture -> Org -> Process -> IT -> Vendor',
        getQueryPattern: () => `
            MATCH path = (cult:EntityCultureHealth)
            -[:MONITORS_FOR]-> (org:EntityOrgUnit)
            -[:APPLY]-> (proc:EntityProcess)
            -[:AUTOMATION]-> (sys:EntityITSystem)
            -[:DEPENDS_ON]-> (vend:EntityVendor)
            WHERE ($id IS NULL OR cult.id = $id OR elementId(cult) = $id)
            AND ($year = 0 OR (cult.year = $year AND org.year = $year))
        `
    }
};
