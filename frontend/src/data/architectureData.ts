/**
 * Architecture Data Structure
 * Defines layers, components, completion status, and animation flow
 */

export interface ArchitectureComponent {
  id: string;
  name: string;
  category: string;
  isCompleted: boolean;
  description?: string;
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  displayName: string;
  components: ArchitectureComponent[];
  description?: string;
}

export interface AnimationNode {
  componentId: string;
  layerId: string;
  delay: number; // milliseconds from start of animation
}

// Animation flow sequence: Stakeholder → Channel → Workflow Agent → LLM → MCP → Knowledge Graph → back
export const ANIMATION_FLOW: AnimationNode[] = [
  { componentId: 'leadership-management', layerId: 'stakeholders', delay: 0 },
  { componentId: 'multilingual-channels', layerId: 'interface-layer', delay: 1000 },
  { componentId: 'workflow-agent', layerId: 'orchestrator-layer', delay: 2000 },
  { componentId: 'reasoning', layerId: 'llm-ecosystem', delay: 3000 },
  { componentId: 'mcp-router', layerId: 'cognitive-core', delay: 4000 },
  { componentId: 'knowledge-graph', layerId: 'cognitive-core', delay: 5000 },
  { componentId: 'leadership-management', layerId: 'stakeholders', delay: 6000 }, // Return path
];

// Total animation cycle time in milliseconds
export const ANIMATION_CYCLE_TIME = 6000;

/**
 * STAKEHOLDERS LAYER
 */
export const stakeholdersLayer: ArchitectureLayer = {
  id: 'stakeholders',
  name: 'stakeholders',
  displayName: 'Stakeholders',
  description: 'Government and external stakeholders',
  components: [
    {
      id: 'leadership-management',
      name: 'Leadership & Management',
      category: 'Government',
      isCompleted: true,
      description: 'Government leadership and management stakeholders',
    },
    {
      id: 'operational-teams',
      name: 'Operational Teams',
      category: 'Government',
      isCompleted: false,
      description: 'Operational support teams (in development)',
    },
    {
      id: 'support-services',
      name: 'Support Services',
      category: 'Government',
      isCompleted: false,
      description: 'Support services (planned)',
    },
    {
      id: 'citizens',
      name: 'Citizens',
      category: 'Public',
      isCompleted: false,
      description: 'Citizen stakeholders (planned)',
    },
    {
      id: 'businesses',
      name: 'Businesses',
      category: 'Public',
      isCompleted: false,
      description: 'Business stakeholders (planned)',
    },
  ],
};

/**
 * INTERFACE LAYER
 */
export const interfaceLayer: ArchitectureLayer = {
  id: 'interface-layer',
  name: 'interface-layer',
  displayName: 'Interface Layer',
  description: 'Channels and enterprise applications',
  components: [
    {
      id: 'multilingual-channels',
      name: 'Multilingual Support + Channels',
      category: 'Channels',
      isCompleted: true,
      description: 'Web and Desktop channels with multilingual support',
    },
    {
      id: 'genai-chat',
      name: 'GenAI Chat',
      category: 'Applications',
      isCompleted: true,
      description: 'Generative AI chat interface',
    },
    {
      id: 'enterprise-applications',
      name: 'Enterprise Applications',
      category: 'Applications',
      isCompleted: false,
      description: 'Enterprise application integrations (in development)',
    },
    {
      id: 'intelligent-insights',
      name: 'Intelligent Insights',
      category: 'Applications',
      isCompleted: false,
      description: 'Intelligent insights dashboard (planned)',
    },
    {
      id: 'mobile-app',
      name: 'Mobile App',
      category: 'Channels',
      isCompleted: false,
      description: 'Mobile application (planned)',
    },
  ],
};

/**
 * ORCHESTRATOR LAYER
 */
export const orchestratorLayer: ArchitectureLayer = {
  id: 'orchestrator-layer',
  name: 'orchestrator-layer',
  displayName: 'Orchestrator Layer',
  description: 'Workflow orchestration and agent coordination',
  components: [
    {
      id: 'workflow-agent',
      name: 'Workflow Agent',
      category: 'Orchestration',
      isCompleted: true,
      description: 'Central workflow orchestration agent',
    },
    {
      id: 'ops-monitor',
      name: 'Ops Monitor',
      category: 'Monitoring',
      isCompleted: false,
      description: 'Operations monitoring (in development)',
    },
    {
      id: 'integration-apis',
      name: 'Integration APIs',
      category: 'Orchestration',
      isCompleted: false,
      description: 'Integration APIs (planned)',
    },
    {
      id: 'agent-to-agent',
      name: 'Agent to Agent',
      category: 'Orchestration',
      isCompleted: false,
      description: 'Inter-agent communication (planned)',
    },
  ],
};

/**
 * LLM ECOSYSTEM LAYER
 */
export const llmEcosystemLayer: ArchitectureLayer = {
  id: 'llm-ecosystem',
  name: 'llm-ecosystem',
  displayName: 'LLM Ecosystem',
  description: 'Large Language Model components and plugins',
  components: [
    {
      id: 'reasoning',
      name: 'Reasoning Engine',
      category: 'LLM',
      isCompleted: true,
      description: 'Core reasoning and inference engine',
    },
    {
      id: 'embedders',
      name: 'Embedders',
      category: 'LLM',
      isCompleted: false,
      description: 'Text embedding models (planned)',
    },
    {
      id: 'agentic-expert',
      name: 'Agentic Expert',
      category: 'LLM',
      isCompleted: false,
      description: 'Expert agentic systems (in development)',
    },
    {
      id: 'feed-agents',
      name: 'Feed Agents',
      category: 'LLM',
      isCompleted: false,
      description: 'Feed processing agents (planned)',
    },
  ],
};

