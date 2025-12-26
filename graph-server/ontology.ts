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
        description: 'SectorObjective -> Policy -> Admin -> SectorStakeholders (Business|GovEntity|Citizen) -> Txn -> Perf -> Objective',
        getQueryPattern: () => `
            MATCH (root:SectorObjective)
            WHERE ($year = 0 OR coalesce(root.year, root.Year) = $year)
              AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
            OPTIONAL MATCH p1 = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
            OPTIONAL MATCH p2 = (pol)-[:REFERS_TO]->(rec:SectorAdminRecord)
            OPTIONAL MATCH p3 = (rec)-[:APPLIED_ON]->(stakeholder)
            WHERE stakeholder:SectorBusiness OR stakeholder:SectorGovEntity OR stakeholder:SectorCitizen
            OPTIONAL MATCH p4 = (stakeholder)-[:TRIGGERS_EVENT]->(txn:SectorDataTransaction)
            OPTIONAL MATCH p5 = (txn)-[:MEASURED_BY]->(perf:SectorPerformance)
            OPTIONAL MATCH p6 = (perf)-[:AGGREGATES_TO]->(root)
            OPTIONAL MATCH p7 = (pol)-[:GOVERNED_BY]->(root)
            OPTIONAL MATCH p8 = (root)-[:CASCADED_VIA]->(perf2:SectorPerformance)
            UNWIND [p1,p2,p3,p4,p5,p6,p7,p8] AS path
            WITH root, path
        `
    },
    'strategy_to_tactics_priority': {
        id: 'strategy_to_tactics_priority',
        description: 'Objective -> Policy -> Capability -> OperationalLayer(OrgUnit|Process|ITSystem) -> Project -> Adoption',
        getQueryPattern: () => `
            MATCH (root:SectorObjective)
            WHERE ($year = 0 OR coalesce(root.year, root.Year) = $year)
              AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
            OPTIONAL MATCH p1 = (root)-[:REALIZED_VIA]->(pol:SectorPolicyTool)
            OPTIONAL MATCH p2a = (pol)-[:SETS_PRIORITIES]->(cap:EntityCapability)
            OPTIONAL MATCH p2b = (root)-[:REALIZED_VIA]->(pol)<-[:EXECUTES]-(cap)
            OPTIONAL MATCH p3 = (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(ops)
            WHERE ops:EntityOrgUnit OR ops:EntityProcess OR ops:EntityITSystem
            OPTIONAL MATCH p4 = (ops)-[:GAPS_SCOPE]->(proj:EntityProject)
            OPTIONAL MATCH p5 = (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
            UNWIND [p1,p2a,p2b,p3,p4,p5] AS path
            WITH root, path
        `
    },
    'strategy_to_tactics_targets': {
        id: 'strategy_to_tactics_targets',
        description: 'Objective -> Perf -> Capability -> OperationalLayer(OrgUnit|Process|ITSystem) -> Project -> Adoption',
        getQueryPattern: () => `
            MATCH (root:SectorObjective)
            WHERE ($year = 0 OR coalesce(root.year, root.Year) = $year)
              AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
            OPTIONAL MATCH p1a = (root)-[:CASCADED_VIA]->(perf:SectorPerformance)
            OPTIONAL MATCH p1b = (perf)-[:AGGREGATES_TO]->(root)
            OPTIONAL MATCH p2 = (perf)-[:SETS_TARGETS]->(cap:EntityCapability)
            OPTIONAL MATCH p3 = (cap)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(ops)
            WHERE ops:EntityOrgUnit OR ops:EntityProcess OR ops:EntityITSystem
            OPTIONAL MATCH p4 = (ops)-[:GAPS_SCOPE]->(proj:EntityProject)
            OPTIONAL MATCH p5 = (proj)-[:ADOPTION_RISKS]->(adopt:EntityChangeAdoption)
            UNWIND [p1a,p1b,p2,p3,p4,p5] AS path
            WITH root, path
        `
    },
    'tactical_to_strategy': {
        id: 'tactical_to_strategy',
        description: 'Adoption -> Project -> OperationalLayer(OrgUnit|Process|ITSystem) -> Capability -> Strategy',
        getQueryPattern: () => `
            MATCH (root:EntityProject)
            WHERE ($year = 0 OR coalesce(root.year, root.Year) = $year)
              AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
            OPTIONAL MATCH p0 = (adopt:EntityChangeAdoption)-[:INCREASE_ADOPTION]->(root)
            OPTIONAL MATCH p1 = (ops)-[:GAPS_SCOPE]->(root)
            WHERE ops:EntityOrgUnit OR ops:EntityProcess OR ops:EntityITSystem
            OPTIONAL MATCH p2 = (cap:EntityCapability)-[:ROLE_GAPS|KNOWLEDGE_GAPS|AUTOMATION_GAPS]->(ops)
            OPTIONAL MATCH p3a = (cap)-[:EXECUTES]->(pol:SectorPolicyTool)-[:GOVERNED_BY]->(objA:SectorObjective)
            OPTIONAL MATCH p3b = (cap)-[:REPORTS]->(perf:SectorPerformance)-[:AGGREGATES_TO]->(objB:SectorObjective)
            UNWIND [p0,p1,p2,p3a,p3b] AS path
            WITH root, path
        `
    },
    'risk_build_mode': {
        id: 'risk_build_mode',
        description: 'Capability -> Risk -> Policy',
        getQueryPattern: () => `
            MATCH (root:EntityRisk)
            WHERE ($year = 0 OR coalesce(root.year, root.Year) = $year)
              AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
            OPTIONAL MATCH p1 = (root)<-[:MONITORED_BY]-(cap:EntityCapability)
            OPTIONAL MATCH p2 = (root)-[:INFORMS]->(pol:SectorPolicyTool)
            UNWIND [p1,p2] AS path
            WITH root, path
        `
    },
    'risk_operate_mode': {
        id: 'risk_operate_mode',
        description: 'Capability -> Risk -> Performance',
        getQueryPattern: () => `
            MATCH (root:EntityRisk)
            WHERE ($year = 0 OR coalesce(root.year, root.Year) = $year)
              AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
            OPTIONAL MATCH p1 = (root)<-[:MONITORED_BY]-(cap:EntityCapability)
            OPTIONAL MATCH p2 = (root)-[:INFORMS]->(perf:SectorPerformance)
            UNWIND [p1, p2] AS path
            WITH root, path
        `
    },
    'internal_efficiency': {
        id: 'internal_efficiency',
        description: 'Culture -> Org -> Process -> IT -> Vendor',
        getQueryPattern: () => `
            MATCH (root:EntityProcess)
            WHERE ($year = 0 OR coalesce(root.year, root.Year) = $year)
              AND ($id IS NULL OR root.id = $id OR elementId(root) = $id)
            OPTIONAL MATCH p0 = (root)<-[:APPLY]-(org:EntityOrgUnit)<-[:MONITORS_FOR]-(cult:EntityCultureHealth)
            OPTIONAL MATCH p1 = (root)-[:AUTOMATION]->(it:EntityITSystem)
            OPTIONAL MATCH p2 = (it)-[:DEPENDS_ON]->(vendor:EntityVendor)
            UNWIND [p0,p1,p2] AS path
            WITH root, path
        `
    }
};

