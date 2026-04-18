document.addEventListener('DOMContentLoaded', () => {
    const demoBtn = document.getElementById('demo-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const welcomeScreen = document.getElementById('welcome-screen');
    const dashboardContent = document.getElementById('dashboard-content');
    const loadOverlay = document.getElementById('loading-overlay');
    
    let allData = [];
    let redFlags = [];
    let opinionCloud = {};
    const MAX_BUDGET_FOR_SCALE = 300; // Expected max budget to calculate percentages
    
    demoBtn.addEventListener('click', initializeDashboard);
    refreshBtn.addEventListener('click', initializeDashboard);

    async function initializeDashboard() {
        // Show loading state
        welcomeScreen.classList.add('hidden');
        dashboardContent.classList.add('hidden');
        loadOverlay.classList.remove('hidden');
        
        allData = [];
        redFlags = [];
        opinionCloud = {};
        
        try {
            // 1. Fetch CSV data
            const projRes = await fetch('/api/projects');
            const projects = await projRes.json();
            
            if (!projRes.ok) throw new Error("Failed to fetch projects database");
            
            // 2. Iterate and Analyze each project via Azure (or Mock)
            for (let proj of projects) {
                const ansRes = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: proj.content, budget: proj.budget })
                });
                const analysis = await ansRes.json();
                
                if(analysis.mocked) {
                    document.getElementById('mock-badge').classList.remove('hidden');
                }
                
                const combined = { ...proj, ...analysis };
                allData.push(combined);
                
                // Track red flags
                if (combined.red_flag) redFlags.push(combined);
                
                // Track opinions for Word Cloud
                if (combined.opinions) {
                    combined.opinions.forEach(op => {
                        const target = op.target.toLowerCase();
                        if (!opinionCloud[target]) {
                            opinionCloud[target] = { count: 0, sentiment: op.sentiment };
                        }
                        opinionCloud[target].count += 1;
                    });
                }
            }
            
            // 3. Render Dashboard
            renderDashboard();
            
        } catch(error) {
            alert("Error initializing dashboard: " + error.message);
        } finally {
            loadOverlay.classList.add('hidden');
        }
    }
    
    function renderDashboard() {
        dashboardContent.classList.remove('hidden');
        
        // --- Calculate Stats ---
        let totBudget = 0;
        let totPos = 0; let totNeu = 0; let totNeg = 0;
        
        allData.forEach(p => {
            totBudget += p.budget;
            totPos += p.confidence_scores.positive;
            totNeu += p.confidence_scores.neutral;
            totNeg += p.confidence_scores.negative;
        });
        
        const count = allData.length;
        document.getElementById('total-budget').textContent = totBudget.toFixed(1);
        document.getElementById('total-projects').textContent = count;
        document.getElementById('total-flags').textContent = redFlags.length;
        
        // Find dominant average sentiment
        let avgSentStr = "Neutral";
        if (totPos > totNeg && totPos > totNeu) avgSentStr = "Positive";
        else if (totNeg > totPos && totNeg > totNeu) avgSentStr = "Negative";
        document.getElementById('avg-sentiment').textContent = avgSentStr;
        
        // --- Render Red Flags ---
        const rfList = document.getElementById('red-flag-list');
        rfList.innerHTML = '';
        if (redFlags.length === 0) {
            rfList.innerHTML = '<div class="empty-state">No red flags detected currently. All high-budget projects have acceptable sentiment.</div>';
        } else {
            redFlags.forEach(f => {
                rfList.innerHTML += `
                    <div class="flag-item">
                        <div class="flag-info">
                            <h4>${f.name}</h4>
                            <p>${f.district} • ${f.budget} Cr • ${f.sentiment}</p>
                        </div>
                        <div class="flag-tag">Audit Alert</div>
                    </div>
                `;
            });
        }
        
        // --- Render Gap Chart (Pure CSS Bars) ---
        const gapLabels = document.getElementById('gap-chart-labels');
        const gapBars = document.getElementById('gap-chart-bars');
        gapLabels.innerHTML = '';
        gapBars.innerHTML = '';
        
        allData.forEach(p => {
            gapLabels.innerHTML += `<div class="chart-label-item" title="${p.name}">${p.name}</div>`;
            
            const budgetPct = Math.min((p.budget / MAX_BUDGET_FOR_SCALE) * 100, 100);
            const posPct = p.confidence_scores.positive * 100;
            const negPct = p.confidence_scores.negative * 100;
            
            gapBars.innerHTML += `
                <div class="chart-bar-group">
                    <div class="bar-track"><div class="bar-fill budget" style="width: ${budgetPct}%"></div></div>
                    <div class="bar-track" style="display:flex;">
                        <div class="bar-fill positivity" style="width: ${posPct}%; position:relative;"></div>
                        <div class="bar-fill negativity" style="width: ${negPct}%; position:relative; left:${posPct}%;"></div>
                    </div>
                </div>
            `;
        });
        
        // --- Render Word Cloud ---
        const wcCont = document.getElementById('word-cloud');
        wcCont.innerHTML = '';
        Object.keys(opinionCloud).forEach(word => {
            const data = opinionCloud[word];
            // Base font size 12px, plus 4px per mention
            const fontSize = Math.min(12 + (data.count * 4), 32); 
            const cls = data.sentiment === 'positive' ? 'positive' : (data.sentiment === 'negative' ? 'negative' : 'neutral');
            
            wcCont.innerHTML += `<span class="word ${cls}" style="font-size: ${fontSize}px">${word}</span>`;
        });
        
        if(Object.keys(opinionCloud).length === 0) {
            wcCont.innerHTML = '<div class="empty-state">No specific aspects extracted.</div>';
        }

        // --- Render Table ---
        const tbody = document.getElementById('project-table-body');
        tbody.innerHTML = '';
        allData.forEach(p => {
            const cls = p.sentiment === 'positive' ? 'positive' : (p.sentiment === 'negative' ? 'negative' : 'neutral');
            const score = Math.max(p.confidence_scores.positive, p.confidence_scores.negative, p.confidence_scores.neutral)*100;
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.district}</td>
                    <td>₹${p.budget} Cr</td>
                    <td><span class="sentiment-pill ${cls}">${p.sentiment}</span></td>
                    <td>${isNaN(score)? 0 : score.toFixed(1)}% Confidence</td>
                </tr>
            `;
        });
    }
});