/**
 * COGNITIVE CORE LAYER
 */
export const cognitiveCoreLayer: ArchitectureLayer = {
  id: 'cognitive-core',
  name: 'cognitive-core',
  displayName: 'Cognitive Core',
  description: 'Knowledge graphs and reasoning core',
  components: [
    {
      id: 'mcp-router',
      name: 'MCP Router',
      category: 'Core',
      isCompleted: true,
      description: 'Model Context Protocol routing',
    },
    {
      id: 'knowledge-graph',
      name: 'Knowledge Graph',
      category: 'Core',
      isCompleted: true,
      description: 'Semantic knowledge graph database',
    },
    {
      id: 'ontology-model',
      name: 'Ontology Model',
      category: 'Core',
      isCompleted: false,
      description: 'Domain ontology models (in development)',
    },
  ],
};

/**
 * DATA LAYER
 */
export const dataLayer: ArchitectureLayer = {
  id: 'data-layer',
  name: 'data-layer',
  displayName: 'Data Layer',
  description: 'Data storage and intelligence systems',
  components: [
    {
      id: 'graph-database',
      name: 'Graph Database',
      category: 'Intelligence',
      isCompleted: true,
      description: 'Neo4j graph database for relationships',
    },
    {
      id: 'vector-embeddings',
      name: 'Vector Embeddings',
      category: 'Intelligence',
      isCompleted: true,
      description: 'Vector storage for embeddings',
    },
    {
      id: 'non-structured-data',
      name: 'Non-Structured Data',
      category: 'Legacy',
      isCompleted: false,
      description: 'Unstructured data storage (planned)',
    },
    {
      id: 'relational-sql',
      name: 'Relational SQL',
      category: 'Legacy',
      isCompleted: false,
      description: 'Legacy SQL databases (planned)',
    },
  ],
};

/**
 * OPERATIONS & AI GOVERNANCE (Cross-cutting concerns)
 */
export const governanceComponents: ArchitectureComponent[] = [
  {
    id: 'risk-analyst',
    name: 'Risk Analyst',
    category: 'Governance',
    isCompleted: true,
    description: 'Risk analysis and assessment',
  },
  {
    id: 'ndmo-classification',
    name: 'NDMO Classification',
    category: 'Governance',
    isCompleted: true,
    description: 'National Data Management Organization classification',
  },
  {
    id: 'nca',
    name: 'NCA',
    category: 'Governance',
    isCompleted: true,
    description: 'National Cybersecurity Authority compliance',
  },
  {
    id: 'cyber-security',
    name: 'Cyber Security',
    category: 'Governance',
    isCompleted: true,
    description: 'Security protocols and monitoring',
  },
  {
    id: 'sdaia',
    name: 'SDAIA',
    category: 'Governance',
    isCompleted: true,
    description: 'Saudi Data and Artificial Intelligence Authority',
  },
  {
    id: 'ai-ethics',
    name: 'AI Ethics',
    category: 'Governance',
    isCompleted: true,
    description: 'Ethical AI guidelines and monitoring',
  },
  {
    id: 'public-policy',
    name: 'Public Policy',
    category: 'Governance',
    isCompleted: true,
    description: 'Government policy compliance',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    category: 'Governance',
    isCompleted: true,
    description: 'Regulatory compliance management',
  },
];

/**
 * CLOUD INFRASTRUCTURE LAYER
 */
export const cloudInfrastructureLayer: ArchitectureLayer = {
  id: 'cloud-infrastructure',
  name: 'cloud-infrastructure',
  displayName: 'Government Cloud Infrastructure',
  description: 'Government cloud deployment infrastructure',
  components: [
    {
      id: 'center-of-government',
      name: 'Center of Government',
      category: 'Infrastructure',
      isCompleted: false,
      description: 'Central government infrastructure (planned)',
    },
    {
      id: 'digital-regulators',
      name: 'Digital Regulators',
      category: 'Infrastructure',
      isCompleted: false,
      description: 'Digital regulatory bodies (planned)',
    },
    {
      id: 'sister-providers',
      name: 'Sister Twins (Providers)',
      category: 'Infrastructure',
      isCompleted: false,
      description: 'Sister ministry providers (planned)',
    },
    {
      id: 'sister-consumers',
      name: 'Sister Twins (Consumers)',
      category: 'Infrastructure',
      isCompleted: false,
      description: 'Sister ministry consumers (planned)',
    },
  ],
};

/**
 * All Layers
 */
export const ALL_LAYERS: ArchitectureLayer[] = [
  stakeholdersLayer,
  interfaceLayer,
  orchestratorLayer,
  llmEcosystemLayer,
  cognitiveCoreLayer,
  dataLayer,
  cloudInfrastructureLayer,
];

/**
 * Release Information
 */
export const releaseInfo = {
  version: '1.0',
  status: 'Alpha',
  description: 'End-state architecture diagram showing completed and planned components',
  lastUpdated: new Date().toISOString(),
};
