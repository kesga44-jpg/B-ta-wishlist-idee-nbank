# Football Coach (Coach main 2)

Statische app (`index.html`, `app.js`, `style.css`, `sw.js`). Lokale opslag: `footballCoachDataV2` (V1 wordt herkend en gekopieerd, nooit verwijderd). Optionele versleutelde sync via Supabase (tabel `coach_data`: `id`, `payload`, `updated_at`).

## Ontwikkelen en testen
- `node --check app.js` — syntaxcontrole
- `node --test tests/app.test.js` — tests (geen dependencies; `app.js` draait in een vm met browserstubs, sync met gemockte `fetch`)

## Supabase
Project `ckodnfshelblddfypmmv`. URL en **publishable** key staan op één plek bovenin `app.js` (`SYNC_PROJECT_URL`, `SYNC_PUBLIC_KEY`). Nooit een `service_role`-key in de browsercode.
Status: verbinding en backend (tabel, RLS, bucket `vc2`, map `VC2`) zijn nog **niet geverifieerd** vanuit de ontwikkelomgeving (netwerk geblokkeerd).

## Roadmap
Legenda: ✅ bestaat · 🟡 gedeeltelijk · ⬜ nog te bouwen

1. **Betrouwbare basis en opslag** — 🟡
   ✅ V2/V1-opslag, validatie, undo, auto-back-up, herstelpunt, conflictbewaking en versleuteling bij sync, foutmelding bij mislukte lokale opslag, tests.
   ✅ Spelers met meerdere teams (`teamIds`); aanwezigheid (`attendance`) apart van selectie (`lineup`/`benchIds`); waarschuwing bij speler in twee teams op dezelfde dag.
   🟡 Speelminuten worden per speler handmatig ingevoerd (`playerStats[id].minutes`); wissels met tijdstip worden nog niet geregistreerd.
   ⬜ Verificatie van het nieuwe Supabase-project (tabel, RLS, bucket) en herhaalbare gegevensmigratie.
2. **Tactische speelprincipes** — 🟡 (`gameModel.principles` en formaties bestaan; uitwerking per principe ⬜)
3. **Kennisbank 2.0** — 🟡 (geïndexeerde bronnen en VC2-indexering/zoeken bestaan; filters, fragmenten met bronverwijzing en koppeling aan training ⬜)
4. **Slimme trainingsplanner en weekperiodisering** — 🟡 (trainingsgenerator en periodisering bestaan basaal; automatische tijdsverdeling en weekafstemming ⬜)
5. **AI-trainingsassistent** — 🟡 (lokale, regelgebaseerde assistent; echte AI-provider ⬜ en vereist server-side configuratie)
6. **Spelersontwikkeling en O23-doorstroom** — 🟡 (ontwikkeldoelen, gesprekken, doorstroomvelden bestaan; vertrouwelijke rechten server-side ⬜)
7. **Wedstrijdcentrum, live registratie, dashboard en weekrapportage** — 🟡 (wedstrijdformulier, selecties, print/PDF bestaan; live registratie, offline-wachtrij, weekrapport ⬜)
