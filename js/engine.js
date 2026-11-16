/* RUSSIA: LIFE & BEYOND — Canvas game engine. Load after scenes.js. */
'use strict';
var GAME_ENGINE = (function () {
  var canvas,ctx,last=0,raf=0,keys={},touch={x:0,y:0,run:false},dpr=1;
  var saveKey='russia-life-beyond-save-v1',scene=null,near=null,elapsed=0,toast='';
  function clamp(v,a,b){return v<a?a:v>b?b:v;}
  var state=null,camera={x:0,y:0},paused=false,weatherInfo={kind:'clear',temp:null,wind:.15,cloud:.2,source:'climate'},weatherAt=0,weatherPlace='',weatherPending=false;
  var names=['energy','hunger','thirst','hygiene','bladder','mood','social'];
  function fresh(){
    return {date:'2026-11-16',minutes:480,scene:'msk_flat',x:13*32,y:11*32,dir:'down',anim:'idle',money:4500,
      needs:{energy:92,hunger:88,thirst:90,hygiene:85,bladder:5,mood:80,social:55},utcDate:'2026-11-16',utcMinutes:300,
      inventory:{bread:2,kefir:1,water:2,tea:1},outfit:'everyday',pet:null,disc:{},visited:{msk:true},
      species:{},stats:{meals:0,drinks:0,showers:0,changes:0,talks:0,exhibits:0,runM:0,hikeM:0,swimM:0,petFeeds:0,petPlays:0,camps:0,distance:0},
      quests:{},settings:{weather:true,sound:false},born:Date.now()};
  }
  function shiftDate(date,days){return new Date(Date.parse(date+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);}
  function syncLocalClock(){if(!state)return;var tz=scene&&scene.tz!==undefined?scene.tz:3,total=state.utcMinutes+tz*60,day=Math.floor(total/1440);state.minutes=((total%1440)+1440)%1440;state.date=shiftDate(state.utcDate,day);}
  function normalize(saved){var base=fresh(),s=saved||{};Object.assign(base,s);base.needs=Object.assign({},fresh().needs,s.needs||{});base.stats=Object.assign({},fresh().stats,s.stats||{});base.inventory=Object.assign({},fresh().inventory,s.inventory||{});base.disc=Object.assign({},s.disc||{});base.visited=Object.assign({},s.visited||{});base.species=Object.assign({},s.species||{});base.quests=Object.assign({},s.quests||{});base.settings=Object.assign({},fresh().settings,s.settings||{});var oldScene=SCENE_CATALOG.build(base.scene)||SCENE_CATALOG.build('msk_flat');if(!Number.isFinite(base.utcMinutes)||!base.utcDate){var tz=oldScene&&oldScene.tz||3,local=Number(base.minutes)||480,utc=local-tz*60,shift=Math.floor(utc/1440);base.utcMinutes=((utc%1440)+1440)%1440;base.utcDate=shiftDate(base.date||'2026-11-16',shift);}return base;}
  function save(){try{state.updated=Date.now();localStorage.setItem(saveKey,JSON.stringify(state));return true;}catch(e){return false;}}
  function load(){try{var s=JSON.parse(localStorage.getItem(saveKey)||'null');return s&&s.scene?s:null;}catch(e){return null;}}
  function setScene(id,x,y){
    var s=SCENE_CATALOG.build(id);if(!s){notify('That area is not available yet.');return false;}
    scene=s;state.scene=id;state.x=x===undefined?13*32:x;state.y=y===undefined?12*32:y;
    state.visited=state.visited||{};state.visited[s.placeId]=true;near=null;syncLocalClock();refreshWeather();save();return true;
  }
  function notify(s){toast=String(s);if(window.GAME_UI)GAME_UI.toast(toast);}
  function fallbackWeather(){var p=SCENE_CATALOG.places[scene.placeId]||{},m=new Date(state.date).getMonth(),temp=p.clim?p.clim[m]:0,seed=String(state.date+scene.placeId).split('').reduce(function(a,ch){return(a*31+ch.charCodeAt(0))>>>0;},7)%100,k= temp<0?(seed<40?'snow':seed<58?'cloudy':seed<65?'fog':'clear'):(seed<16?'rain':seed<34?'cloudy':seed<39?'fog':seed<43?'wind':'clear');weatherInfo={kind:k,temp:temp,wind:k==='storm'?.85:k==='wind'?.75:.18,cloud:k==='clear'?.12:.55,source:'monthly climate fallback'};}
  function refreshWeather(){
    if(!scene||!state)return;
    fallbackWeather();
    if(!state.settings.weather||typeof fetch!=='function'||(typeof navigator!=='undefined'&&!navigator.onLine))return;
    var requestedPlace=scene.placeId;
    if(weatherPending||(weatherPlace===requestedPlace&&Date.now()-weatherAt<600000))return;
    var p=SCENE_CATALOG.places[requestedPlace];if(!p)return;
    weatherPending=true;weatherPlace=requestedPlace;
    var url='https://api.open-meteo.com/v1/forecast?latitude='+p.lat+'&longitude='+p.lng+'&current=temperature_2m,precipitation,weather_code,cloud_cover,wind_speed_10m&timezone=auto';
    fetch(url).then(function(r){if(!r.ok)throw new Error('Weather unavailable');return r.json();}).then(function(data){
      var v=data.current;if(!v)return;
      var code=+v.weather_code,k=code===0?'clear':code<=3?'cloudy':code===45||code===48?'fog':code>=95?'storm':code>=71?'snow':code>=51?'rain':(v.wind_speed_10m||0)>35?'wind':'clear';
      if(scene&&scene.placeId===requestedPlace)weatherInfo={kind:k,temp:+v.temperature_2m,wind:clamp((+v.wind_speed_10m||0)/65,0,1),cloud:clamp((+v.cloud_cover||0)/100,0,1),source:'Open-Meteo'};
      weatherAt=Date.now();
    }).catch(function(){weatherAt=Date.now();}).finally(function(){weatherPending=false;if(scene&&scene.placeId!==requestedPlace)refreshWeather();});
  }
  function addNeed(k,v){state.needs[k]=clamp((state.needs[k]||0)+v,0,100);}
  function enterNew(){state=fresh();setScene('msk_flat',13*32,11*32);notify('Доброе утро! Your Moscow morning begins.');}
  function start(){paused=true;canvas=document.getElementById('game');ctx=canvas.getContext('2d');resize();window.addEventListener('resize',resize);
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
    var s=load();if(s){state=normalize(s);setScene(state.scene,state.x,state.y);}else enterNew();
    last=performance.now();if(!raf)raf=requestAnimationFrame(loop);return state;
  }
  function resize(){if(!canvas)return;dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';}
  function keydown(e){var k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].indexOf(k)>=0)e.preventDefault();keys[k]=true;
    if(k==='e'||k===' ')use();if(k==='m'&&window.GAME_UI)GAME_UI.openMap();if(k==='j'&&window.GAME_UI)GAME_UI.openJournal();if(k==='i'&&window.GAME_UI)GAME_UI.openBag();if(k==='escape'&&window.GAME_UI)GAME_UI.menu();}
  function keyup(e){keys[e.key.toLowerCase()]=false;}
  function axis(){return {x:(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+touch.x,y:(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+touch.y};}
  function solidAt(px,py){
    var tx=Math.floor(px/32),ty=Math.floor(py/32),row=scene.tiles[ty]||'',ch=row[tx]||'W';
    if('W~r'.indexOf(ch)>=0)return true;
    for(var i=0;i<scene.objects.length;i++){
      var o=scene.objects[i];
      if(o.t==='door'||(scene.inside&&o.t==='bld'))continue;
      if(['bld','tree','fridge','stove','wardrobe','sofa','table','bench','bed'].indexOf(o.t)<0)continue;
      var w=(o.w||1)*32,h=(o.h||1)*32;
      if(px>o.x*32&&px<(o.x*32+w)&&py>o.y*32&&py<(o.y*32+h))return true;
    }
    return false;
  }
  function nearest(){
    var best=null,bd=58;
    (scene.interact||[]).concat(scene.objects.filter(function(o){return o.action||o.doorTo||o.t==='npc';})).forEach(function(o){
      var d=Math.hypot((o.x+.5)*32-state.x,(o.y+.5)*32-state.y);if(d<bd){bd=d;best=o;}
    });return best;
  }
  function use(){
    if(!state||paused)return;var o=nearest();if(!o){notify('Nothing nearby to interact with.');return;}
    if(o.doorTo){var target=o.doorTo;setScene(target);notify('You entered '+scene.name+'.');discover();return;}
    var a=o.action;
    if(a==='door'){setScene(o.doorTo);return;}
    if(a==='sleep'){addNeed('energy',55);addNeed('mood',8);advance(480);state.stats.camps+=scene.kind==='camp'?1:0;notify('You rested and feel refreshed.');}
    else if(a==='rest'){addNeed('energy',12);addNeed('mood',4);advance(20);notify('A quiet rest.');}
    else if(a==='fridge'||a==='shop'){if(window.GAME_UI)GAME_UI.shop();}
    else if(a==='eat'){consume('bread');}
    else if(a==='drink'){consume('water');}
    else if(a==='cook'){if(state.inventory.pelmeni||state.inventory.salmon){var key=state.inventory.pelmeni?'pelmeni':'salmon';state.inventory[key]--;addNeed('hunger',48);addNeed('mood',6);state.stats.meals++;advance(25);notify('A warm meal is ready.');}else notify('You need food ingredients first.');}
    else if(a==='shower'){addNeed('hygiene',75);state.stats.showers++;advance(15);notify('You feel clean and ready for the day.');}
    else if(a==='restroom'){addNeed('bladder',-85);advance(5);notify('You feel comfortable again.');}
    else if(a==='wardrobe'){if(window.GAME_UI)GAME_UI.clothes();}
    else if(a==='read'||a==='museum'){state.stats.exhibits++;addNeed('mood',5);advance(18);notify('You read an exhibit and learned something new.');}
    else if(a==='chat'||o.t==='npc'){state.stats.talks++;addNeed('social',17);addNeed('mood',4);advance(6);notify('Добрый день! Hello! Nice to meet you.');}
    else if(a==='adopt'){if(!state.pet){state.pet={kind:'dog',name:'Laika',care:85};notify('Laika joined your travels.');}else notify('Your pet is already with you.');}
    else if(a==='feed'){if(state.pet&&state.inventory.petfood){state.inventory.petfood--;state.pet.care=100;state.stats.petFeeds++;notify('Your pet enjoyed its food.');}else notify('You need pet food.');}
    else if(a==='play'){if(state.pet){state.pet.care=clamp(state.pet.care+5,0,100);state.stats.petPlays++;addNeed('mood',8);notify('A happy moment with your pet.');}}
    else if(a==='swim'){var tile=scene.tiles[Math.floor(state.y/32)]||'';if(tile[Math.floor(state.x/32)]!=='w')notify('Swimming is allowed only in the marked swimming area.');else if(scene.placeId==='bkl'&&[0,1,2,3].indexOf(new Date(state.date).getMonth())>=0)notify('The lake is frozen in winter. Swimming is closed.');else{advance(10);addNeed('hygiene',-3);addNeed('energy',-4);state.stats.swimM+=10;notify('You enjoyed a short swim in the designated area.');}}
    else if(a==='hike'){if((scene.tiles[Math.floor(state.y/32)]||'')[Math.floor(state.x/32)]!=='d')notify('Stay on the marked trail to hike.');else{state.stats.hikeM+=120;addNeed('energy',-5);advance(15);notify('You hiked along the marked trail.');}}
    else if(a==='work'){state.money+=500;advance(120);addNeed('energy',-12);notify('You completed a short shift and earned ₽500.');}
    else if(a==='fish'){notify('You watched the water and noted the local birdlife.');}
    else if(a==='info'){if(window.GAME_UI)GAME_UI.openMap();}
    else notify('You look around. The place is peaceful.');
    save();discover();checkQuests();
  }
  function consume(k){if((state.inventory[k]||0)<1){notify('You do not have '+k+'. Visit a shop.');return;}state.inventory[k]--;if(k==='water'){addNeed('thirst',38);state.stats.drinks++;}else{addNeed('hunger',24);state.stats.meals++;}advance(8);notify('You enjoyed '+k+'.');}
  function advance(minutes){var total=state.utcMinutes+minutes,days=Math.floor(total/1440);state.utcMinutes=((total%1440)+1440)%1440;state.utcDate=shiftDate(state.utcDate,days);syncLocalClock();}
  function unlockDiscovery(k){var d=typeof DISC!=='undefined'?DISC[k]:null;if(!d||state.disc[k])return false;state.disc[k]=true;notify('DISCOVERY UNLOCKED — '+d.name);if(window.GAME_UI)GAME_UI.discovery(k);save();return true;}
  function discover(){var allowed={msk_square:['kremlin'],spb_hermitage:['hermitage'],spb_strelka:['hermitage'],kzn_kremlin:['kazan','volga'],bkl_village:['baikal'],bkl_museum:['baikal'],bkl_beach:['baikal'],bkl_trail:['taiga'],elb_village:['elbrus'],elb_trail:['elbrus'],kam_bay:['kamchatka'],kam_tundra:['kamchatka'],soc_promenade:['sochi']};(allowed[scene.id]||[]).forEach(unlockDiscovery);}
  function discoverNear(lat,lng,radiusKm){if(typeof DISC==='undefined')return;var limit=Number(radiusKm)||35;Object.keys(DISC).forEach(function(k){var d=DISC[k],pts=d.pts||[[d.lat,d.lng]],found=pts.some(function(p){var dy=(p[0]-lat)*111.32,dx=(p[1]-lng)*111.32*Math.cos(lat*Math.PI/180);return Math.hypot(dx,dy)<=Math.min(limit,Number(d.r)||limit);});if(found)unlockDiscovery(k);});}
  function spotWildlife(){if(typeof SPECIES==='undefined')return;var map={squirrel:'squirrel',crow:'crow',gull:'mgull',seal:'nerpa',deer:'roe',bear:'bear',tur:'tur',dolphin:'dolphin'};(scene.objects||[]).forEach(function(o){var k=map[o.t]||o.species;if(!k||!SPECIES[k]||state.species[k])return;var d=Math.hypot((o.x+.5)*32-state.x,(o.y+.5)*32-state.y);if(d<88){state.species[k]=true;notify('Field journal: '+SPECIES[k].name+' ('+SPECIES[k].sci+').');}});}
  function checkQuests(){if(typeof QUESTS==='undefined')return;QUESTS.forEach(function(q){if(state.quests[q.id])return;var done=q.steps.every(function(step){try{return !!step[1](state);}catch(e){return false;}});if(done){state.quests[q.id]=true;state.money+=q.r;notify('MISSION COMPLETE — '+q.t+' · ₽'+q.r);}});}
  function petAction(action){if(!state.pet){notify('Adopt a pet first.');return;}if(action==='feed'){if(!state.inventory.petfood){notify('Buy pet food at a shop.');return;}state.inventory.petfood--;state.pet.care=100;state.stats.petFeeds++;notify(state.pet.name+' enjoyed the food.');}else if(action==='play'){state.pet.care=clamp(state.pet.care+8,0,100);state.stats.petPlays++;addNeed('mood',8);notify('You played with '+state.pet.name+'.');}save();checkQuests();}
  function update(dt){
    var a=axis(),len=Math.hypot(a.x,a.y),moving=len>.08;
    if(moving){a.x/=len;a.y/=len;var running=keys.shift||touch.run,speed=running?220:125,dx=a.x*speed*dt,dy=a.y*speed*dt;
      var nx=state.x+dx,ny=state.y+dy;if(!solidAt(nx, state.y))state.x=nx;if(!solidAt(state.x,ny))state.y=ny;
      state.dir=Math.abs(a.x)>Math.abs(a.y)?(a.x<0?'left':'right'):(a.y<0?'up':'down');state.anim=running?'run':'walk';
      var metres=speed*dt*.04;state.stats.distance+=metres;if(running)state.stats.runM+=metres;else if(scene.kind==='trail'&&(scene.tiles[Math.floor(state.y/32)]||'')[Math.floor(state.x/32)]==='d')state.stats.hikeM+=metres;
      addNeed('energy',-(running?.12:.035)*dt);addNeed('hunger',-.018*dt);addNeed('thirst',-.026*dt);
    }else state.anim='idle';
    advance(dt);
    addNeed('hunger',-.004*dt);addNeed('thirst',-.006*dt);addNeed('hygiene',-.002*dt);addNeed('bladder',.003*dt);addNeed('social',-.001*dt);
    if(state.pet){state.pet.care=clamp(state.pet.care-.003*dt,0,100);}
    near=nearest();discover();spotWildlife();checkQuests();
  }
  function drawTile(x,y,c){
    if(typeof T!=='undefined'&&typeof ART!=='undefined'&&ART.tile){ART.tile(ctx,c,x,y,env(),function(tx,ty){return (scene.tiles[ty]||'')[tx]||'W';});return;}
    var colors={'.':'#77945b',',':'#9bab68','=':'#55575b',':':'#c5bda9','#':'#696765','f':'#a88058','m':'#b7b0a5','t':'#a6aaa2','W':'#b1a58e','~':'#3f778a','w':'#5799a4','d':'#a9916e','n':'#92917b','p':'#c7b9a1'};
    ctx.fillStyle=colors[c]||'#7b9660';ctx.fillRect(x*32,y*32,32,32);ctx.strokeStyle='rgba(29,34,48,.07)';ctx.strokeRect(x*32+.5,y*32+.5,31,31);
  }
  function env(){var h=state.minutes/60,month=new Date(state.date).getMonth(),snow=weatherInfo.temp===null?(month===10||month<=1?.55:0):clamp((2-weatherInfo.temp)/13,0,1);return {season:typeof seasonOf==='function'?seasonOf(month):'autumn',snow:snow,day:h>6&&h<19?1:.25,dusk:h>17&&h<20?.4:0,hour:h,wind:weatherInfo.wind,cloud:weatherInfo.cloud,kind:weatherInfo.kind,temp:weatherInfo.temp,biome:scene.biome,indoor:scene.inside,frozen:scene.placeId==='bkl'&&[0,1,2,3].indexOf(month)>=0};}
  function fallbackActor(x,y,kind){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(x,y+8,9,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=kind==='npc'?'#a65a42':'#34546c';ctx.fillRect(x-6,y-13,12,18);ctx.fillStyle='#e2b48f';ctx.beginPath();ctx.arc(x,y-17,6,0,Math.PI*2);ctx.fill();}
  function draw(){
    var w=canvas.width/dpr,h=canvas.height/dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    camera.x=clamp(state.x-w/2,0,scene.width*32-w);camera.y=clamp(state.y-h/2,0,scene.height*32-h);
    ctx.save();ctx.translate(-camera.x,-camera.y);
    for(var y=Math.max(0,Math.floor(camera.y/32));y<Math.min(scene.height,Math.ceil((camera.y+h)/32));y++)for(var x=Math.max(0,Math.floor(camera.x/32));x<Math.min(scene.width,Math.ceil((camera.x+w)/32));x++)drawTile(x,y,(scene.tiles[y]||'')[x]||'W');
    var objs=scene.objects.slice().sort(function(a,b){return a.y-b.y;});
    objs.forEach(function(o){if(o.t==='door')return;if(typeof ART!=='undefined'&&typeof T!=='undefined'&&ART.DEF&&ART.DEF[o.t])ART.draw(ctx,o,env(),elapsed);else if(o.t==='npc'||o.t==='person')fallbackActor((o.x+.5)*32,(o.y+.65)*32,'npc');else{ctx.fillStyle=o.t==='tree'?'#42613d':o.t==='bed'?'#9a7657':'#80664c';ctx.fillRect(o.x*32+4,o.y*32+5,(o.w||1)*32-8,(o.h||1)*32-10);}});
    if(typeof ART!=='undefined'&&typeof T!=='undefined'&&ART.DEF&&ART.DEF.person)ART.draw(ctx,{t:'person',x:state.x/32-.5,y:state.y/32-.82,dir:state.dir,anim:state.anim,look:(typeof OUTFITS!=='undefined'&&OUTFITS[state.outfit])?OUTFITS[state.outfit].look:{top:'#34546c',legs:'#2a2f3a'}},env(),elapsed);else fallbackActor(state.x,state.y,'player');
    if(state.pet&&window.ART2)ART2.pet(ctx,state.x-34+Math.sin(elapsed/400)*5,state.y+11+Math.cos(elapsed/550)*3,{kind:state.pet.kind,color:state.pet.color},env(),elapsed);
    ctx.restore();
    if(window.ART2)ART2.lighting(ctx,0,0,w,h,env(),elapsed);
    if(window.ART2)ART2.weather(ctx,0,0,w,h,env(),elapsed);
    if(near){var label=near.prompt||('E — '+(near.label||near.action||'Interact'));if(window.GAME_UI)GAME_UI.prompt(label);}
    else if(window.GAME_UI)GAME_UI.prompt('');
  }
  function loop(now){var dt=Math.min(.05,(now-last)/1000||0);last=now;elapsed+=dt*1000;if(!paused){update(dt);if(Math.floor(now/3000)!==Math.floor((now-dt*1000)/3000))save();}if(!paused||!window.GAME_TRAVEL||!GAME_TRAVEL.getJourney())draw();raf=requestAnimationFrame(loop);}
  function setTouch(x,y,run){if(x!==null&&x!==undefined)touch.x=x;if(y!==null&&y!==undefined)touch.y=y;if(run!==null&&run!==undefined)touch.run=!!run;}
  function togglePause(v){paused=v;}
  function getState(){return state;}
  function getScene(){return scene;}
  function getNear(){return near;}
  function getGeo(){if(!scene)return null;var lat=scene.lat||SCENE_CATALOG.places[scene.placeId].lat,lng=scene.lng||SCENE_CATALOG.places[scene.placeId].lng,dx=(state.x/32-13.5)*12,dy=(state.y/32-9.5)*12;return {lat:lat-dy/111320,lng:lng+dx/(111320*Math.max(.2,Math.cos(lat*Math.PI/180)))};}
  return {start:start,newGame:enterNew,save:save,load:load,use:use,notify:notify,setTouch:setTouch,pause:togglePause,getState:getState,getScene:getScene,getNear:getNear,getGeo:getGeo,advance:advance,consume:consume,petAction:petAction,addNeed:addNeed,scene:setScene,update:update,discover:discover,discoverNear:discoverNear,unlockDiscovery:unlockDiscovery,refreshWeather:refreshWeather,getWeather:function(){return weatherInfo;}};
})();
