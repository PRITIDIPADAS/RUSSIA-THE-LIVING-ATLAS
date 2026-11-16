/* RUSSIA: LIFE & BEYOND — country map and simulated journeys. */
'use strict';
var GAME_TRAVEL = (function () {
  var map=null,selected=null,journey=null,frame=0,last=0,mapReady=false;
  var style='https://tiles.openfreemap.org/styles/liberty';
  var fallback={
    msk:{name:'Moscow',lat:55.7539,lng:37.6208,tz:3},spb:{name:'Saint Petersburg',lat:59.9398,lng:30.3146,tz:3},
    kzn:{name:'Kazan',lat:55.7963,lng:49.1088,tz:3},bkl:{name:'Listvyanka / Baikal',lat:51.8536,lng:104.8636,tz:8},
    elb:{name:'Terskol / Elbrus',lat:43.2589,lng:42.5083,tz:3},soc:{name:'Sochi',lat:43.5855,lng:39.7231,tz:3},
    kam:{name:'Petropavlovsk-Kamchatsky',lat:53.037,lng:158.6559,tz:12}
  };
  function places(){return typeof LOCS!=='undefined'?LOCS:fallback;}
  function nodes(){var p=places(),n={};Object.keys(p).forEach(function(k){n[k]=p[k];});if(typeof TRANSIT!=='undefined')Object.keys(TRANSIT).forEach(function(k){n[k]=TRANSIT[k];});if(typeof DISC!=='undefined')Object.keys(DISC).forEach(function(k){var d=DISC[k];if(!n['poi_'+k])n['poi_'+k]={name:d.name,lat:d.lat,lng:d.lng,discoveryKey:k};});return n;}
  function dist(a,b){var r=Math.PI/180,la=(b.lat-a.lat)*r,lo=(b.lng-a.lng)*r,h=Math.sin(la/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(lo/2)**2;return 12742*Math.asin(Math.sqrt(h));}
  function route(from,to){if(from===to)return [from];var es=typeof EDGES!=='undefined'?EDGES:[],ns=nodes(),q=[{id:from,cost:0,path:[from]}],best={};while(q.length){q.sort(function(a,b){return a.cost-b.cost;});var cur=q.shift();if(cur.id===to)return cur.path;if(best[cur.id]!==undefined&&best[cur.id]<=cur.cost)continue;best[cur.id]=cur.cost;es.forEach(function(e){var next=e[0]===cur.id?e[1]:e[1]===cur.id?e[0]:null;if(next&&ns[next]&&best[next]===undefined)q.push({id:next,cost:cur.cost+dist(ns[cur.id],ns[next]),path:cur.path.concat(next)});});}return [from,to];}
  function updatePlayerMarker(){if(!map||!mapReady||!window.GAME_ENGINE||!GAME_ENGINE.getGeo)return;var g=GAME_ENGINE.getGeo(),src=map.getSource('russia-life-player');if(g&&src)src.setData({type:'Feature',geometry:{type:'Point',coordinates:[g.lng,g.lat]},properties:{name:'Your approximate local-scene position'}});}
  function showMap(){var wrap=document.getElementById('mapwrap');if(!wrap)return;wrap.classList.remove('hidden');if(window.GAME_ENGINE)GAME_ENGINE.pause(true);if(map){setTimeout(function(){map.resize();updatePlayerMarker();},100);return;}loadMapLibre();}
  function loadMapLibre(){
    if(window.RUSSIA_OPENFREEMAP_ADULT_APPROVAL!==true){drawFallback();var notice=document.getElementById('mapbadge');if(notice)notice.textContent='Schematic locator only. Live OpenFreeMap tiles are disabled pending review by an adult project maintainer.';return;}
    var css='https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.css';
    if(!document.querySelector('link[data-maplibre]')){var l=document.createElement('link');l.rel='stylesheet';l.href=css;l.dataset.maplibre='1';document.head.appendChild(l);}
    import('https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.mjs').then(function(ml){
      var el=document.getElementById('mapc');if(!el)return;map=new ml.Map({container:el,style:style,center:[91,62],zoom:2.25,minZoom:1.3,maxZoom:16,attributionControl:true});
      map.addControl(new ml.NavigationControl(),'bottom-left');
      map.on('load',function(){mapReady=true;var features=[];Object.keys(nodes()).forEach(function(id){var p=nodes()[id];features.push({type:'Feature',geometry:{type:'Point',coordinates:[p.lng,p.lat]},properties:{id:id,name:p.name,playable:!!places()[id],discovery:!!p.discoveryKey}});});
        map.addSource('russia-life-places',{type:'geojson',data:{type:'FeatureCollection',features:features}});
        map.addSource('russia-life-network',{type:'geojson',data:{type:'FeatureCollection',features:(typeof EDGES!=='undefined'?EDGES:[]).map(function(e){var a=nodes()[e[0]],b=nodes()[e[1]];return a&&b?{type:'Feature',geometry:{type:'LineString',coordinates:[[a.lng,a.lat],[b.lng,b.lat]]},properties:{mode:e[2]}}:null;}).filter(Boolean)}});
        map.addLayer({id:'russia-life-network-lines',type:'line',source:'russia-life-network',paint:{'line-color':'#9b3324','line-width':1.5,'line-opacity':.45}});
        map.addLayer({id:'russia-life-points',type:'circle',source:'russia-life-places',paint:{'circle-radius':['case',['get','playable'],8,['get','discovery'],5,3],'circle-color':['case',['get','playable'],'#9b3324',['get','discovery'],'#a8822c','#34546c'],'circle-stroke-color':'#eee6d3','circle-stroke-width':2}});
        var pg=GAME_ENGINE.getGeo(),pp=pg||nodes().msk;if(pp){map.addSource('russia-life-player',{type:'geojson',data:{type:'Feature',geometry:{type:'Point',coordinates:[pp.lng,pp.lat]},properties:{name:'Your approximate local-scene position'}}});map.addLayer({id:'russia-life-player-dot',type:'circle',source:'russia-life-player',paint:{'circle-radius':9,'circle-color':'#a8822c','circle-stroke-color':'#1d2230','circle-stroke-width':2}});}
        map.fitBounds([[19,41],[180,82]],{padding:28,maxZoom:3.1});
        map.on('click','russia-life-points',function(e){var f=e.features&&e.features[0];if(f)select(f.properties.id);});
      });
      map.on('error',function(){if(!mapReady)drawFallback();});
    }).catch(drawFallback);
  }
  function drawFallback(){
    var el=document.getElementById('mapc');if(!el)return;var ps=nodes(),ids=Object.keys(ps).filter(function(id){return id.indexOf('poi_')!==0;});
    el.innerHTML='<div style="position:absolute;inset:0;background:#d6d2c5;overflow:hidden"><svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%"><path d="M80 210 L190 120 380 80 560 100 760 80 920 190 880 350 720 460 510 510 320 450 150 390Z" fill="#e7e0ce" stroke="#777b78" stroke-width="3"/><text x="500" y="300" text-anchor="middle" fill="#6b706c" font-size="24">RUSSIA · SCHEMATIC VIEW</text></svg></div>';
    ids.forEach(function(id){var p=ps[id],x=8+(p.lng-19)/161*84,y=8+(82-p.lat)/41*84,b=document.createElement('button');b.textContent=p.name;b.style.cssText='position:absolute;left:'+x+'%;top:'+y+'%;font:12px PT Sans;background:#eee6d3;border:1px solid #1d2230;padding:4px;';b.onclick=function(){select(id);};el.appendChild(b);});
    var badge=document.getElementById('mapbadge');if(badge)badge.textContent='Schematic locator view · approximate silhouette and real coordinate markers · not an OSM basemap';
  }
  function select(id){var ns=nodes()[id];if(!ns)return;selected=id;var box=document.getElementById('mapside'),play=!!places()[id],poi=!!ns.discoveryKey;if(!box)return;
    var d=poi&&typeof DISC!=='undefined'?DISC[ns.discoveryKey]:null;
    var fact=d?'<p>'+safe(d.intro||'A geographical point in the atlas.')+'</p><div class="src">'+(d.src||[]).map(function(s){return '<p><a href="'+safe(s[1])+'" target="_blank" rel="noopener">'+safe(s[0])+'</a></p>';}).join('')+'</div>':'';
    box.innerHTML='<div class="kicker">WORLD ATLAS · RUSSIA</div><h2>'+safe(ns.name)+'</h2><p>'+ns.lat.toFixed(3)+'°, '+ns.lng.toFixed(3)+'°</p><p>'+(play?'Playable destination':poi?'Discovery point · not a playable local scene':'Mapped transfer point · not a playable local scene')+'</p>'+fact+'<p class="sub">Travel routes are simulated and do not represent real timetables.</p><div class="actions">'+(play?'<button class="btn primary" data-trip="'+id+'">Travel here</button>':'')+'<button class="btn" data-mapclose>Close map</button></div>';
    if(play)box.querySelector('[data-trip]').onclick=function(){chooseMode(id);};
    box.querySelector('[data-mapclose]').onclick=hideMap;
    if(map&&mapReady)map.flyTo({center:[ns.lng,ns.lat],zoom:Math.max(map.getZoom(),5)});
  }
  function safe(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function chooseMode(id){var box=document.getElementById('mapside');if(!box)return;box.innerHTML='<div class="kicker">PLAN A JOURNEY</div><h2>Travel to '+safe(places()[id].name)+'</h2><p>Choose your simulated transport:</p><div class="actions"><button class="btn primary" data-mode="rail">Train / bus</button><button class="btn" data-mode="drive">Drive</button><button class="btn" data-mode="fly">Fly</button><button class="btn" data-mapback="'+id+'">Back</button></div>';box.querySelectorAll('[data-mode]').forEach(function(b){b.onclick=function(){begin(id,b.dataset.mode);};});box.querySelector('[data-mapback]').onclick=function(){select(id);};}
  function begin(to,mode){
    var s=GAME_ENGINE.getState(),from=s.scene.slice(0,3);if(!places()[from])from='msk';var ids=mode==='fly'?[from,to]:route(from,to),ns=nodes(),km=0;
    for(var i=1;i<ids.length;i++)km+=dist(ns[ids[i-1]],ns[ids[i]]);
    var speed=mode==='fly'?650:mode==='drive'?72:60;journey={from:from,to:to,mode:mode,ids:ids,index:0,km:km,progress:0,hours:km/speed,speed:1,paused:false,started:Date.now(),biome:'taiga',lastEncounter:-1,log:['Your simulated journey has begun. No real timetable is implied.']};
    hideMap();document.getElementById('jui').classList.remove('hidden');GAME_ENGINE.pause(true);last=performance.now();if(frame)cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);controls();
  }
  function controls(){var a=document.getElementById('jAct');if(!a)return;a.innerHTML='<button class="btn" data-speed="1">×1</button><button class="btn" data-speed="4">×4</button><button class="btn" data-speed="16">×16</button><button class="btn" data-pause>Pause</button><button class="btn" data-stop>Stop</button>';a.querySelectorAll('[data-speed]').forEach(function(b){b.onclick=function(){journey.speed=+b.dataset.speed;};});a.querySelector('[data-pause]').onclick=function(){journey.paused=!journey.paused;btext(this,journey.paused?'Resume':'Pause');};a.querySelector('[data-stop]').onclick=stop;}
  function btext(b,s){b.textContent=s;}
  function positionAt(progress){var j=journey,ns=nodes(),remaining=j.km*progress;for(var i=1;i<j.ids.length;i++){var a=ns[j.ids[i-1]],b=ns[j.ids[i]],leg=dist(a,b);if(remaining<=leg||i===j.ids.length-1){var t=leg?Math.max(0,Math.min(1,remaining/leg)):1;return {lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t,from:a.name,to:b.name};}remaining-=leg;}var end=ns[j.to];return {lat:end.lat,lng:end.lng,from:end.name,to:end.name};}
  function maybeEncounter(){var j=journey,m=Math.floor(j.progress*4);if(m<=j.lastEncounter||m<1||m>3)return;j.lastEncounter=m;var vehicle=j.mode==='fly'?'plane':j.mode==='drive'?'car':'train',available=typeof ENC!=='undefined'?ENC.filter(function(e){return !e.veh||e.veh.indexOf(vehicle)>=0;}):[],event=available.length?available[(m*3+j.ids.length)%available.length]:null;if(event){j.log.push(event.t);if(j.log.length>4)j.log.shift();}}
  function tick(now){if(!journey)return;var dt=Math.min(.1,(now-last)/1000);last=now;if(!journey.paused){journey.progress=Math.min(1,journey.progress+dt*journey.speed/Math.max(20,journey.hours*60));if(GAME_ENGINE){GAME_ENGINE.advance(dt*journey.speed);var pos=positionAt(journey.progress);GAME_ENGINE.discoverNear(pos.lat,pos.lng,75);}maybeEncounter();if(journey.progress>=1){arrive();return;}}
    renderJourney();frame=requestAnimationFrame(tick);}
  function renderJourney(){var j=journey,from=nodes()[j.from],to=nodes()[j.to],pc=j.progress*100;
    var routeEl=document.getElementById('jRoute'),leg=document.getElementById('jLeg'),bar=document.querySelector('#jbar i'),meta=document.getElementById('jMeta'),log=document.getElementById('jlog'),pos=positionAt(j.progress),s=GAME_ENGINE.getState(),month=new Date(s.date).getMonth(),hour=s.minutes/60,wx=GAME_ENGINE.getWeather?GAME_ENGINE.getWeather():{kind:'clear'};
    if(routeEl)routeEl.textContent=from.name+' → '+to.name;if(leg)leg.textContent='Current leg: '+pos.from+' → '+pos.to+' · simulated '+j.mode+' journey';
    if(bar)bar.style.width=pc+'%';if(meta)meta.textContent=Math.round(pc)+'% · estimated '+Math.max(0,Math.ceil(j.hours*(1-j.progress)))+' simulated hours remaining · speed ×'+j.speed;
    if(log)log.innerHTML=j.log.slice(-3).map(function(t){return '<div>'+safe(t)+'</div>';}).join('')+'<div>Regional landscape is illustrative, not a real-time camera view.</div>';
    var c=document.getElementById('game'),g=c&&c.getContext('2d');if(g){var w=c.width/(window.devicePixelRatio||1),h=c.height/(window.devicePixelRatio||1);g.setTransform(window.devicePixelRatio||1,0,0,window.devicePixelRatio||1,0,0);g.clearRect(0,0,w,h);
      if(window.ART2)ART2.journey(g,{x:30,y:80,w:w-60,h:h-160,biome:j.to==='bkl'?'baikal':j.to==='elb'?'caucasus':j.to==='soc'?'coast':j.to==='kam'?'volcanic':'taiga',season:typeof seasonOf==='function'?seasonOf(month):'autumn',day:hour>6&&hour<19?1:.22,hour:hour,weather:wx.kind,vehicle:j.mode==='fly'?'plane':j.mode==='drive'?'car':'train',progress:j.progress,speed:j.speed,paused:j.paused},now);
    }
  }
  function arrive(){var j=journey,id=j.to,scenes=SCENE_CATALOG.forPlace(id),target=scenes[0];journey=null;if(frame)cancelAnimationFrame(frame);document.getElementById('jui').classList.add('hidden');GAME_ENGINE.pause(false);if(target)GAME_ENGINE.scene(target.id);GAME_ENGINE.notify('Arrived at '+places()[id].name+'. Your journey was simulated.');GAME_ENGINE.save();}
  function stop(){journey=null;if(frame)cancelAnimationFrame(frame);var el=document.getElementById('jui');if(el)el.classList.add('hidden');GAME_ENGINE.pause(false);GAME_ENGINE.notify('Journey stopped.');}
  function hideMap(){var el=document.getElementById('mapwrap');if(el)el.classList.add('hidden');if(GAME_ENGINE)GAME_ENGINE.pause(false);}
  return {open:showMap,close:hideMap,select:select,begin:begin,stop:stop,getJourney:function(){return journey;}};
})();
