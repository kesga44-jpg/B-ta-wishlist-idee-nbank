
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];

/* ANIMATIE 01 — PROGRESS RING
   CSS tekent met conic-gradient.
   JavaScript zet --p van 0 naar het gewenste percentage. */
function rings(){
  $$('.ring').forEach((r,i)=>{r.style.setProperty('--p',0);setTimeout(()=>r.style.setProperty('--p',r.dataset.progress||72),100+i*100)})
}
rings();

/* ANIMATIE 02 — GRAFIEK HERSTARTEN
   CSS tekent de SVG-lijn. Door de SVG te klonen start de CSS-animatie opnieuw. */
function replayChart(){
  const s=$('.chart'); if(!s)return; const c=s.cloneNode(true); s.replaceWith(c)
}
$('#replayChart')?.addEventListener('click',replayChart);

/* ANIMATIE 03 — CONFETTI
   Alleen bedoeld voor zeldzame succesmomenten. */
function confetti(n=36){
  const colors=['#ffcc4d','#ff6c78','#5cc0ff','#826cff','#55c88a'];
  for(let i=0;i<n;i++){
    const p=document.createElement('i'); p.className='confetti';
    p.style.left=Math.random()*100+'vw'; p.style.background=colors[i%colors.length];
    p.style.setProperty('--x',(Math.random()*220-110)+'px');
    p.style.setProperty('--r',(Math.random()*900-450)+'deg');
    p.style.setProperty('--fall',(1.3+Math.random()*1.4)+'s');
    document.body.appendChild(p); setTimeout(()=>p.remove(),3000)
  }
}
$('#confettiBtn')?.addEventListener('click',()=>{confetti();toast('Confetti afgespeeld')});

/* ANIMATIE 04 — KAARTEN OPNIEUW */
$('#cardsBtn')?.addEventListener('click',()=>{$$('.card').forEach(c=>{c.style.animation='none';void c.offsetWidth;c.style.animation=''});toast('Kaarten opnieuw')});
$('#ringsBtn')?.addEventListener('click',()=>{rings();toast('Ringen opnieuw')});

/* APP-SPECIFIEKE DEMO'S */
$$('#freezer .portion').forEach(p=>p.addEventListener('click',()=>p.classList.toggle('used')));

function playSport(){
  $$('#sportBars .bar').forEach((b,i)=>{b.style.height='10%';setTimeout(()=>b.style.height=b.dataset.h+'%',100+i*80)})
}
$('#sportBtn')?.addEventListener('click',playSport); playSport();

$('#carBtn')?.addEventListener('click',()=>{const n=$('#needle');if(n){n.style.left='72%';setTimeout(()=>n.style.left='38%',900)}});

function scores(){
  $$('.scorebar i').forEach((b,i)=>{b.style.width='0';setTimeout(()=>b.style.width=b.dataset.score+'%',100+i*90)})
}
$('#decisionBtn')?.addEventListener('click',scores); scores();

$$('.heart').forEach(h=>h.addEventListener('click',()=>{h.classList.toggle('on');h.textContent=h.classList.contains('on')?'♥':'♡'}));

$$('.hubapp').forEach(h=>h.addEventListener('click',()=>toast(h.querySelector('b').textContent+' demo geopend')));

let tt;
function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),1300)}
