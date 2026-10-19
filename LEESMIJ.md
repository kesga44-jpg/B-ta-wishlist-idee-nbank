# Football Coach (Coach main 2)

Statische app (`index.html`, `app.js`, `style.css`, `sw.js`). Lokale opslag: `footballCoachDataV2` (V1 wordt herkend en gekopieerd, nooit verwijderd). Optionele versleutelde sync via Supabase Auth + tabel `coach_data_auth` (`user_id`, `id`, `payload`, `updated_at`; sleutel `(user_id, id)`). De oude tabel `coach_data` wordt door de app niet meer gebruikt en nooit gewijzigd.

## Ontwikkelen en testen
- `node --check app.js` — syntaxcontrole
- `node --test tests/app.test.js` — tests (geen dependencies; `app.js` draait in een vm met browserstubs, sync met gemockte `fetch`)

## Supabase
Project `ckodnfshelblddfypmmv`. URL en **publishable** key staan op één plek bovenin `app.js` (`SYNC_PROJECT_URL`, `SYNC_PUBLIC_KEY`). Nooit een `service_role`-key in de browsercode.
Status: verbinding en backend (tabel, RLS, bucket `vc2`, map `VC2`) zijn nog **niet geverifieerd** vanuit de ontwikkelomgeving (netwerk geblokkeerd).

### Sync met Supabase Auth (`coach_data_auth`)
Vereiste configuratie (handmatig in Supabase; de app voert zelf geen SQL uit):
- Tabel `public.coach_data_auth`: `user_id uuid` (FK `auth.users(id)`), `id text`, `payload jsonb`, `updated_at timestamptz`, primaire sleutel `(user_id, id)`, RLS aan.
- Drie policies voor `authenticated` (SELECT, INSERT, UPDATE), elk met `user_id = auth.uid()` (INSERT: `with check`). Geen DELETE- of publieke policies.
- Authentication → Providers: E-mail ingeschakeld. Bij "Confirm email" aan moet je na registratie eerst de bevestigingsmail volgen en daarna inloggen. Stel eventueel de Site URL in op de URL van de app.
- Alleen de publishable key staat in de browsercode; nooit `service_role`/secret key.

Werking: inloggen/registreren in Instellingen → Sync. De sessie (access/refresh token) staat in `localStorage` (`footballCoachAuthV1`), wordt automatisch ververst en bij elke sync tegen `/auth/v1/user` geverifieerd. `user_id` komt uitsluitend uit die sessie; de rij-id is vast (`football-coach-v2`). De Secret key blijft bestaan als **versleutelingssleutel** (AES-GCM, PBKDF2) en wordt nooit verstuurd; zonder dezelfde sleutel is cloudinhoud onleesbaar. Conflictcontrole: bestaat er al een andere cloudversie, dan wordt die lokaal bewaard (Cloudconflict downloaden) en alleen na bevestiging overschreven; updates gebruiken `updated_at` als optimistische check (geen treffer = conflict). Uitloggen wist alleen de sessie, nooit lokale gegevens.

Migratie vanaf `coach_data`: er is **geen automatische migratie** (die tabel was anoniem, met een id afgeleid van de Secret key). Stappen: (1) maak in de oude versie een back-up (Instellingen → Back-up downloaden) of gebruik het huidige apparaat met lokale data; (2) log in met je account; (3) kies Upload nu; er bestaat dan nog geen rij, dus er wordt niets overschreven. Op andere apparaten: inloggen + Download nu. Pas na controle kun je zelf beslissen wat met `coach_data` gebeurt.

Let op: kennisbank-bestanden (Storage-bucket `vc2`, upload/download) gebruiken nog de publishable key en de Secret key-map en zijn niet naar Auth gemigreerd.

Tests: `tests/app.test.js` gebruikt een gemockte `fetch`; er zijn **geen** echte Supabase-tests uitgevoerd.

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
