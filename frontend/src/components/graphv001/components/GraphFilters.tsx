import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";

const NODE_COLORS: Record<string, string> = {
  'SectorObjective': '#A855F7',
  'SectorPolicyTool': '#F59E0B',
  'SectorAdminRecord': '#10B981',
  'SectorDataTransaction': '#EC4899',
  'SectorCitizen': '#3B82F6',
  'SectorBusiness': '#EF4444',
  'SectorGovEntity': '#14B8A6',
  'SectorPerformance': '#00F0FF',
  'EntityCapability': '#F97316',
  'EntityRisk': '#8B5CF6',
  'EntityProject': '#06B6D4',
  'EntityChangeAdoption': '#84CC16',
  'EntityITSystem': '#F43F5E',
  'EntityOrgUnit': '#6366F1',
  'EntityProcess': '#FACC15',
  'EntityVendor': '#22D3EE',
  'EntityCultureHealth': '#C084FC',
};

interface GraphFiltersProps {
  schema: {
    labels: string[];
    relationshipTypes: string[];
  };
  selectedLabels: string[];
  selectedRelationships: string[];
  limit: number;
  onLabelsChange: (labels: string[]) => void;
  onRelationshipsChange: (relationships: string[]) => void;
  onLimitChange: (limit: number) => void;
  onApply: () => void;
  isDark: boolean;
}

