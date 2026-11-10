const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawnSync, spawn } = require('node:child_process');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const root = path.resolve(__dirname, '..');
const bin = process.env.QUIZ_TEST_PG_BIN;
if (!bin || !process.env.QUIZ_TEST_POSTGREST) throw new Error('Defina QUIZ_TEST_PG_BIN e QUIZ_TEST_POSTGREST com os binários locais de teste.');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const local = (file) => fs.readFileSync(path.join(root, 'supabase/tests/fixtures', file), 'utf8');
const migration = 'supabase/migrations/20261107040000_validate_module_quiz_answer.sql';
const rollout = 'supabase/rollout/module-01-quiz/';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const user = (n) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;

function command(name, args) {
  const result = spawnSync(path.join(bin,name+'.exe'), args, { windowsHide:true, stdio:'ignore', encoding:'utf8', timeout:30000 });
  if(result.error || result.status !== 0) throw new Error(`${name}: ${result.error?.message ?? result.stderr ?? result.stdout}`);
}

(async () => {
  const listener = net.createServer();
  await new Promise((resolve,reject) => listener.once('error',reject).listen(0,'127.0.0.1',resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const cluster = fs.mkdtempSync(path.join(process.env.QUIZ_TEST_ARTIFACT_DIR || require('node:os').tmpdir(),'mr-quiz-pg-'));
  let started = false;
  let restProcess;
  let gateway;
  const clients = [];
  const connect = async () => {
    const c = new Client({host:'127.0.0.1',port,user:'postgres',database:'postgres',connectionTimeoutMillis:5000});
    await c.connect(); clients.push(c);
    await c.query("set statement_timeout='8s'");
    return c;
  };
  try {
    command('initdb',['-D',cluster,'-U','postgres','-A','trust','--no-locale','-E','UTF8']);
    started = true;
    command('pg_ctl',['-D',cluster,'-l',path.join(cluster,'server.log'),'-o',`-h 127.0.0.1 -p ${port} -c max_connections=12 -c shared_buffers=16MB`,'-w','-t','20','start']);
    const db = await connect();
    console.log('POSTGRES:',(await db.query('show server_version')).rows[0].server_version);
    await db.query(local('quiz-bootstrap.sql'));
    for(const f of ['20261002113812_learning_missions.sql','20261002122504_quiz_attempt_locks.sql','20261106190000_validate_profile_completion_mission.sql']) await db.query(read('supabase/migrations/'+f));
    for(let i=501;i<=515;i++) await db.query('insert into auth.users(id) values($1)',[user(i)]);
    await db.query('insert into public.access_levels(id,slug,name) values($1,$2,$3)',[user(601),'test','Teste']);
    for(let i=501;i<=515;i++) await db.query('insert into public.entitlements(user_id,access_level_id,status) values($1,$2,$3)',[user(i),user(601),'active']);
    await db.query("insert into public.learning_mission_completions(user_id,mission_key,xp_earned) values($1,'quiz_module_01_complete',150)",[user(501)]);
    await db.query("insert into public.quiz_attempt_locks(user_id,quiz_key,locked_until) values($1,'module_01_question_01',now()+interval '1 hour'),($2,'module_01_question_01',now()-interval '1 hour')",[user(501),user(502)]);
    const snapshot = async () => JSON.stringify((await db.query(`select
      (select jsonb_agg(to_jsonb(t) order by user_id,mission_key) from public.learning_mission_completions t) as xp,
      (select jsonb_agg(to_jsonb(t) order by id) from public.quiz_attempt_locks t) as locks`)).rows[0]);
    const before = await snapshot();
    await db.query(read(migration));
    assert.equal(await snapshot(),before);
    const session = async (c,id) => { await c.query('begin'); await c.query('set local role authenticated'); await c.query("select set_config('request.jwt.claim.sub',$1,true)",[id]); };
    const rpc = (c,index,finalize=true) => c.query('select * from public.submit_module_01_quiz_answer($1::smallint,$2::boolean)',[index,finalize]);
    await session(db,user(502));
    assert.equal((await db.query("select * from public.complete_learning_mission('quiz_module_01_complete')")).rows[0].xp_earned,150);
    await db.query('commit');
    await session(db,user(503));
    assert.equal((await rpc(db,1)).rows[0].newly_completed,true);
    await db.query('commit');
    const expanded = await snapshot();
    await db.query(read(rollout+'contract.sql'));
    assert.equal(await snapshot(),expanded);
    await session(db,user(511));
    assert.equal((await rpc(db,1)).rows[0].newly_completed,true);
    await db.query('commit');
    await session(db,user(513));
    assert.equal((await rpc(db,0,false)).rows[0].attempt_recorded,true);
    await db.query('commit');
    const contracted=await snapshot();
    await db.query(read(rollout+'rollback-contract.sql'));
    assert.equal(await snapshot(),contracted);
    await session(db,user(504));
    assert.equal((await db.query("select * from public.complete_learning_mission('quiz_module_01_complete')")).rows[0].xp_earned,150);
    await db.query("insert into public.quiz_attempt_locks(user_id,quiz_key,locked_until) values(auth.uid(),'module_01_question_01',now()+interval '1 hour')");
    await db.query('savepoint cross_account');
    await assert.rejects(db.query("insert into public.quiz_attempt_locks(user_id,quiz_key,locked_until) values($1,'module_01_question_01',now())",[user(501)]),e=>e.code==='42501');
    await db.query('rollback to savepoint cross_account');
    await db.query('commit');
    const recovered = await snapshot();
    await db.query(read(rollout+'contract.sql'));
    assert.equal(await snapshot(),recovered);
    console.log('OK: baseline → expand → legado/novo → contract → rollback → contract; dados preservados integralmente.');
    await db.query(read('supabase/tests/quiz_mission_security.sql'));
    await db.query(local('quiz-boundaries.sql'));
    console.log('OK: segurança e isolamento no PostgreSQL nativo.');

    const a=await connect(), b=await connect(), observer=await connect();
    const apid=(await a.query('select pg_backend_pid() as pid')).rows[0].pid;
    const bpid=(await b.query('select pg_backend_pid() as pid')).rows[0].pid;
    assert.notEqual(apid,bpid);
    async function race(id,first,second,rollback=false) {
      await session(a,id); await session(b,id);
      const ar=(await rpc(a,first)).rows[0];
      const pending=rpc(b,second);
      pending.catch(()=>{});
      let blocked=false;
      for(let i=0;i<60;i++) {
        const pids=(await observer.query('select pg_blocking_pids($1) as pids',[bpid])).rows[0].pids;
        if(pids.includes(apid)) { blocked=true; break; }
        await sleep(25);
      }
      assert.ok(blocked,'Segunda sessão deveria aguardar a primeira no banco');
      await a.query(rollback?'rollback':'commit');
      const br=(await pending).rows[0]; await b.query('commit');
      return {ar,br};
    }
    let r=await race(user(505),1,1);
    assert.equal(r.ar.newly_completed,true); assert.equal(r.br.newly_completed,false);
    assert.equal((await db.query('select count(*)::integer as n from public.learning_mission_completions where user_id=$1',[user(505)])).rows[0].n,1);
    assert.equal((await db.query('select sum(xp_earned)::integer as xp from public.learning_mission_completions where user_id=$1',[user(505)])).rows[0].xp,150);
    console.log('OK: duas finalizações concorrentes, um único prêmio de 150 XP.');
    r=await race(user(506),0,1);
    assert.equal(r.ar.attempt_recorded,true); assert.equal(r.br.correct,false); assert.equal(r.br.xp_earned,null);
    assert.equal((await db.query('select count(*)::integer as n from public.learning_mission_completions where user_id=$1',[user(506)])).rows[0].n,0);
    console.log('OK: resposta incorreta impede conclusão correta concorrente.');
    r=await race(user(507),0,0);
    assert.equal(r.br.attempt_recorded,false);
    assert.equal((await db.query('select count(*)::integer as n from public.quiz_attempt_locks where user_id=$1',[user(507)])).rows[0].n,1);
    console.log('OK: respostas incorretas concorrentes geram um único bloqueio.');
    r=await race(user(508),0,1,true);
    assert.equal(r.br.correct,true); assert.equal(r.br.newly_completed,true);
    console.log('OK: rollback da primeira tentativa libera a segunda sem bloqueio fantasma.');
    await session(a,user(509)); await rpc(a,0);
    await session(b,user(510)); assert.equal((await rpc(b,1)).rows[0].correct,true);
    await b.query('commit'); await a.query('rollback');
    console.log('OK: bloqueio de uma conta não bloqueia a outra.');
    console.log('PASSOU: concorrência com backends distintos observada por pg_blocking_pids.');

    await db.query('create role authenticator noinherit login; grant anon, authenticated to authenticator');
    await db.query('delete from public.entitlements where user_id=$1',[user(515)]);
    const reserve = net.createServer();
    await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));
    const restPort=reserve.address().port;
    await new Promise(resolve=>reserve.close(resolve));
    const secret=crypto.randomBytes(48).toString('base64url');
    let restLog='';
    restProcess=spawn(process.env.QUIZ_TEST_POSTGREST,['+RTS','-N1','-RTS'],{
      windowsHide:true,
      env:{...Object.fromEntries(Object.entries(process.env).filter(([name])=>/^(SystemRoot|WINDIR|TEMP|TMP|APPDATA|LOCALAPPDATA|USERPROFILE|ComSpec|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i.test(name))),PATH:bin+';'+path.join(process.env.SystemRoot,'System32'),
        PGRST_DB_URI:`postgresql://authenticator@127.0.0.1:${port}/postgres?gssencmode=disable&sslmode=disable`,
        PGRST_DB_SCHEMAS:'public',PGRST_DB_ANON_ROLE:'anon',PGRST_JWT_SECRET:secret,
        PGRST_SERVER_HOST:'127.0.0.1',PGRST_SERVER_PORT:String(restPort),PGRST_DB_POOL:'1',PGRST_DB_CHANNEL_ENABLED:'false'},
      stdio:['ignore','pipe','pipe']
    });
    restProcess.stdout.on('data',c=>{restLog=(restLog+c).slice(-4000)});
    restProcess.stderr.on('data',c=>{restLog=(restLog+c).slice(-4000)});
    let ready=false;
    for(let i=0;i<100;i++) {
      if(restProcess.exitCode!==null) throw new Error(`PostgREST encerrou (${restProcess.exitCode}, ${restProcess.signalCode}): `+restLog);
      try {const response=await fetch(`http://127.0.0.1:${restPort}/`,{signal:AbortSignal.timeout(1000)}); if(response.ok) {ready=true;break;}} catch {}
      await sleep(50);
    }
    assert.ok(ready,'PostgREST deveria iniciar: '+restLog);
    gateway=http.createServer((req,res)=>{
      if(!req.url.startsWith('/rest/v1/')) {res.writeHead(404);res.end();return;}
      const forwarded=http.request({hostname:'127.0.0.1',port:restPort,path:req.url.slice('/rest/v1'.length),method:req.method,headers:req.headers},upstream=>{
        res.writeHead(upstream.statusCode,upstream.headers);upstream.pipe(res);
      });
      forwarded.on('error',()=>{res.writeHead(502);res.end();});req.pipe(forwarded);
    });
    await new Promise(resolve=>gateway.listen(0,'127.0.0.1',resolve));
    const gatewayUrl=`http://127.0.0.1:${gateway.address().port}`;
    const token=(id,signingSecret=secret,lifetime=120)=>{
      const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
      const body=encode({alg:'HS256',typ:'JWT'})+'.'+encode({...(id?{sub:id}:{}),role:id?'authenticated':'anon',exp:Math.floor(Date.now()/1000)+lifetime});
      return body+'.'+crypto.createHmac('sha256',signingSecret).update(body).digest('base64url');
    };
    const sdk=(id,signingSecret,lifetime)=>createClient(gatewayUrl,'dummy-test-key',{
      accessToken:async()=>token(id,signingSecret,lifetime),
      global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})},
      auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
    });
    const paid=sdk(user(512));
    let result=await paid.rpc('submit_module_01_quiz_answer',{p_selected_index:1,p_finalize:false});
    assert.equal(result.error,null);assert.equal(result.data[0].correct,true);assert.equal(result.data[0].xp_earned,null);
    result=await paid.rpc('submit_module_01_quiz_answer',{p_selected_index:1,p_finalize:true});
    assert.equal(result.error,null);assert.equal(result.data[0].xp_earned,150);assert.equal(result.data[0].newly_completed,true);
    result=await paid.rpc('submit_module_01_quiz_answer',{p_selected_index:1,p_finalize:true});
    assert.equal(result.error,null);assert.equal(result.data[0].newly_completed,false);
    const wrong=sdk(user(514));
    result=await wrong.rpc('submit_module_01_quiz_answer',{p_selected_index:0,p_finalize:false});
    assert.equal(result.error,null);assert.equal(result.data[0].attempt_recorded,true);
    result=await wrong.rpc('submit_module_01_quiz_answer',{p_selected_index:1,p_finalize:true});
    assert.equal(result.error,null);assert.equal(result.data[0].correct,false);
    result=await sdk(user(515)).rpc('submit_module_01_quiz_answer',{p_selected_index:1,p_finalize:true});
    assert.ok(result.error);assert.equal(result.error.message,'course_access_required');
    result=await sdk(null).rpc('submit_module_01_quiz_answer',{p_selected_index:1,p_finalize:true});
    assert.ok(result.error);assert.equal(result.error.code,'42501');
    result=await sdk(user(512),'invalid-test-signature').rpc('submit_module_01_quiz_answer',{p_selected_index:1,p_finalize:true});
    assert.equal(result.status,401);
    result=await sdk(user(512),secret,-60).rpc('submit_module_01_quiz_answer',{p_selected_index:1,p_finalize:true});
    assert.equal(result.status,401);
    const isolated=await sdk(user(513)).from('learning_mission_completions').select('*').eq('user_id',user(512));
    assert.equal(isolated.error,null);assert.deepEqual(isolated.data,[]);
    console.log('OK: Supabase JS → HTTP → PostgREST → JWT → RPC/RLS com contas fictícias.');
    console.log('OK: conta com acesso, sem acesso, anônimo, assinatura inválida, bloqueio e XP único pela API.');
  } finally {
    if(gateway) await new Promise(resolve=>gateway.close(resolve));
    if(restProcess && restProcess.exitCode===null) {
      const stopped=new Promise(resolve=>restProcess.once('exit',resolve));
      restProcess.kill(); await stopped;
    }
    await Promise.allSettled(clients.map(c=>c.end()));
    if(started) {
      try {command('pg_ctl',['-D',cluster,'-m','fast','-w','-t','15','stop']);}
      catch(e) {console.error('Falha ao encerrar cluster de teste:',e.message);process.exitCode=1;}
    }
    console.log('Cluster de teste encerrado:',cluster);
  }
})().catch(e=>{console.error('FALHOU:',e.message);process.exitCode=1;});
