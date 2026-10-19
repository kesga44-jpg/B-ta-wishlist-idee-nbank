const test=require('node:test'),assert=require('node:assert');
const {createApp}=require('./harness.js');
const V2='footballCoachDataV2',V1='footballCoachDataV1';
const starter=()=>JSON.parse(createApp().ls.data[V2]);

test('lokale opslag slaagt en schrijft V2',()=>{
  const a=createApp();a.t.state.team.name='Testteam';
  assert.notStrictEqual(a.t.save({render:false,sync:false}),false);
  assert.strictEqual(JSON.parse(a.ls.data[V2]).team.name,'Testteam');
});
test('mislukte lokale opslag geeft false + melding en laat oude opslag intact',()=>{
  const a=createApp(),before=a.ls.data[V2];
  a.ls.failWrites=true;a.t.state.team.name='Nieuw';
  assert.strictEqual(a.t.save({render:false,sync:false}),false);
  assert.strictEqual(a.ls.data[V2],before);
  assert.ok(a.toasts.some(m=>/Opslaan mislukt/.test(m)));
});
test('bestaande V2-data wordt geladen',()=>{
  const d=starter();d.team.name='Bestaand';
  const a=createApp({store:{[V2]:JSON.stringify(d)}});
  assert.strictEqual(a.t.state.team.name,'Bestaand');assert.strictEqual(a.t.storageLoadError,null);
});
test('V1-data wordt herkend en gekopieerd naar V2, V1 blijft staan',()=>{
  const d=starter();d.team.name='Oud V1';const raw=JSON.stringify(d);
  const a=createApp({store:{[V1]:raw}});
  assert.strictEqual(a.t.state.team.name,'Oud V1');
  assert.strictEqual(JSON.parse(a.ls.data[V2]).team.name,'Oud V1');
  assert.strictEqual(a.ls.data[V1],raw);
});
test('ongeldige opslag wordt niet overschreven en blokkeert opslaan',()=>{
  const a=createApp({store:{[V2]:'{kapot'}});
  assert.ok(a.t.storageLoadError);
  assert.strictEqual(a.t.save({render:false,sync:false}),false);
  assert.strictEqual(a.ls.data[V2],'{kapot');
});
test('validatie weigert dubbele id\'s en ongeldige structuur',()=>{
  const d=starter();d.players.push({...d.players[0]});
  assert.throws(()=>createApp().t.validateStateData(d),/Dubbel ID/);
  assert.throws(()=>createApp().t.validateStateData([]),/JSON-object/);
});
test('herstelpunt wordt bewaard bij overnemen van clouddata; falende opslag wijzigt state niet',()=>{
  const a=createApp(),remote=starter();remote.team.name='Cloud';
  a.t.persistRemoteCopy(remote);
  assert.strictEqual(a.t.state.team.name,'Cloud');
  assert.ok(JSON.parse(a.ls.data[a.t.RECOVERY_BACKUP_KEY]).raw);
  const b=createApp(),name=b.t.state.team.name;b.ls.failWrites=true;
  assert.throws(()=>b.t.persistRemoteCopy(remote));
  assert.strictEqual(b.t.state.team.name,name);
});
test('spelers met meerdere teams en aanwezigheid/selectie zijn gescheiden velden',()=>{
  const a=createApp(),p=a.t.state.players[0];
  assert.ok(Array.isArray(p.teamIds)&&p.teamIds.includes(p.primaryTeamId));
  a.t.state.matches.forEach(m=>{assert.ok(m.attendance&&typeof m.attendance==='object');assert.ok(Array.isArray(m.benchIds));assert.ok(m.lineup&&typeof m.lineup==='object')});
});