export function GraphFilters({
  schema,
  selectedLabels,
  selectedRelationships,
  limit,
  onLabelsChange,
  onRelationshipsChange,
  onLimitChange,
  onApply,
  isDark
}: GraphFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // LOCAL state for pending changes - only applied on "Apply" click
  const [pendingLabels, setPendingLabels] = useState<string[]>(selectedLabels);
  const [pendingRelationships, setPendingRelationships] = useState<string[]>(selectedRelationships);
  const [pendingLimit, setPendingLimit] = useState<string>(limit?.toString() || '200');

  // Sync local state when parent state changes (e.g., on initial load or external reset)
  useEffect(() => {
    setPendingLabels(selectedLabels);
  }, [selectedLabels]);

  useEffect(() => {
    setPendingRelationships(selectedRelationships);
  }, [selectedRelationships]);

  useEffect(() => {
    setPendingLimit(limit?.toString() || '200');
  }, [limit]);

  const toggleLabel = (label: string) => {
    if (pendingLabels.includes(label)) {
      setPendingLabels(pendingLabels.filter(l => l !== label));
    } else {
      setPendingLabels([...pendingLabels, label]);
    }
  };

  const toggleRelationship = (rel: string) => {
    if (pendingRelationships.includes(rel)) {
      setPendingRelationships(pendingRelationships.filter(r => r !== rel));
    } else {
      setPendingRelationships([...pendingRelationships, rel]);
    }
  };

  const clearAllPending = () => {
    setPendingLabels([]);
    setPendingRelationships([]);
  };

  const handleLimitChange = (value: string) => {
    setPendingLimit(value);
  };

  const selectAllLabels = () => {
    setPendingLabels(schema.labels);
  };

  const selectAllRelationships = () => {
    setPendingRelationships(schema.relationshipTypes);
  };

  // APPLY: Push pending state to parent and trigger refresh
  const handleApply = () => {
    onLabelsChange(pendingLabels);
    onRelationshipsChange(pendingRelationships);
    const limitNum = parseInt(pendingLimit);
    if (!isNaN(limitNum) && limitNum > 0) {
      onLimitChange(limitNum);
    }
    onApply();
    setIsOpen(false);
  };

  // CANCEL: Reset pending state to current parent state
  const handleCancel = () => {
    setPendingLabels(selectedLabels);
    setPendingRelationships(selectedRelationships);
    setPendingLimit(limit?.toString() || '200');
    setIsOpen(false);
  };

  // Styles
  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    border: `1px solid var(--component-text-accent)`,
    borderRadius: '0.375rem',
    backgroundColor: 'var(--component-panel-bg)',
    color: 'var(--component-text-accent)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const panelStyle: React.CSSProperties = {
    marginTop: '0.5rem',
    padding: '1rem',
    border: `1px solid var(--component-panel-border)`,
    borderRadius: '0.5rem',
    maxHeight: '500px',
    overflowY: 'auto',
    width: '320px',
    backgroundColor: 'var(--component-panel-bg)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '1rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--component-text-primary)',
  };

  const smallButtonStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    border: 'none',
    background: 'transparent',
    color: 'var(--component-text-muted)',
    cursor: 'pointer',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '0.25rem',
  };

  const listContainerStyle: React.CSSProperties = {
    maxHeight: '160px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  };

  // Show count of APPLIED filters (not pending)
  const filterCount = selectedLabels.length + selectedRelationships.length;

  // Check if there are pending changes
  const hasPendingChanges = 
    JSON.stringify(pendingLabels) !== JSON.stringify(selectedLabels) ||
    JSON.stringify(pendingRelationships) !== JSON.stringify(selectedRelationships) ||
    pendingLimit !== limit?.toString();

  return (
    <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyle}
        data-testid="button-toggle-filters"
      >
        <Filter style={{ width: '1rem', height: '1rem' }} />
        Filters {filterCount > 0 && <span>({filterCount})</span>}
      </button>

      {isOpen && (
        <div style={panelStyle}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--component-text-accent)', margin: 0 }}>Graph Filters</h3>
            <button
              onClick={handleCancel}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '0.25rem',
                color: 'var(--component-text-muted)'
              }}
              data-testid="button-close-filters"
            >
              <X style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>

          {/* Pending changes indicator */}
          {hasPendingChanges && (
            <div style={{ 
              marginBottom: '0.75rem', 
              padding: '0.5rem', 
              backgroundColor: 'rgba(255, 215, 0, 0.1)', 
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              color: 'var(--component-text-accent)'
            }}>
              ⚠ Changes not applied yet. Click "Apply Filters" to apply.
            </div>
          )}

          {/* Limit Filter Section */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Result Limit</label>
            <input
              type="number"
              placeholder="Max nodes (e.g., 200)"
              value={pendingLimit}
              onChange={(e) => handleLimitChange(e.target.value)}
              min="1"
              max="5000"
              style={{ 
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.25rem',
                border: `1px solid var(--component-panel-border)`,
                fontSize: '0.875rem',
                backgroundColor: 'var(--component-bg-primary)',
                color: 'var(--component-text-primary)',
              }}
              data-testid="input-limit-filter"
            />
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--component-text-muted)' }}>
              Current: {limit} | Pending: {pendingLimit}
            </p>
          </div>

          {/* Node Labels Section */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Node Labels ({pendingLabels.length}/{schema.labels.length})
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button onClick={selectAllLabels} style={smallButtonStyle} data-testid="button-select-all-labels">
                  All
                </button>
                <button onClick={() => setPendingLabels([])} style={smallButtonStyle} data-testid="button-clear-labels">
                  None
                </button>
              </div>
            </div>
            <div style={listContainerStyle}>
              {schema.labels.map(label => (
                <label key={label} style={checkboxLabelStyle} data-testid={`label-option-${label}`}>
                  <input
                    type="checkbox"
                    checked={pendingLabels.includes(label)}
                    onChange={() => toggleLabel(label)}
                    data-testid={`checkbox-label-${label}`}
                  />
                  <div style={{ width: '12px', height: '12px', flexShrink: 0, backgroundColor: NODE_COLORS[label] || '#9CA3AF' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--component-text-primary)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Relationship Types Section */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Relationships ({pendingRelationships.length}/{schema.relationshipTypes.length})
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button onClick={selectAllRelationships} style={smallButtonStyle} data-testid="button-select-all-relationships">
                  All
                </button>
                <button onClick={() => setPendingRelationships([])} style={smallButtonStyle} data-testid="button-clear-relationships">
                  None
                </button>
              </div>
            </div>
            <div style={listContainerStyle}>
              {schema.relationshipTypes.map(rel => (
                <label key={rel} style={checkboxLabelStyle} data-testid={`relationship-option-${rel}`}>
                  <input
                    type="checkbox"
                    checked={pendingRelationships.includes(rel)}
                    onChange={() => toggleRelationship(rel)}
                    data-testid={`checkbox-relationship-${rel}`}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--component-text-primary)' }}>{rel}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleApply}
              style={{ 
                flex: 1,
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: 'var(--component-text-accent)',
                color: 'var(--component-text-on-accent)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="button-apply-filters"
            >
              Apply Filters
            </button>
            <button
              onClick={clearAllPending}
              style={{ 
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: `1px solid var(--component-panel-border)`,
                backgroundColor: 'transparent',
                color: 'var(--component-text-primary)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              data-testid="button-clear-all-filters"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
