/* =========================================
   JOSOOR V10 - PERSONA SWITCHING
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Persona configuration
    const personas = {
        'vice-minister': {
            name: 'Vice Minister',
            background: 'assets/scenario_vice_minister_v3.png',
            headline: 'Transformation Control Tower',
            subhead: 'See the chains under the green. Decisions, not dashboards.',
            payoff: 'See cross-entity blockage chains before they cascade.'
        },
        'pmo-director': {
            name: 'PMO Director',
            background: 'assets/scenario_pmo_director_v4.png',
            headline: 'Reclaim your time. Redirect your energy.',
            subhead: 'Fewer follow-ups. Faster briefings. Clearer decisions.',
            payoff: 'Reclaim follow-up time and redirect it to strategic work.'
        },
        'strategy-manager': {
            name: 'Strategy Manager',
            background: 'assets/scenario_strategy_manager_v2.png',
            headline: 'Detect drift before it becomes crisis.',
            subhead: 'Spot the signals hiding under green. Defend plan credibility.',
            payoff: 'Detect drift under green before it damages credibility.'
        },
        'stakeholder': {
            name: 'Stakeholder',
            background: 'assets/scenario_stakeholder_v2.png',
            headline: 'Know why. Know who. Know now.',
            subhead: 'Clarity on blockers, owners, and evidence. No guessing.',
            payoff: 'Know why blocked, who owns it, and what evidence supports it.'
        }
    };

    // DOM elements
    const heroBg = document.getElementById('hero-bg');
    const heroHeadline = document.getElementById('hero-headline');
    const heroSubhead = document.getElementById('hero-subhead');
    const heroPayoff = document.getElementById('hero-payoff');
    const personaBtns = document.querySelectorAll('.persona-btn');

    // Switch persona
    function switchPersona(personaKey) {
        const persona = personas[personaKey];
        if (!persona) return;

        // Update background
        if (heroBg) {
            heroBg.style.backgroundImage = `url('${persona.background}')`;
        }

        // Update text
        if (heroHeadline) heroHeadline.textContent = persona.headline;
        if (heroSubhead) heroSubhead.textContent = persona.subhead;
        if (heroPayoff) heroPayoff.textContent = persona.payoff;

        // Update active button
        personaBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.persona === personaKey);
        });
    }

    // Add click listeners
    personaBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchPersona(btn.dataset.persona);
        });
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
