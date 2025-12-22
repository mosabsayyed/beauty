import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const data = [
  { subject: "Tech Stack SLA Compliance", A: 120, B: 110, fullMark: 150 },
  { subject: "Strategic Plan Alignment", A: 98, B: 130, fullMark: 150 },
  { subject: "Operational Efficiency Gains", A: 86, B: 130, fullMark: 150 },
  { subject: "Risk Mitigation Rate", A: 99, B: 100, fullMark: 150 },
  { subject: "Investment Portfolio Spending", A: 85, B: 90, fullMark: 150 },
  { subject: "Quarterly Investor Activities", A: 65, B: 85, fullMark: 150 },
  { subject: "Employee Engagement Score", A: 75, B: 95, fullMark: 150 },
  { subject: "Project Delivery Velocity", A: 100, B: 85, fullMark: 150 },
];

export function TransformationRadar() {
  return (
    <div style={{ width: '100%', height: '300px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          {/* @ts-ignore */}
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "Rajdhani" }}
          />
          {/* @ts-ignore */}
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Radar
            name="Actual"
            dataKey="A"
            stroke="#00F0FF"
            strokeWidth={2}
            fill="#00F0FF"
            fillOpacity={0.3}
          />
          <Radar
            name="Planned"
            dataKey="B"
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="#94a3b8"
            fillOpacity={0.1}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '0.75rem', height: '0.75rem', backgroundColor: 'rgba(0, 240, 255, 0.3)', border: '1px solid #00F0FF' }}></div>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Actual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '0.75rem', height: '0.75rem', backgroundColor: 'rgba(148, 163, 184, 0.1)', border: '1px dashed #94a3b8' }}></div>
          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Planned</span>
        </div>
      </div>
    </div>
  );
}
