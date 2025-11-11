let map, pickerMap, pickerMarker;
const addBtn=document.getElementById('addBtn');
const locateBtn=document.getElementById('locateBtn');
const dialogEl=document.getElementById('formDialog');
const form=document.getElementById('treeForm');
const formCategory=document.getElementById('formCategory');
const fruitSelect=document.getElementById('fruitSelect');
const fruitCustom=document.getElementById('fruitCustom');
const notes=document.getElementById('notes');
const latInput=document.getElementById('lat');
const lngInput=document.getElementById('lng');
const addressSearch=document.getElementById('addressSearch');
const useMyLocBtn=document.getElementById('useMyLocBtn');
const cancelBtn=document.getElementById('cancelBtn');

const MASTER={
  native_fruits:['Finger lime','Lilly Pilly','Davidson Plum'],
  common_fruits:['Avocado','Mulberry','Loquat'],
  edible_plants:['Wattle seed','Saltbush','Pigface']
};

let trees=[];

function initMap(){
  map=L.map('map').setView([-33.86,151.20],11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap'}).addTo(map);
}

function refillFruitOptions(){
  const list=MASTER[formCategory.value]||[];
  fruitSelect.innerHTML='';
  list.forEach(f=>{
    const o=document.createElement('option');o.textContent=f;fruitSelect.appendChild(o);
  });
  const other=document.createElement('option');other.textContent='Other';fruitSelect.appendChild(other);
}

function initPickerMap(lat=-33.86,lng=151.20){
  if(pickerMap)return;
  pickerMap=L.map('mapPicker').setView([lat,lng],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap'}).addTo(pickerMap);
  pickerMarker=L.marker([lat,lng],{draggable:true}).addTo(pickerMap);
  pickerMarker.on('dragend',()=>{
    const p=pickerMarker.getLatLng();
    latInput.value=p.lat.toFixed(6);
    lngInput.value=p.lng.toFixed(6);
  });
  pickerMap.on('click',e=>{
    pickerMarker.setLatLng(e.latlng);
    latInput.value=e.latlng.lat.toFixed(6);
    lngInput.value=e.latlng.lng.toFixed(6);
  });
}

async function goToMyLocation(fly=false){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject();
    navigator.geolocation.getCurrentPosition(pos=>{
      const lat=pos.coords.latitude,lng=pos.coords.longitude;
      if(fly&&pickerMap){
        pickerMap.setView([lat,lng],17);
        pickerMarker.setLatLng([lat,lng]);
      }
      resolve({lat,lng});
    },reject);
  });
}

addressSearch.addEventListener('change',async()=>{
  const q=addressSearch.value.trim();
  if(!q)return;
  const url=`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
  const res=await fetch(url);const data=await res.json();
  if(data&&data[0]){
    const {lat,lon}=data[0];
    pickerMap.setView([lat,lon],16);
    pickerMarker.setLatLng([lat,lon]);
    latInput.value=parseFloat(lat).toFixed(6);
    lngInput.value=parseFloat(lon).toFixed(6);
  }
});

useMyLocBtn.addEventListener('click',async()=>{
  const pos=await goToMyLocation(true);
  if(pos){
    latInput.value=pos.lat.toFixed(6);
    lngInput.value=pos.lng.toFixed(6);
  }
});

addBtn.addEventListener('click',()=>{
  form.reset();
  dialogEl.showModal();
  refillFruitOptions();
  setTimeout(()=>initPickerMap(),300);
});

cancelBtn.addEventListener('click',()=>dialogEl.close());

form.addEventListener('submit',e=>{
  e.preventDefault();
  const entry={
    id:Date.now(),
    type:fruitSelect.value==='Other'?fruitCustom.value:fruitSelect.value,
    category:formCategory.value,
    lat:parseFloat(latInput.value),
    lng:parseFloat(lngInput.value),
    notes:notes.value
  };
  trees.push(entry);
  L.marker([entry.lat,entry.lng]).addTo(map).bindPopup(`<b>${entry.type}</b><br>${entry.notes}`);
  dialogEl.close();
});

formCategory.addEventListener('change',refillFruitOptions);

window.addEventListener('load',initMap);
