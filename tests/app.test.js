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