// Sync met gemockte fetch
function syncEnv(rows,{patchRows}={}){
  const a=createApp(),calls=[];
  a.sandbox.fetch=async(url,opt={})=>{calls.push({url,method:opt.method||'GET'});
    const m=opt.method||'GET';
    const body=m==='GET'?rows():(patchRows||[{id:'x'}]);
    return {ok:true,json:async()=>body,text:async()=>''}};
  return {a,calls};
}
const S={url:'https://example.invalid',key:'k',pass:'geheim'};
test('sync: cloud ontbreekt -> POST met ignore-duplicates, geen PATCH',async()=>{
  const {a,calls}=syncEnv(()=>[]);
  const id=await a.t.syncIdFromPass(S.pass);
  const ok=await a.t.writeCloudCopy(S,id,a.t.normalizedStateCopy(a.t.state),null);
  assert.strictEqual(ok,true);assert.deepStrictEqual(calls.map(c=>c.method),['POST']);
});
test('sync: PATCH zonder treffer (cloud intussen gewijzigd) = conflict, geen succes, cloudversie bewaard',async()=>{
  const a=createApp(),remote=a.t.normalizedStateCopy(a.t.state);remote.team.name='Andere';
  const payload=await a.t.encryptData(remote,S.pass);
  let patched=false;
  a.sandbox.fetch=async(u,o={})=>{const m=o.method||'GET';if(m==='PATCH'){patched=true;return {ok:true,json:async()=>[],text:async()=>''}}
    return {ok:true,json:async()=>[{payload,updated_at:'2026-01-01T00:00:00.000Z'}],text:async()=>''}};
  const id=await a.t.syncIdFromPass(S.pass),cloud=await a.t.fetchCloudCopy(S,id);
  const ok=await a.t.writeCloudCopy(S,id,a.t.normalizedStateCopy(a.t.state),cloud);
  assert.ok(patched);assert.strictEqual(ok,false);
  assert.strictEqual(JSON.parse(a.ls.data[a.t.CLOUD_CONFLICT_KEY]).data.team.name,'Andere');
});
test('sync: verschillende cloudversie wordt bewaard en niet overschreven zonder bevestiging',async()=>{
  const a=createApp({confirmAnswer:false}),remote=a.t.normalizedStateCopy(a.t.state);remote.team.name='Cloudnaam';
  const payload=await a.t.encryptData(remote,S.pass),methods=[];
  a.sandbox.fetch=async(u,o={})=>{methods.push(o.method||'GET');return {ok:true,json:async()=>[{payload,updated_at:'2026-01-01T00:00:00.000Z'}],text:async()=>''}};
  a.ls.data['footballCoachSyncV1']=JSON.stringify({pass:S.pass});
  await a.t.pushSync(false);
  assert.ok(!methods.includes('PATCH')&&!methods.includes('POST'));
  assert.ok(a.ls.data[a.t.CLOUD_CONFLICT_KEY]);
});
test('encryptie round-trip en verkeerde sleutel faalt',async()=>{
  const a=createApp(),p=await a.t.encryptData({a:1},'x');
  assert.deepStrictEqual(await a.t.decryptData(p,'x'),{a:1});
  await assert.rejects(()=>a.t.decryptData(p,'y'));
});

test('kennisbank: niet-doorzoekbare PDF wordt niet als doorzoekbaar behandeld en geeft geen treffers',()=>{
  const a=createApp(),idx=a.t.vc2Index();
  idx['scan.pdf']={fileName:'scan.pdf',indexedAt:'2026-01-01',pages:['',''],searchable:false};
  idx['tekst.pdf']={fileName:'tekst.pdf',indexedAt:'2026-01-01',pages:['Hoog drukzetten begint bij een pressing trigger na een slechte steunpass.']};
  assert.strictEqual(a.t.vc2IsSearchable(idx['scan.pdf']),false);
  assert.strictEqual(a.t.vc2IsSearchable(idx['tekst.pdf']),true);
  const hits=a.t.vc2Passages('drukzetten trigger');
  assert.ok(hits.length&&hits.every(h=>h.name==='tekst.pdf'&&h.page===1));
});
test('spelprincipe met nieuwe velden blijft valide en wordt bewaard',()=>{
  const a=createApp();a.t.state.gameModel.principles.push({id:'p1',name:'Hoog drukzetten',recognizableSituations:'x',commonMistakes:['te ver uit elkaar']});
  a.t.save({render:false,sync:false});
  const p=JSON.parse(a.ls.data['footballCoachDataV2']).gameModel.principles.find(x=>x.id==='p1');
  assert.deepStrictEqual(p.commonMistakes,['te ver uit elkaar']);
});

