import { DashboardData, Dimension } from '../types';

export const fetchInsightAnalysis = async (insightData: any): Promise<string> => {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return `
        <h4>Strategic Analysis</h4>
        <ul>
            <li><strong>Opportunity:</strong> Strong alignment in ${insightData.title || 'this area'} suggests potential for scaling.</li>
            <li><strong>Risk:</strong> Resource allocation may need optimization to sustain current velocity.</li>
            <li><strong>Recommendation:</strong> Focus on high-impact initiatives identified in Q3 planning.</li>
        </ul>
    `;
};

export const fetchExecutiveSummary = async (dimensions: Dimension[]): Promise<string> => {
    try {
        // Get current date for planning exercise context
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Build the dashboard data summary
        const dashboardSummary = dimensions.map(dim => {
            const isFuture = dim.year && dim.year > new Date().getFullYear();
            const status = isFuture ? '(PLANNED)' : '(ACTUAL)';
            return `- ${dim.title} ${status}: Actual ${dim.actual}%, Planned ${dim.planned}%, Delta ${dim.delta > 0 ? '+' : ''}${dim.delta}%${dim.healthState ? `, Health: ${dim.healthState}` : ''}`;
        }).join('\n');

        // Construct the prompt with planning exercise context
        const prompt = `You are analyzing a government agency transformation dashboard. Today's date is ${currentDate}.

**IMPORTANT CONTEXT:**
- Data points with dates BEYOND the current date (${currentDate}) represent PLANNING SCENARIOS, not actual performance.
- Treat future data as strategic planning exercises and aspirational targets.
- Only data up to the current date represents actual performance.

**Dashboard Data:**
${dashboardSummary}

**Task:**
Provide a concise executive summary (2-3 sentences) that:
1. Highlights overall transformation health based on ACTUAL performance (current and past data)
2. Identifies key strengths and areas requiring attention
3. If future/planned data is present, briefly mention it as "planned initiatives" or "strategic targets"

Keep the tone professional and actionable. Focus on insights, not just data repetition.`;

        // Call the chat API
        const response = await fetch('/api/v1/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include auth cookies
            body: JSON.stringify({
                query: prompt,
                persona: 'transformation_analyst'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract the answer from the LLM response
        let summary = '';
        
        if (data.llm_payload?.answer) {
            summary = data.llm_payload.answer;
        } else if (data.raw_response?.answer) {
            summary = data.raw_response.answer;
        } else if (typeof data === 'string') {
            summary = data;
        } else {
            summary = "Analysis completed. Please review the dashboard for detailed insights.";
        }

        return summary;

    } catch (error) {
        console.error('Error fetching executive summary:', error);
        return "Unable to generate summary at this time. Please try again.";
    }
};
