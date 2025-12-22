document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // PROOF STRIP IMAGE SWITCHER
    // ----------------------------------------------------
    const tiles = document.querySelectorAll('.screen-tile');
    const displayImage = document.getElementById('proof-preview-img');

    if (tiles.length > 0 && displayImage) {
        tiles.forEach(tile => {
            tile.addEventListener('click', () => {
                // Remove active class from all
                tiles.forEach(t => t.classList.remove('active'));
                
                // Add active to clicked
                tile.classList.add('active');

                // Swap Image
                const newSrc = tile.dataset.src;
                displayImage.style.opacity = 0;
                
                setTimeout(() => {
                    displayImage.src = newSrc;
                    displayImage.style.opacity = 1;
                }, 200);
            });
        });
    }

});
document.addEventListener('DOMContentLoaded', () => {
    
    // CONFIGURATION: Persona Data
    const personas = [
        {
            id: 'vice-minister',
            label: 'Vice Minister',
            headline: 'Detect hidden blockers across your portfolio.',
            outcome: 'See the cross-cutting chains that delay Giga-Projects.',
            bg: 'assets/scenario_vice_minister_v3.png',
            instrument: 'assets/josoor_dependency_desk_v2.png',
            crop: '10% 20%', // Object Position X Y
            metrics: [
                { val: '12%', label: 'Portfolio Slip Reduced' },
                { val: '4 hrs', label: 'Weekly briefing prep saved' },
                { val: '3', label: 'Major Stalls Prevented' }
            ]
        },
        {
            id: 'director',
            label: 'PMO Director',
            headline: 'Stop chasing updates. Start managing exceptions.',
            outcome: 'Automated signal detection replaces manual reporting.',
            bg: 'assets/scenario_pmo_director_v4.png',
            instrument: 'assets/josoor_control_tower_overview_v2.png',
            crop: '50% 50%',
            metrics: [
                { val: '80%', label: 'Reporting time cut' },
                { val: '100%', label: 'Data freshness' },
                { val: '0', label: 'Surprise escalations' }
            ]
        },
        {
            id: 'strategy',
            label: 'Strategy Manager',
            headline: 'Ensure VRP targets align with reality.',
            outcome: 'Link execution data directly to Strategic Objectives.',
            bg: 'assets/scenario_strategy_manager_v2.png',
            instrument: 'assets/josoor_deep_dive_details_v2.png',
            crop: '0% 0%',
            metrics: [
                { val: 'Real-time', label: 'KPI Drift Visibility' },
                { val: '14 Days', label: 'Faster budget reallocation' },
                { val: '95%', label: 'Model Confidence' }
            ]
        },
        {
            id: 'stakeholder',
            label: 'Delivery Lead',
            headline: 'Clear your lane. Prove your progress.',
            outcome: 'Auto-compliance means you focus on build, not paperwork.',
            bg: 'assets/scenario_stakeholder_v2.png',
            instrument: 'assets/josoor_risk_desk_v2.png',
            crop: '20% 10%',
            metrics: [
                { val: '15 hrs', label: 'Meetings Avoided / Week' },
                { val: 'Instant', label: 'Evidence Retrieval' },
                { val: '100%', label: 'Audit Readiness' }
            ]
        }
    ];

    // DOM ELEMENTS
    const bgContainer = document.querySelector('.hero-section'); // We will append layers here
    const headlineEl = document.querySelector('.hero-headline');
    const outcomeEl = document.querySelector('.hero-outcome-line');
    const instrumentImg = document.getElementById('hero-instrument-img');
    const timeBackTiles = document.querySelectorAll('.time-tile');
    const tabContainer = document.querySelector('.persona-tabs');

    // INITIALIZATION
    let activePersonaIndex = 0;

    // Create BG Layers
    personas.forEach((p, idx) => {
        const bgDiv = document.createElement('div');
        bgDiv.classList.add('hero-bg-layer');
        if(idx === 0) bgDiv.classList.add('active');
        bgDiv.style.backgroundImage = `url('${p.bg}')`;
        // Insert before overlay
        bgContainer.insertBefore(bgDiv, bgContainer.firstChild); 
    });
    
    const bgLayers = document.querySelectorAll('.hero-bg-layer');

    // Create Tabs
    tabContainer.innerHTML = '';
    personas.forEach((p, idx) => {
        const tab = document.createElement('div');
        tab.className = `persona-tab ${idx === 0 ? 'active' : ''}`;
        tab.innerHTML = `
            <img src="${p.bg}" class="persona-thumb">
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

        // 2. UPDATE BG (Fade)
        bgLayers.forEach(l => l.classList.remove('active'));
        bgLayers[index].classList.add('active');

        // 3. UPDATE TEXT
        headlineEl.textContent = data.headline;
        outcomeEl.textContent = data.outcome;

        // 4. UPDATE INSTRUMENT
        // Simple fade out/in effect manually if needed, or let CSS transition handle object-position if source is same
        // But source changes, so we fade opacity.
        instrumentImg.classList.remove('active');
        setTimeout(() => {
            instrumentImg.src = data.instrument;
            instrumentImg.style.objectPosition = data.crop;
            instrumentImg.classList.add('active');
        }, 300);

        // 5. UPDATE METRICS
        data.metrics.forEach((m, i) => {
            if(timeBackTiles[i]) {
                timeBackTiles[i].querySelector('.time-val').textContent = m.val;
                timeBackTiles[i].querySelector('.time-label').textContent = m.label;
            }
        });
    }

    // Set Initial State (Metrics & Instrument) explicitly
    // (BG is set by HTML/CSS initial class)
    const initData = personas[0];
    instrumentImg.src = initData.instrument;
    instrumentImg.style.objectPosition = initData.crop;
    setTimeout(() => instrumentImg.classList.add('active'), 100);

    initData.metrics.forEach((m, i) => {
        if(timeBackTiles[i]) {
            timeBackTiles[i].querySelector('.time-val').textContent = m.val;
            timeBackTiles[i].querySelector('.time-label').textContent = m.label;
        }
    });

});