// ---- Fase 2 ----
const stdPrinciples=a=>a.t.state.gameModel.principles.filter(p=>p.standardKey);
test('standaardprincipes: 5 stuks, idempotent, geen koppelingen, bij herladen geen duplicaten',()=>{
  const a=createApp();assert.strictEqual(stdPrinciples(a).length,5);
  a.t.seedStandardPrinciples();a.t.seedStandardPrinciples();
  assert.strictEqual(stdPrinciples(a).length,5);
  assert.ok(stdPrinciples(a).every(p=>p.isStandardProposal&&!p.exerciseIds.length&&!p.trainingIds.length&&/standaardvoorstel/i.test(p.observation)));
  const b=createApp({store:{[V2]:a.ls.data[V2]}});assert.strictEqual(stdPrinciples(b).length,5);
});
test('standaardprincipes: bestaande principes blijven, bewerken/verwijderen blijft bewaard (geen herseed)',()=>{
  const d=starter();delete d.gameModel.standardPrinciplesVersion;d.gameModel.principles=[{id:'mijn',name:'Restverdediging',description:'eigen tekst'}];
  const a=createApp({store:{[V2]:JSON.stringify(d)}}),ps=a.t.state.gameModel.principles;
  assert.strictEqual(ps.filter(p=>p.name==='Restverdediging').length,1);
  assert.strictEqual(ps.find(p=>p.id==='mijn').description,'eigen tekst');
  assert.strictEqual(ps.length,5);
  const s=stdPrinciples(a)[0];s.name='Aangepast';a.t.state.gameModel.principles=ps.filter(p=>p.id!==stdPrinciples(a)[1].id);
  a.t.save({render:false,sync:false});
  const b=createApp({store:{[V2]:a.ls.data[V2]}});
  assert.strictEqual(b.t.state.gameModel.principles.length,4);assert.ok(b.t.state.gameModel.principles.some(p=>p.name==='Aangepast'));
});
const fixtureIndex=()=>({
  'a.pdf':{fileName:'Origineel A.pdf',fileType:'pdf',indexedAt:'2026-01-01',searchable:true,pages:['Intro tekst','Hoog druk zetten met looplijn en afschermen van de passlijn']},
  'b.fckb':{fileName:'B.fckb',fileType:'fckb',indexedAt:'2026-01-01',searchable:true,pages:['Hoog druk zetten bij terugspeelbal']},
  'scan.pdf':{fileName:'Scan.pdf',fileType:'pdf',indexedAt:'2026-01-01',searchable:false,pages:['','']}
});
test('zoeken met filters en bronverwijzing: paginanummer alleen bij PDF, niet-doorzoekbaar nooit in resultaten',()=>{
  const a=createApp();Object.assign(a.t.vc2Index(),fixtureIndex());
  const all=a.t.vc2Passages('druk looplijn',10);
  assert.ok(all.some(h=>h.name==='Origineel A.pdf'&&h.page===2&&h.type==='pdf'));
  assert.ok(all.some(h=>h.name==='B.fckb'&&h.page===null));
  assert.ok(!all.some(h=>h.name==='Scan.pdf'));
  assert.ok(a.t.vc2Passages('druk',10,{type:'fckb'}).every(h=>h.type==='fckb'));
  assert.ok(a.t.vc2Passages('druk',10,{type:'pdf'}).every(h=>h.type==='pdf'));
  assert.strictEqual(a.t.vc2Passages('druk',10,{searchable:'no'}).length,0);
});
test('niet-doorzoekbare documenten: filter en label',()=>{
  const a=createApp(),idx=fixtureIndex();
  assert.strictEqual(a.t.vc2IsSearchable(idx['scan.pdf']),false);
  assert.strictEqual(a.t.vc2FileMatches('scan.pdf',idx['scan.pdf'],{searchable:'yes'}),false);
  assert.strictEqual(a.t.vc2FileMatches('scan.pdf',idx['scan.pdf'],{searchable:'no'}),true);
  assert.strictEqual(a.t.vc2FileMatches('b.fckb',idx['b.fckb'],{type:'pdf'}),false);
});
const src={type:'vc2',file:'a.pdf',fileName:'Origineel A.pdf',page:2,excerpt:'Hoog druk zetten'};
test('oefening aan training toevoegen met bronverwijzing; dubbele toevoeging voorkomen',()=>{
  const a=createApp(),t=a.t.state.trainings[0],n=a.t.state.exercises.length,before=t.planItems.length;
  const r=a.t.addExerciseToTraining(t.id,{name:'Druk zetten',duration:12,description:'tekst',source:src});
  assert.ok(r.ok);assert.strictEqual(a.t.state.exercises.length,n+1);assert.strictEqual(t.planItems.length,before+1);
  assert.deepStrictEqual(r.exercise.source,src);assert.ok(t.exerciseIds.includes(r.exercise.id));
  const r2=a.t.addExerciseToTraining(t.id,{name:'Druk zetten',source:src});
  assert.ok(!r2.ok&&r2.duplicate);assert.strictEqual(a.t.state.exercises.length,n+1);assert.strictEqual(t.planItems.length,before+1);
  assert.ok(!a.t.addExerciseToTraining(t.id,{name:'  '}).ok);
  assert.ok(JSON.parse(a.ls.data[V2]).exercises.some(e=>e.source&&e.source.file==='a.pdf'));
});
test('mislukte opslag bij toevoegen: duidelijke fout en state teruggedraaid',()=>{
  const a=createApp(),t=a.t.state.trainings[0],n=a.t.state.exercises.length,before=t.planItems.length;
  a.ls.failWrites=true;
  const r=a.t.addExerciseToTraining(t.id,{name:'X',source:src});
  assert.ok(!r.ok&&/mislukt/.test(r.error));
  assert.strictEqual(a.t.state.exercises.length,n);assert.strictEqual(t.planItems.length,before);
  assert.ok(a.toasts.some(m=>/Opslaan mislukt/.test(m)));
});
