const ICON_PHONE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-accent"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
const ICON_MOBILE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-accent"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`;
const ICON_MAIL = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-accent"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;

function filter() {
    let val = document.getElementById('search').value.toLowerCase();
    document.querySelectorAll('.contact-card').forEach(card => {
        card.style.display = card.innerText.toLowerCase().includes(val) ? "" : "none";
    });
}

Papa.parse("data/kontakte.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
        const container = document.getElementById('directory');
        let lastDept = "";

        // Filtert Zeilen ohne Abteilung/Name
        const validData = results.data.filter(p => p.Abteilung && p.Name);

        // Sortierung nach Abteilung
        validData.sort((a, b) => {
            return (a.Abteilung || "").localeCompare(b.Abteilung || "");
        });

        validData.forEach(p => {
            // Header für neue Abteilungen erstellen
            if(p.Abteilung !== lastDept) {
                lastDept = p.Abteilung;
                let h = document.createElement('h2'); 
                h.className = "section-header"; 
                h.innerText = lastDept;
                container.appendChild(h);
            }

            let deptClass = p.Abteilung ? p.Abteilung.toLowerCase().replace(/\s/g, '') : 'unknown';
            let cls = "cat-" + deptClass;

            let div = document.createElement('div');
            div.className = `contact-card ${cls}`;
            
            // Hilfsfunktion: Gibt HTML nur zurück, wenn Daten vorhanden sind
           const renderField = (label, value) => {
                if (!value || value.trim() === "" || value === "-") return "";
              return `
                <div class="contact-row">
                    <span class="icon-container">${label}</span>
                    <span class="value-container">${value}</span>
                </div>`;
};

            // Card Inhalt zusammenbauen
            div.innerHTML = `
                <h3>${p.Name}</h3>
                ${p.Position ? `<p class="job-position">${p.Position}</p>` : ''}
                <p>
                    ${renderField(ICON_PHONE, p.Telefon)}
                    ${renderField(ICON_MOBILE, p.Mobiltelefon)}
                    ${renderField(ICON_MAIL, p.Email)}
                </p>
            `;
            
            container.appendChild(div);
        });
    }
});