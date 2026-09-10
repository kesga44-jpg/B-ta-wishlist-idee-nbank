# Wishlist & Ideeënbank Beta

Dit is een **losse bèta-app** om widgets, grafieken en animaties te testen.

## Bestanden
- `index.html` — pagina-opbouw.
- `style.css` — layout, kleuren en animaties.
- `app.js` — interacties.
- `manifest.webmanifest` — PWA-instellingen.

## Zo vind je de uitleg in de code
Zoek in `style.css` en `app.js` op:
- `ANIMATIE`
- `APP-SPECIFIEKE DEMO`
- `GRAFIEK`
- `PROGRESS`

## Belangrijkste bouwtechnieken

### Kaarten laten binnenkomen
```css
@keyframes cardIn {
  from { opacity:0; transform:translateY(18px) scale(.985); }
  to { opacity:1; transform:none; }
}
```

### Progress-ring
```css
background: conic-gradient(var(--accent) calc(var(--p)*1%), #e6e9ef 0);
```
En JavaScript:
```js
ring.style.setProperty('--p',72);
```

### Grafiek tekenen
De lijn is een SVG `polyline`.
Met `stroke-dasharray` en `stroke-dashoffset` lijkt het alsof de lijn zichzelf tekent.

### Balk laten groeien
```js
bar.style.height='78%';
```
CSS `transition` maakt de beweging vloeiend.

### Confetti
`confetti(36)` maakt tijdelijke HTML-elementen die via `@keyframes fall` naar beneden vallen.

## Specifiek voor deze app
Deze app bevat een demo voor: **wishlist**.
Bekijk het HTML-blok in `index.html` en de bijbehorende JavaScript-code onder `APP-SPECIFIEKE DEMO'S`.

## Zelf aanpassen
Bovenaan `style.css`:
```css
--accent:#d19a20;
--accent2:#f0c95c;
```

## GitHub Pages
1. Maak een aparte testrepository.
2. Upload de bestanden uit deze map.
3. Settings → Pages.
4. Deploy from branch → `main` → root.
5. Open de URL op iPhone.
6. Via Safari kun je hem op het beginscherm zetten.

Gebruik deze bèta eerst om te bepalen welke onderdelen je echt wilt. Daarna kunnen gekozen onderdelen in je definitieve app worden geïntegreerd.
