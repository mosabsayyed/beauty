import { useState } from 'react';
import { chainsService, ChainResponse } from '../../services/chainsService';
import '../../styles/quick-chains-panel.css';

const CHAINS = [
  { key: 'sector_ops', label: 'SectorOps Loop' },
  { key: 'strategy_to_tactics_priority', label: 'Strategy -> Tactics (Priority)' },
  { key: 'risk_operate_mode', label: 'Risk Operate Mode' },
];

type QuickChainsPanelProps = {
  defaultYear?: number;
  onChainResult?: (result: ChainResponse) => void;
};

export function QuickChainsPanel({ defaultYear = 2025, onChainResult }: QuickChainsPanelProps) {
  const [nodeId, setNodeId] = useState('');
  const [year, setYear] = useState<number>(defaultYear);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ChainResponse | null>(null);

  const handleRun = async (chainKey: string) => {
    if (!nodeId.trim()) {
      setError('Please provide an ID to run the chain.');
      return;
    }
    setError(null);
    setLoadingKey(chainKey);
    try {
      const result = await chainsService.executeChain(chainKey, nodeId.trim(), year);
      setLastResult(result);
      if (onChainResult) onChainResult(result);
    } catch (e: any) {
      setError(e?.message || 'Failed to run chain');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="quick-chains-panel">
      <div className="quick-chains-header">Verified Chains</div>
      <div className="quick-chains-inputs">
        <label className="quick-chains-label">
          Node ID
          <input
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            placeholder="e.g. OBJ-123"
            className="quick-chains-input"
          />
        </label>
        <label className="quick-chains-label">
          Year
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || defaultYear)}
            className="quick-chains-input"
          />
        </label>
      </div>

      <div className="quick-chains-buttons">
        {CHAINS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleRun(key)}
            className="quick-chains-button"
            disabled={!!loadingKey}
          >
            {loadingKey === key ? 'Running...' : label}
          </button>
        ))}
      </div>

      {error && <div className="quick-chains-error">{error}</div>}

      {lastResult && (
        <div className="quick-chains-result">
          <div className="quick-chains-result-title">Last Result</div>
          <div className="quick-chains-meta">
            <span>Chain: {lastResult.chain_key}</span>
            <span>ID: {lastResult.id}</span>
            <span>Year: {lastResult.year}</span>
            <span>Count: {lastResult.count}</span>
          </div>
          <pre className="quick-chains-pre">{JSON.stringify(lastResult.results?.slice(0, 2) || [], null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
