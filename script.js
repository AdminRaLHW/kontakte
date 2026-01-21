
    /* --- KONFIGURATION & DATEN --- */
    const CONFIG_NAMES = {
        programmedBy: ["Dan Schneider"],
        maintainedBy: ["Simone Herzog", "Gordon Kempf"] // Jetzt 3 einzelne Einträge
    };
    const CSV_PATH = "data/kontakte.csv";
    const ICON_PHONE = `<svg class="btn-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`;
    const ICON_MOBILE = `<svg class="btn-icon" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
    const ICON_MAIL = `<svg class="btn-icon" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
    const ICON_FAX = `<svg class="btn-icon" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z"/><polyline points="13 2 13 9 20 9"/><line x1="6" y1="18" x2="18" y2="18"/><line x1="6" y1="14" x2="18" y2="14"/></svg>`;

    /* --- FOOTER SETUP --- */

    function setupFooters() {
        // Erstellt die Namenslisten mit Umbrüchen zwischen JEDEM Namen
        const maintainedList = CONFIG_NAMES.maintainedBy.join("<br>");
        const programmedList = CONFIG_NAMES.programmedBy.join("<br>");
        
        // HTML-Struktur: Label oben, Namen darunter
        const maintainedHtml = `<b>gewartet von:</b><br>${maintainedList}`;
        const programmedHtml = `<b>entwickelt von:</b><br>${programmedList}`;
        
        const finalContent = `${maintainedHtml}<br><br>${programmedHtml}`;

        // Web Footer
        const webFooter = document.getElementById('web-footer-info');
        if (webFooter) {
            webFooter.innerHTML = finalContent;
        }

        // Print Footer (Deckblatt)
        const printFooter = document.getElementById('print-footer-info');
        if (printFooter) {
            printFooter.innerHTML = finalContent;
        }
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
        const query = document.getElementById('search').value.toLowerCase();
        
        document.querySelectorAll('.bereich-section').forEach(bereichSec => {
            const bereichHeader = bereichSec.querySelector('.bereich-header').textContent.toLowerCase();
            const bereichMatch = bereichHeader.includes(query);
            let bereichHasVisibleContent = false;

            bereichSec.querySelectorAll('.abteilung-group').forEach(abtGrp => {
                const abtHeaderEl = abtGrp.querySelector('.abteilung-header');
                const abtHeaderText = abtHeaderEl ? abtHeaderEl.textContent.toLowerCase() : "";
                const abtMatch = abtHeaderText.includes(query);
                let abtHasVisibleContent = false;

                abtGrp.querySelectorAll('.contact-card').forEach(card => {
                    // Eine Karte wird angezeigt, wenn:
                    // 1. Der Suchbegriff im Bereichs-Namen vorkommt
                    // 2. Der Suchbegriff im Abteilungs-Namen vorkommt
                    // 3. Der Suchbegriff in der Karte selbst (Name, Tel, Mail, etc.) vorkommt
                    const cardMatch = card.textContent.toLowerCase().includes(query);
                    const isVisible = bereichMatch || abtMatch || cardMatch;
                    
                    card.style.display = isVisible ? "" : "none";
                    if (isVisible) abtHasVisibleContent = true;
                });

                // Abteilung anzeigen, wenn der Header matcht ODER Karten darin sichtbar sind
                const showAbt = abtMatch || abtHasVisibleContent;
                abtGrp.style.display = showAbt ? "" : "none";
                if (showAbt) bereichHasVisibleContent = true;
            });

            // Sektion anzeigen, wenn Bereichs-Header matcht ODER Inhalte darin sichtbar sind
            bereichSec.style.display = (bereichMatch || bereichHasVisibleContent) ? "" : "none";
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
        root.innerHTML = ""; 
        tocRoot.innerHTML = "";

        // Hilfsfunktion für Nachnamen-Sortierung
        const getLastName = (fullName) => {
            if (!fullName) return "";
            const parts = fullName.trim().split(/\s+/);
            return parts.length > 1 ? parts[parts.length - 1] : parts[0];
        };

        // 1. DATEN GRUPPIEREN & METADATEN SAMMELN
        const areaMetadata = {}; // Speichert Prio und ColorCode pro Bereich
        const deptMetadata = {}; // Speichert Prio pro Abteilung

        const groupedData = data.reduce((acc, p) => {
            const b = p.Bereich?.trim() || "Allgemein";
            const a = p.Abteilung?.trim() || "_NO_DEPT_";
            
            // Bereichs-Metadaten (kleinste Prio gewinnt)
            if (!areaMetadata[b]) {
                areaMetadata[b] = { 
                    prio: parseInt(p.Prio_B) || 999, 
                    color: (p.ColorCode || "01").toString().padStart(2, '0') 
                };
            } else {
                areaMetadata[b].prio = Math.min(areaMetadata[b].prio, parseInt(p.Prio_B) || 999);
            }

            // Abteilungs-Metadaten
            if (!deptMetadata[b]) deptMetadata[b] = {};
            if (!deptMetadata[b][a]) {
                deptMetadata[b][a] = parseInt(p.Prio_A) || 999;
            } else {
                deptMetadata[b][a] = Math.min(deptMetadata[b][a], parseInt(p.Prio_A) || 999);
            }

            if (!acc[b]) acc[b] = {};
            if (!acc[b][a]) acc[b][a] = [];
            acc[b][a].push(p);
            return acc;
        }, {});

        // 2. BEREICHE SORTIEREN (Prio_B -> Name)
        const sortedBereiche = Object.keys(groupedData).sort((a, b) => {
            return areaMetadata[a].prio - areaMetadata[b].prio || a.localeCompare(b);
        });

        // 3. ITERATION ÜBER BEREICHE
        sortedBereiche.forEach((bName, index) => {
            const sectionCode = areaMetadata[bName].color;
            
            // Fax-Analyse für Bereichsebene
            const faxDist = {}; 
            Object.keys(groupedData[bName]).forEach(aName => {
                groupedData[bName][aName].forEach(p => {
                    const f = p.Fax?.trim();
                    if (f && f !== "-") {
                        if (!faxDist[f]) faxDist[f] = new Set();
                        faxDist[f].add(aName);
                    }
                });
            });
            const globalFaxes = Object.keys(faxDist).filter(f => faxDist[f].size > 1);
            
            // Sektion erstellen
            const section = document.createElement('section');
            section.className = `bereich-section cat-${sectionCode}`;
            
            let sectionHtml = `<h2 class="bereich-header">${bName}</h2>`;
            globalFaxes.forEach(f => {
                sectionHtml += `<div class="bereich-fax">${ICON_FAX} Fax: ${f}</div>`;
            });
            sectionHtml += `<div class="bereich-content"></div>`;
            section.innerHTML = sectionHtml;
            const content = section.querySelector('.bereich-content');

            // 4. ABTEILUNGEN SORTIEREN (Prio_A -> Name)
            const sortedAbts = Object.keys(groupedData[bName]).sort((a, b) => {
                return deptMetadata[bName][a] - deptMetadata[bName][b] || a.localeCompare(b);
            });

            sortedAbts.forEach(aName => {
                const group = document.createElement('div');
                group.className = "abteilung-group";
                const personArray = groupedData[bName][aName];
                
                // Lokale Fax-Analyse für Abteilungsebene
                const localFaxCount = {};
                personArray.forEach(p => {
                    const f = p.Fax?.trim();
                    if (f && f !== "-" && !globalFaxes.includes(f)) {
                        localFaxCount[f] = (localFaxCount[f] || 0) + 1;
                    }
                });
                const localDeptFaxes = Object.keys(localFaxCount).filter(f => localFaxCount[f] > 1);

                // Abteilung Header & Standort
                let headerHtml = (aName !== "_NO_DEPT_") ? `<h3 class="abteilung-header">${aName}</h3>` : "";
                const standort = personArray[0].Standort?.trim();
                if (standort && standort !== "-") headerHtml += `<div class="abteilung-location">${standort}</div>`;
                localDeptFaxes.forEach(f => {
                    headerHtml += `<div class="abteilung-fax">${ICON_FAX} Fax: ${f}</div>`;
                });
                group.innerHTML = headerHtml;

                const grid = document.createElement('div');
                grid.className = "cards-grid";

                // 5. PERSONEN SORTIEREN (Prio_P -> Nachname)
                personArray.sort((x, y) => {
                    const pX = parseInt(x.Prio_P) || 999;
                    const pY = parseInt(y.Prio_P) || 999;
                    if (pX !== pY) return pX - pY;
                    return getLastName(x.Name).localeCompare(getLastName(y.Name), 'de');
                }).forEach(p => {
                    const card = document.createElement('div');
                    card.className = "contact-card";
                    
                    const row = (icon, val, type) => {
                        if (!val || val === "-") return "";
                        const link = type === 'tel' ? `tel:${val.replace(/\s/g, '')}` : `mailto:${val}`;
                        const displayVal = type === 'mail' ? val.replace('@', '@\u200B').split('-').join('\u2011') : val;
                        return `<div class="contact-row"><span class="icon-container">${icon}</span><a href="${link}" class="contact-link">${displayVal}</a></div>`;
                    };

                    const pFax = p.Fax?.trim();
                    const showFaxInCard = pFax && pFax !== "-" && !globalFaxes.includes(pFax) && !localDeptFaxes.includes(pFax);

                    card.innerHTML = `
                        <h4>${p.Name}</h4>
                        <div class="job-position">${p.Position || ''}</div>
                        ${row(ICON_PHONE, p.Telefon, 'tel')}
                        ${row(ICON_MOBILE, p.Mobiltelefon, 'tel')}
                        ${row(ICON_MAIL, p.Email, 'mail')}
                        ${row(ICON_MAIL, p.Email_alt, 'mail')}
                        ${showFaxInCard ? row(ICON_FAX, pFax, 'tel') : ""}
                    `;
                    grid.appendChild(card);
                });
                
                group.appendChild(grid);
                content.appendChild(group);
            });

            root.appendChild(section);
            
            // TOC (Inhaltsverzeichnis)
            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item';
            tocItem.innerHTML = `
                <div class="toc-color-box" style="background-color: var(--hex-${sectionCode})"></div>
                <div class="toc-name">${bName}</div>
                <div class="toc-dots"></div>
                <div class="toc-page">S. ${index + 2}</div>
            `;
            tocRoot.appendChild(tocItem);
        });
    }

    function clearSearch() {
    const searchInput = document.getElementById('search');
    searchInput.value = '';       // Text löschen
    handleSearch();               // Suche triggern (blendet alles wieder ein)
    searchInput.focus();          // Fokus zurück ins Feld
    }
