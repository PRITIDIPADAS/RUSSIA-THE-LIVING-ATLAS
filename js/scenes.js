/* RUSSIA: LIFE & BEYOND — scene catalogue. Load after art.js. */
'use strict';
var SCENE_CATALOG = (function () {
  var fallback = {
    msk:{name:'Moscow',region:'Central Russia',lat:55.7539,lng:37.6208,tz:3},
    spb:{name:'Saint Petersburg',region:'North-West Russia',lat:59.9398,lng:30.3146,tz:3},
    kzn:{name:'Kazan',region:'Tatarstan',lat:55.7963,lng:49.1088,tz:3},
    bkl:{name:'Listvyanka, Lake Baikal',region:'Siberia',lat:51.8536,lng:104.8636,tz:8},
    elb:{name:'Terskol, Mount Elbrus',region:'Caucasus',lat:43.2589,lng:42.5083,tz:3},
    soc:{name:'Sochi',region:'Black Sea coast',lat:43.5855,lng:39.7231,tz:3},
    kam:{name:'Petropavlovsk-Kamchatsky',region:'Kamchatka',lat:53.037,lng:158.6559,tz:12}
  };
  var places = typeof LOCS !== 'undefined' ? LOCS : fallback;
  var definitions = [
    ['msk_flat','msk','Your flat','home','city'],['msk_street','msk','Moscow street','street','city'],
    ['msk_shop','msk','Grocery shop','shop','city'],['msk_hotel','msk','Hotel room','home','city'],
    ['msk_park','msk','City park & animal shelter','park','city'],['msk_square','msk','Red Square & the Kremlin','landmark','city'],
    ['msk_museum','msk','State Historical Museum','museum','city'],['msk_station','msk','Yaroslavsky railway station','station','city'],
    ['spb_embankment','spb','Palace Embankment','coast','coast'],['spb_hermitage','spb','The Hermitage','museum','city'],
    ['spb_strelka','spb','Strelka & Rostral Columns','landmark','coast'],
    ['kzn_kremlin','kzn','Kazan Kremlin','landmark','city'],['kzn_embankment','kzn','Kazan river embankment','coast','coast'],
    ['kzn_shop','kzn','Kazan shop','shop','city'],['kzn_hotel','kzn','Kazan hotel','home','city'],['kzn_station','kzn','Kazan station','station','city'],
    ['bkl_village','bkl','Listvyanka village','village','taiga'],['bkl_museum','bkl','Baikal Museum','museum','taiga'],
    ['bkl_beach','bkl','Designated swimming beach & pier','beach','baikal'],['bkl_trail','bkl','Great Baikal Trail','trail','taiga'],['bkl_camp','bkl','Taiga campsite','camp','taiga'],
    ['elb_village','elb','Terskol mountain village','village','mountain'],['elb_cable','elb','Cable car station','station','mountain'],
    ['elb_trail','elb','Marked mountain trail','trail','mountain'],['elb_hut','elb','Mountain hut','home','mountain'],['elb_shop','elb','Mountain shop','shop','mountain'],
    ['soc_promenade','soc','Black Sea promenade','coast','coast'],['soc_beach','soc','Designated swimming beach','beach','coast'],
    ['soc_pier','soc','Sochi pier','coast','coast'],['soc_station','soc','Sochi station','station','city'],
    ['kam_bay','kam','Avacha Bay coast','coast','volcanic'],['kam_beach','kam','Black-sand beach','beach','volcanic'],
    ['kam_tundra','kam','Kamchatka tundra trail','trail','tundra'],['kam_pier','kam','Petropavlovsk pier','coast','volcanic']
  ];
  var links = {
    msk_flat:['msk_street','South door'],msk_street:['msk_flat','msk_shop','msk_park','msk_square','msk_station','msk_hotel'],
    msk_shop:['msk_street'],msk_hotel:['msk_street'],msk_park:['msk_street'],msk_square:['msk_street','msk_museum'],
    msk_museum:['msk_square'],msk_station:['msk_street'],
    spb_embankment:['spb_hermitage','spb_strelka'],spb_hermitage:['spb_embankment'],spb_strelka:['spb_embankment'],
    kzn_kremlin:['kzn_embankment','kzn_shop','kzn_station','kzn_hotel'],kzn_embankment:['kzn_kremlin'],kzn_shop:['kzn_kremlin'],kzn_hotel:['kzn_kremlin'],kzn_station:['kzn_kremlin'],
    bkl_village:['bkl_museum','bkl_beach','bkl_trail'],bkl_museum:['bkl_village'],bkl_beach:['bkl_village'],bkl_trail:['bkl_village','bkl_camp'],bkl_camp:['bkl_trail'],
    elb_village:['elb_cable','elb_trail','elb_shop'],elb_cable:['elb_village'],elb_trail:['elb_village','elb_hut'],elb_hut:['elb_trail'],elb_shop:['elb_village'],
    soc_promenade:['soc_beach','soc_pier','soc_station'],soc_beach:['soc_promenade'],soc_pier:['soc_promenade'],soc_station:['soc_promenade'],
    kam_bay:['kam_beach','kam_pier','kam_tundra'],kam_beach:['kam_bay'],kam_pier:['kam_bay'],kam_tundra:['kam_bay']
  };
  var cache = {};
  function tileRows(kind) {
    var w=27,h=19, rows=[], base = ({home:'f',museum:'m',shop:'t',landmark:'#',station:'#'})[kind] || '.';
    for(var y=0;y<h;y++){
      var row='';
      for(var x=0;x<w;x++){
        var c=(x===0||y===0||x===w-1||y===h-1)?'W':base;
        if(kind==='home'||kind==='museum'||kind==='shop'||kind==='station'){
          if(y===h-1&&x===13)c='f';
        } else {
          if(y===9)c=kind==='street'||kind==='village'?'=':(kind==='coast'||kind==='beach'?'p':kind==='trail'?'d':'.');
          if((kind==='coast'||kind==='beach')&&x>19){c='~';if(y>5&&y<14&&x>20)c='w';}
          if(kind==='beach'&&x>18&&y>5&&y<14)c='w';
          if(kind==='trail'&&x>5&&x<22&&y===9)c='d';
          if(kind==='camp'&&x>19&&y>3)c='n';
          if(kind==='landmark'&&x>21)c='.';
          if(kind==='street'&&y>7&&y<12)c='=';
        }
        row+=c;
      }
      rows.push(row);
    }
    return rows;
  }
  function obj(t,x,y,more){var o={t:t,x:x,y:y};if(more)Object.assign(o,more);return o;}
  function build(id) {
    if(cache[id])return cache[id];
    var d=definitions.find(function(v){return v[0]===id;});
    if(!d)return null;
    var pid=d[1],p=places[pid]||fallback[pid],kind=d[3],biome=d[4],inside=['home','museum','shop','station'].indexOf(kind)>=0;
    var objects=[],interact=[];
    if(inside){
      objects.push(obj('bld',3,2,{w:21,h:14,style:'stucco',floors:1,lit:100}));
      if(kind==='home'){
        objects.push(obj('bed',4,4,{action:'sleep',prompt:'E — Sleep in your bed'}),obj('fridge',20,4,{action:'fridge',prompt:'E — Open fridge'}),obj('stove',19,10,{action:'cook',prompt:'E — Cook'}),obj('shower',4,12,{action:'shower',prompt:'E — Shower'}),obj('toilet',8,12,{action:'restroom',prompt:'E — Use restroom'}),obj('wardrobe',13,3,{action:'wardrobe',prompt:'E — Change clothes'}),obj('table',10,8,{action:'eat',prompt:'E — Eat at the table'}),obj('chair',11,10));
      } else if(kind==='shop'){
        objects.push(obj('table',6,5,{w:3,action:'shop',prompt:'E — Browse groceries'}),obj('fridge',18,4,{action:'shop',prompt:'E — Browse groceries'}),obj('npc',12,12,{name:'Shopkeeper',dir:'down',color:'#8b5945',route:0,phase:2}));
      } else if(kind==='station'){
        objects.push(obj('bench',5,11,{action:'rest',prompt:'E — Sit and rest'}),obj('npc',15,10,{name:'Station attendant',phase:1}),obj('table',19,5,{w:3,action:'info',prompt:'E — Read the route board'}));
      } else {
        objects.push(obj('bench',7,11,{action:'read',prompt:'E — Read an exhibit'}),obj('table',15,6,{w:3,action:'read',prompt:'E — Read an exhibit'}),obj('npc',20,11,{name:'Museum guide',phase:3}));
      }
      objects.push({t:'door',x:13,y:17,doorTo:(links[id]||[])[0],label:'Exit'});
    } else {
      if(kind==='street'||kind==='village'||kind==='coast'||kind==='beach') {
        objects.push(obj('bld',2,3,{w:6,h:5,style:pid==='msk'?'brick':'izba',floors:2,door:2}),obj('bld',19,3,{w:5,h:5,style:'stucco',floors:2}));
      }
      if(kind==='landmark') {
        if(pid==='msk')objects.push(obj('kwall',2,3,{w:19,h:2}),obj('ktower',6,4,{small:false}),obj('stbasil',13,4));
        else if(pid==='kzn')objects.push(obj('kwall',2,3,{w:18,h:2,white:true}),obj('kulsharif',8,4),obj('soyembike',20,4));
        else objects.push(obj('church',9,5,{w:5,h:3,domes:[{c:'#c6a54b'},{c:'#4d8c76'},{c:'#b94839'}]}));
      }
      if(kind==='coast'||kind==='beach')objects.push(obj('bench',4,11,{action:'rest',prompt:'E — Sit and enjoy the view'}),obj('lamp',7,5),obj('boat',17,7,{w:3}));
      if(kind==='trail'||kind==='camp')objects.push(obj('tree',4,5,{k:biome==='taiga'?'cedar':biome==='tundra'?'ermans':'pine',s:1.15}),obj('tree',8,12,{k:'birch'}),obj('tree',20,5,{k:'spruce'}));
      if(kind==='camp')objects.push(obj('tent',12,7,{action:'sleep',prompt:'E — Sleep in your tent'}),obj('campfire',16,11,{action:'rest',prompt:'E — Rest by the campfire'}));
      if(kind==='park'||kind==='street'||kind==='village')objects.push(obj('tree',5,5,{k:'birch'}),obj('tree',19,5,{k:pid==='soc'?'palm':'oak'}),obj('bench',10,12,{action:'rest',prompt:'E — Sit on the bench'}));
      if(pid==='msk'&&kind==='park')objects.push(obj('squirrel',18,7,{species:'squirrel'}));
      if(pid==='bkl'&&kind==='beach')objects.push(obj('seal',23,6,{species:'nerpa'}),obj('gull',20,5,{species:'mgull'}));
      if(pid==='bkl'&&kind==='trail')objects.push(obj('squirrel',9,6,{species:'squirrel'}),obj('crow',20,8,{species:'crow'}));
      if(pid==='elb'&&kind==='trail')objects.push(obj('tur',21,5,{species:'tur'}));
      if(pid==='kam'&&kind==='tundra')objects.push(obj('bear',23,4,{species:'bear'}));
      if(pid==='soc'&&kind==='beach')objects.push(obj('dolphin',23,6,{species:'dolphin'}));
      if(kind==='beach')interact.push({x:18,y:10,action:'swim',prompt:'E — Swim in designated water'});
      if(kind==='trail')interact.push({x:14,y:9,action:'hike',prompt:'E — Hike the marked trail'});
      if(kind==='park')interact.push({x:17,y:12,action:'adopt',prompt:'E — Visit the animal shelter'});
      if(kind==='shop')interact.push({x:12,y:12,action:'shop',prompt:'E — Shop'});
      if(kind==='museum')interact.push({x:13,y:12,action:'read',prompt:'E — Read an exhibit'});
      objects.push(obj('npc',12,8,{name:'Local resident',phase:1}),obj('npc',16,13,{name:'Passer-by',phase:4}));
      objects.push({t:'door',x:13,y:17,doorTo:(links[id]||[])[0],label:'Next area'});
    }
    (links[id]||[]).forEach(function(target,i){interact.push({x:2+i*4,y:17,action:'door',doorTo:target,prompt:'E — Go to '+(definitions.find(function(v){return v[0]===target;})||[])[2]});});
    var scene={id:id,placeId:pid,name:d[2],region:p.region,lat:p.lat,lng:p.lng,tz:p.tz||3,kind:kind,biome:biome,width:27,height:19,tiles:tileRows(kind),objects:objects,interact:interact,inside:inside,description:'A hand-built illustrative game scene at the real coordinates of '+p.name+'.',placeName:p.name};
    cache[id]=scene;return scene;
  }
  function all(){return definitions.map(function(d){return build(d[0]);});}
  function forPlace(pid){return definitions.filter(function(d){return d[1]===pid;}).map(function(d){return build(d[0]);});}
  return {definitions:definitions,build:build,all:all,forPlace:forPlace,start:'msk_flat',links:links,places:places};
})();
