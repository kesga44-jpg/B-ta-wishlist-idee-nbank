# Football Coach (Coach main 2)

Statische app (`index.html`, `app.js`, `style.css`, `sw.js`). Lokale opslag: `footballCoachDataV2` (V1 wordt herkend en gekopieerd, nooit verwijderd). Optionele versleutelde sync via Supabase (tabel `coach_data`: `id`, `payload`, `updated_at`).

## Ontwikkelen en testen
- `node --check app.js` — syntaxcontrole
- `node --test tests/app.test.js` — tests (geen dependencies; `app.js` draait in een vm met browserstubs, sync met gemockte `fetch`)

## Supabase
Project `ckodnfshelblddfypmmv`. URL en **publishable** key staan op één plek bovenin `app.js` (`SYNC_PROJECT_URL`, `SYNC_PUBLIC_KEY`). Nooit een `service_role`-key in de browsercode.
Status: verbinding en backend (tabel, RLS, bucket `vc2`, map `VC2`) zijn nog **niet geverifieerd**. Controle in fase 2: `https://ckodnfshelblddfypmmv.supabase.co` is vanuit de ontwikkelomgeving niet bereikbaar (DNS/netwerkblokkade, curl-exit 6) — dit is een netwerkblokkade, géén vastgestelde configuratiefout. Er zijn geen remote resources gewijzigd.

## Roadmap
Legenda: ✅ bestaat · 🟡 gedeeltelijk · ⬜ nog te bouwen

1. **Betrouwbare basis en opslag** — 🟡
   ✅ V2/V1-opslag, validatie, undo, auto-back-up, herstelpunt, conflictbewaking en versleuteling bij sync, foutmelding bij mislukte lokale opslag, tests.
   ✅ Spelers met meerdere teams (`teamIds`); aanwezigheid (`attendance`) apart van selectie (`lineup`/`benchIds`); waarschuwing bij speler in twee teams op dezelfde dag.
   🟡 Speelminuten worden per speler handmatig ingevoerd (`playerStats[id].minutes`); wissels met tijdstip worden nog niet geregistreerd.
   ⬜ Verificatie van het nieuwe Supabase-project (tabel, RLS, bucket) en herhaalbare gegevensmigratie.
2. **Tactische speelprincipes** — 🟡 (`gameModel.principles`: spelfase, teamgedrag, coachpunten, druktriggers, herkenbare situaties, veelvoorkomende fouten, koppelingen aan oefeningen/trainingen/wedstrijden en doelen bestaan; voorgedefinieerde 1-4-3-3-principes en evaluatie per principe ⬜)
3. **Kennisbank 2.0** — 🟡 (niet-doorzoekbare PDF's worden als zodanig gemarkeerd; geïndexeerde bronnen en VC2-indexering/zoeken bestaan; filters, fragmenten met bronverwijzing en koppeling aan training ⬜)
4. **Slimme trainingsplanner en weekperiodisering** — 🟡 (trainingsgenerator en periodisering bestaan basaal; automatische tijdsverdeling en weekafstemming ⬜)
5. **AI-trainingsassistent** — 🟡 (lokale, regelgebaseerde assistent; echte AI-provider ⬜ en vereist server-side configuratie)
6. **Spelersontwikkeling en O23-doorstroom** — 🟡 (ontwikkeldoelen, gesprekken, doorstroomvelden bestaan; vertrouwelijke rechten server-side ⬜)
7. **Wedstrijdcentrum, live registratie, dashboard en weekrapportage** — 🟡 (wedstrijdformulier, selecties, print/PDF bestaan; live registratie, offline-wachtrij, weekrapport ⬜)

## Fase 2 (speelprincipes en kennisbank)
**Toegevoegd**
- Vijf bewerkbare *standaardvoorstellen* voor 1-4-3-3 (O23, verzorgd voetbal, hoog drukzetten): opbouw en balbezit, hoog drukzetten, omschakeling na balverlies, omschakeling na balverovering, restverdediging. Status "In ontwikkeling", gemarkeerd met `isStandardProposal`/`standardKey`; geen koppelingen aan oefeningen/trainingen. Idempotent via `gameModel.standardPrinciplesVersion` en controle op `standardKey`/naam: bestaande principes blijven ongemoeid, verwijderde principes komen niet terug, bewerken en verwijderen werken zoals voorheen.
- VC2-zoeken: filters op bestandstype (PDF/.fckb) en doorzoekbaar/niet-doorzoekbaar; resultaten tonen oorspronkelijke bestandsnaam, passage en type; paginanummer alleen bij PDF (bij .fckb is de index één blok). Niet-doorzoekbare bestanden staan als "alleen openen" en geven nooit treffers. Bestaande indexen blijven geldig (type wordt afgeleid uit de naam); er wordt niet opnieuw geïndexeerd.
- Per passage: "Oefening aan training toevoegen": controlemodal (training, zelf in te vullen naam, duur, passagetekst als beschrijving). Opgeslagen in de bestaande `exercises` + `planItems`, met bronverwijzing (`exercise.source`). Dubbelen (zelfde bron in dezelfde training) en dubbelklik worden voorkomen; bij mislukte opslag wordt de state teruggedraaid en een melding getoond. Naam wordt nooit uit de bestandsnaam afgeleid; de index bevat geen gestructureerde oefeningen.

**Tests** (`node --test tests/app.test.js`): 20 geslaagd, 0 mislukt; `node --check app.js`: geslaagd. Eén bestaande test is aangepast om het principe op id te vinden (er staan nu ook standaardprincipes in de lijst).

**Alleen met fixtures getest**: VC2-filters/zoeken/bronverwijzing (fixture-index), oefening toevoegen en foutafhandeling (gestubde opslag). De UI (modal, filters op iPhone/iPad/laptop) is niet in een browser getest.

**Nog open**
- Echte VC2-PDF's en .fckb's indexeren en zoekresultaten/paginanummers controleren; categorie-/trainingsdoel-/spelprincipe-filters ontbreken omdat die metadata niet in de index staat.
- Supabase: URL/key, tabel `coach_data`, RLS, bucket `vc2` en map `VC2` verifiëren zodra netwerk beschikbaar is.
