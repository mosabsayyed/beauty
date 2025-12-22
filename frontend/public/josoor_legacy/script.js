document.addEventListener('DOMContentLoaded', () => {
    
    // CONFIGURATION: Persona Data (V9 - Fixed Mapping)
    // User Feedback: "Lady appearing instead of Vice Minister". 
    // Fix: Swap Vice Minister and Stakeholder/Director images to ensure alignment.
    // Assumption: PMO Director (v4) is Senior Male. Vice Minister (v3) might be Female? 
    // Let's swap: Vice Minister -> pmo_director_v4.png (Safe bet for "Minister")
    // Director -> strategy_manager_v2.png
    // Strategy -> stakeholder_v2.png (The Lady?)
    // Stakeholder -> vice_minister_v3.png (The other one)
    
    const personas = [
        {
            id: 'vice-minister',
            label: 'Vice Minister',
            headline: 'Unblock Giga-Projects at the portfolio level.',
            outcome: 'Decide faster. Restore investor confidence. Clear cross-entity stalling.',
            // SWAPPED: Using PMO Director image for Vice Minister (likely the senior male)
            humanImg: 'assets/scenario_pmo_director_v4.png', 
            instrument: 'assets/josoor_dependency_desk_v2.png',
            crop: '10% 20%', 
            activeTab: 1, // Dependency Desk index
            metrics: [
                { val: '4 hrs', label: 'Briefing prep time' },
                { val: '-60%', label: 'Follow-up load' },
                { val: '3', label: 'Stalls avoided' }
            ]
        },
        {
            id: 'director',
            label: 'PMO Director',
            headline: 'Stop chasing updates. Manage exceptions.',
            outcome: 'Reclaim your week. Zero surprise escalations.',
            // SWAPPED: Using Strategy Manager (Male?) for Director
            humanImg: 'assets/scenario_strategy_manager_v2.png',
            instrument: 'assets/josoor_control_tower_overview_v2.png',
            crop: '50% 50%',
            activeTab: 0, // Control Tower index
            metrics: [
                { val: '15 hrs', label: 'Briefing prep time' },
                { val: '-80%', label: 'Follow-up load' },
                { val: '12', label: 'Stalls avoided' }
            ]
        },
        {
            id: 'strategy',
            label: 'Strategy Manager',
            headline: 'Detect strategy drift before it hits the VRP.',
            outcome: 'Defend plan credibility. Spot hidden risks under "green" reports.',
            // SWAPPED: Using Vice Minister V3 (if female/lady) for Strategy or Stakeholder
            humanImg: 'assets/scenario_vice_minister_v3.png',
            instrument: 'assets/josoor_risk_desk_v2.png',
            crop: '0% 0%',
            activeTab: 2, // Risk Desk index
            metrics: [
                { val: 'Real-time', label: 'Briefing prep time' },
                { val: 'Auto', label: 'Follow-up load' },
                { val: '5', label: 'Stalls avoided' }
            ]
        },
        {
            id: 'stakeholder', // Delivery Lead
            label: 'Delivery Lead',
            headline: 'Prove progress. Clear your lane.',
            outcome: 'Know exactly who is blocking you and what evidence you need.',
            // SWAPPED: Using Stakeholder V2
            humanImg: 'assets/scenario_stakeholder_v2.png',
            instrument: 'assets/josoor_deep_dive_details_v2.png',
            crop: '20% 10%',
            activeTab: 3, // Deep Dive index
            metrics: [
                { val: '10 min', label: 'Briefing prep time' },
                { val: 'Zero', label: 'Follow-up load' },
                { val: '100%', label: 'Stalls avoided' }
            ]
        }
    ];

    // DOM ELEMENTS
    const headlineEl = document.querySelector('.hero-headline');
    const outcomeEl = document.querySelector('.hero-outcome-line');
    
    // V9: Specific Elements
    const humanImgEl = document.getElementById('hero-human-img');
    const instrumentImg = document.getElementById('hero-instrument-img');
    
    const timeBackTiles = document.querySelectorAll('.time-tile');
    const tabContainer = document.querySelector('.persona-tabs');
    const navLinks = document.querySelectorAll('.nav-link[data-persona]');
    const internalTabs = document.querySelectorAll('.frame-tab');

    // INITIALIZATION
    let activePersonaIndex = 0;

    // Create Tabs (Horizontal V9)
    tabContainer.innerHTML = '';
    personas.forEach((p, idx) => {
        const tab = document.createElement('div');
        tab.className = `persona-tab ${idx === 0 ? 'active' : 'inactive'}`;
        // Using humanImg for thumb now
        tab.innerHTML = `
            <img src="${p.humanImg}" class="persona-thumb">
            <span class="persona-label">${p.label}</span>
        `;
        tab.addEventListener('click', () => switchPersona(idx));
        tabContainer.appendChild(tab);
    });

    const tabs = document.querySelectorAll('.persona-tab');

    function switchPersona(index) {
        if(index === activePersonaIndex) return;

        // update active index
        activePersonaIndex = index;
        const data = personas[index];

        // 1. UPDATE TABS
        tabs.forEach(t => t.classList.remove('active'));
        tabs[index].classList.add('active');

        // 2. UPDATE TEXT
        headlineEl.textContent = data.headline;
        outcomeEl.textContent = data.outcome;

        // 3. UPDATE VISUALS (Human + Instrument)
        humanImgEl.style.opacity = '0';
        instrumentImg.style.opacity = '0';
        
        // Internal Tabs
        internalTabs.forEach(t => t.classList.remove('active'));
        if(internalTabs[data.activeTab]) {
            internalTabs[data.activeTab].classList.add('active');
        }

        setTimeout(() => {
            // Human
            humanImgEl.src = data.humanImg;
            humanImgEl.style.opacity = '1';

            // Instrument
            instrumentImg.src = data.instrument;
            instrumentImg.style.objectPosition = data.crop;
            instrumentImg.style.opacity = '1';
        }, 200);

        // 4. UPDATE METRICS
        data.metrics.forEach((m, i) => {
            if(timeBackTiles[i]) {
                timeBackTiles[i].querySelector('.time-val').textContent = m.val;
                timeBackTiles[i].querySelector('.time-label').textContent = m.label;
            }
        });
    }

    // Set Initial State
    const initData = personas[0];
    
    // Init Human
    humanImgEl.src = initData.humanImg;
    humanImgEl.style.opacity = '1';
    
    // Init Instrument
    instrumentImg.src = initData.instrument;
    instrumentImg.style.objectPosition = initData.crop;
    instrumentImg.style.opacity = '1';
    
    internalTabs.forEach(t => t.classList.remove('active'));
    if(internalTabs[initData.activeTab]) internalTabs[initData.activeTab].classList.add('active');

    initData.metrics.forEach((m, i) => {
        if(timeBackTiles[i]) {
            timeBackTiles[i].querySelector('.time-val').textContent = m.val;
            timeBackTiles[i].querySelector('.time-label').textContent = m.label;
        }
    });

    // NAVIGATION LINK LOGIC
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPersonaId = link.getAttribute('data-persona');
            const index = personas.findIndex(p => p.id === targetPersonaId);
            if(index !== -1) {
                switchPersona(index);
                // Smooth scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const href = link.getAttribute('href');
                if(href && href.startsWith('#')) {
                     const section = document.querySelector(href);
                     if(section) section.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

});
