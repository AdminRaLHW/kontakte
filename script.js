 /* --- KONFIGURATION & DATEN --- */
    const CONFIG_NAMES = {
        programmedBy: ["Dan Schneider"],
        maintainedBy: ["Simone Herzog, Gordon Kempf, Dan Schneider"]
    };
    const CSV_PATH = "data/kontakte.csv";
    const ICON_PHONE = `<svg class="btn-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`;
    const ICON_MOBILE = `<svg class="btn-icon" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
    const ICON_MAIL = `<svg class="btn-icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;

    function setupFooters() {
        const text = `gewartet von: ${CONFIG_NAMES.maintainedBy.join(", ")}  entwickelt von: ${CONFIG_NAMES.programmedBy.join(", ")}`;
        document.getElementById('web-footer-info').textContent = text;
        document.getElementById('print-footer-info').textContent = text;
    }
    setupFooters();

    /* --- THEME LOGIK (HELL/DUNKEL) --- */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const isDark = theme === 'dark';
        document.getElementById('sun-icon').style.display = isDark ? 'block' : 'none';
        document.getElementById('moon-icon').style.display = isDark ? 'none' : 'block';
        document.getElementById('theme-text').textContent = isDark ? 'Hell' : 'Dunkel';
    }
    applyTheme(localStorage.getItem('dir-theme') || 'light');
    function toggleTheme() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        localStorage.setItem('dir-theme', newTheme);
        applyTheme(newTheme);
    }

    /* --- ACCESSIBILITY LOGIK --- */
    const sidebar = document.getElementById('accSidebar');
    const overlay = document.getElementById('accOverlay');
    let accSettings = JSON.parse(localStorage.getItem('lhw-acc-settings')) || {
        fontSize: 1, lineHeight: 1.5, letterSpacing: 0, theme: 'default'
    };

    function toggleAccMenu() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }

    function setAccTheme(theme) {
        accSettings.theme = theme;
        applyAccSettings();
    }

    function applyAccSettings() {
        // Skalierung über Root-Variable für echte dynamische Größe
        document.documentElement.style.setProperty('--acc-font-scale', accSettings.fontSize);
        document.body.style.lineHeight = accSettings.lineHeight;
        document.body.style.letterSpacing = accSettings.letterSpacing + "px";

        // Klassen auf Body setzen (für Filter-Mapping)
        document.body.classList.remove('acc-grayscale', 'acc-invert', 'acc-high-contrast', 'acc-default');
        document.body.classList.add('acc-' + accSettings.theme);

        // Buttons updaten
        document.querySelectorAll('.acc-btn').forEach(b => b.classList.remove('active'));
        const btnMap = { 'default': 'btn-def', 'grayscale': 'btn-gray', 'invert': 'btn-inv', 'high-contrast': 'btn-high' };
        document.getElementById(btnMap[accSettings.theme]).classList.add('active');

        localStorage.setItem('lhw-acc-settings', JSON.stringify(accSettings));
    }

    function resetAcc() {
        accSettings = { fontSize: 1, lineHeight: 1.5, letterSpacing: 0, theme: 'default' };
        document.getElementById('slider-font').value = 1;
        document.getElementById('slider-line').value = 1.5;
        document.getElementById('slider-spacing').value = 0;
        applyAccSettings();
    }

    document.getElementById('slider-font').addEventListener('input', e => { accSettings.fontSize = e.target.value; applyAccSettings(); });
    document.getElementById('slider-line').addEventListener('input', e => { accSettings.lineHeight = e.target.value; applyAccSettings(); });
    document.getElementById('slider-spacing').addEventListener('input', e => { accSettings.letterSpacing = e.target.value; applyAccSettings(); });

    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('open')) toggleAccMenu(); });

    /* --- DATEN-STAND --- */
    async function fetchLastModified() {
        try {
            const response = await fetch(CSV_PATH, { method: 'HEAD' });
            const lastMod = response.headers.get("Last-Modified");
            if (lastMod) {
                const date = new Date(lastMod);
                const dateStr = `Datenstand: ${date.toLocaleDateString('de-DE')}`;
                document.getElementById('last-update').textContent = dateStr;
                document.getElementById('print-date').textContent = dateStr;
            }
        } catch (e) {}
    }
    fetchLastModified();

    /* --- RENDERING --- */
    function handleSearch() {
        const q = document.getElementById('search').value.toLowerCase();
        document.querySelectorAll('.bereich-section').forEach(sec => {
            sec.style.display = sec.textContent.toLowerCase().includes(q) ? "" : "none";
        });
    }

    Papa.parse(CSV_PATH, {
        download: true, header: true, skipEmptyLines: true,
        complete: (results) => {
            render(results.data);
            applyAccSettings(); // Nach Rendering Acc-Settings nochmal forcieren
        }
    });

    function render(data) {
        const root = document.getElementById('directory');
        const tocRoot = document.getElementById('print-toc');
        root.innerHTML = ""; tocRoot.innerHTML = "";

        const areaSortMap = {}; 
        const groupedData = data.reduce((acc, p) => {
            const b = p.Bereich?.trim() || "Allgemein";
            const a = p.Abteilung?.trim() || "_NO_DEPT_";
            const code = parseInt(p.ColorCode) || 99;
            if (!areaSortMap[b] || code < areaSortMap[b]) areaSortMap[b] = code;
            if (!acc[b]) acc[b] = {};
            if (!acc[b][a]) acc[b][a] = [];
            acc[b][a].push(p);
            return acc;
        }, {});

        const sortedBereiche = Object.keys(groupedData).sort((a, b) => areaSortMap[a] - areaSortMap[b]);

        sortedBereiche.forEach((bName, index) => {
            const sectionCode = areaSortMap[bName].toString().padStart(2, '0');
            const pageNum = index + 2;

            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.innerHTML = `<div class="toc-color-box" style="background-color: var(--hex-${sectionCode})"></div><div class="toc-name">${bName}</div><div class="toc-dots"></div><div class="toc-page">S. ${pageNum}</div>`;
            tocRoot.appendChild(tocItem);

            const section = document.createElement('section');
            section.className = `bereich-section cat-${sectionCode}`;
            section.innerHTML = `<h2 class="bereich-header">${bName}</h2><div class="bereich-content"></div>`;
            const content = section.querySelector('.bereich-content');

            Object.keys(groupedData[bName]).sort().forEach(aName => {
                const group = document.createElement('div');
                group.className = "abteilung-group";
                if (aName !== "_NO_DEPT_") group.innerHTML = `<h3 class="abteilung-header">${aName}</h3>`;
                const grid = document.createElement('div');
                grid.className = "cards-grid";

                groupedData[bName][aName].sort((x,y) => x.Name.localeCompare(y.Name)).forEach(p => {
                    const card = document.createElement('div');
                    card.className = "contact-card";
                    const row = (icon, val, type) => {
                        if (!val || val === "-") return "";
                        const link = type === 'tel' ? `tel:${val.replace(/\s/g, '')}` : `mailto:${val}`;
                        const displayVal = type === 'mail' ? val.replace('@', '@\u200B').split('-').join('\u2011') : val;
                        return `<div class="contact-row"><span class="icon-container">${icon}</span><a href="${link}" class="contact-link">${displayVal}</a></div>`;
                    };
                    card.innerHTML = `<h4>${p.Name}</h4><div class="job-position">${p.Position || ''}</div>${row(ICON_PHONE, p.Telefon, 'tel')}${row(ICON_MOBILE, p.Mobiltelefon, 'tel')}${row(ICON_MAIL, p.Email, 'mail')}`;
                    grid.appendChild(card);
                });
                group.appendChild(grid);
                content.appendChild(group);
            });
            root.appendChild(section);
        });
    }