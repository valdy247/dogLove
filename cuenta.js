const SB_URL="https://wrnlhjujsbigculndivs.supabase.co",SB_KEY="sb_publishable_8HuHhuPPmeUh5G63ocZjbQ_OjHjJ77k";const sb=supabase.createClient(SB_URL,SB_KEY);let mode="login",user=null;
const authView=document.getElementById("authView"),accountView=document.getElementById("accountView"),logout=document.getElementById("logout"),authStatus=document.getElementById("authStatus");
const authTitle=document.getElementById("authTitle"),authIntro=document.getElementById("authIntro"),authSubmit=document.getElementById("authSubmit"),authHint=document.getElementById("authHint"),passwordInput=document.querySelector('#authForm input[name="password"]');
function renderAuthMode(){
  document.querySelectorAll("[data-auth]").forEach(x=>x.classList.toggle("active",x.dataset.auth===mode));
  document.getElementById("nameField").hidden=mode!=="signup";
  if(passwordInput)passwordInput.autocomplete=mode==="signup"?"new-password":"current-password";
  if(mode==="signup"){
    authTitle.innerHTML="Create their profile.<br>Keep every detail.";
    authIntro.textContent="Crea una cuenta para guardar la información de tu mascota, historial de grooming y preferencias para futuras visitas.";
    authSubmit.textContent="Crear mi cuenta →";
    authHint.textContent="Crear una cuenta no reserva una cita. Puedes reservar antes o después desde la página principal.";
  }else{
    authTitle.innerHTML="Welcome back.<br>Your pet is here.";
    authIntro.textContent="Inicia sesión para ver tus mascotas, historial de grooming y datos de cuidado guardados.";
    authSubmit.textContent="Entrar a mi cuenta →";
    authHint.textContent="¿Primera vez? Crea una cuenta gratis para guardar el perfil de tu mascota.";
  }
  authStatus.textContent="";authStatus.className="status-box";
}
document.querySelectorAll("[data-auth]").forEach(b=>b.onclick=()=>{mode=b.dataset.auth;renderAuthMode()});
if(new URLSearchParams(location.search).get("mode")==="signup")mode="signup";
renderAuthMode();
document.getElementById("authForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),email=f.get("email"),password=f.get("password");let r;if(mode==="signup")r=await sb.auth.signUp({email,password,options:{data:{name:f.get("name")||""}}});else r=await sb.auth.signInWithPassword({email,password});if(r.error){authStatus.textContent=r.error.message;authStatus.className="status-box show warn";return}authStatus.textContent=mode==="signup"&&!r.data.session?"Cuenta creada. Revisa tu email para confirmarla y luego inicia sesión.":"Listo. Abriendo tu Pet Portal…";authStatus.className="status-box show ok";if(r.data.session)boot(r.data.user)};
logout.onclick=async()=>{await sb.auth.signOut();location.reload()};
async function boot(u){user=u;authView.hidden=true;accountView.hidden=false;logout.hidden=false;await loadPets()}
async function loadPets(){const {data,error}=await sb.from("doglove_pets").select("*").order("created_at",{ascending:false});const g=document.getElementById("petGrid");if(error){g.innerHTML="<p>No se pudieron cargar las mascotas.</p>";return}g.innerHTML=data.length?data.map(p=>`<article class="pet-card">${p.photo_url?`<img src="${p.photo_url}" alt="${p.name}">`:'<div class="pet-photo-empty">🐾</div>'}<div><small>${p.breed}</small><h2>${p.name}</h2><p>${p.temperament||"Perfil de cuidado personalizado"}</p><button onclick="showHistory('${p.id}','${p.name}')">Ver historial →</button></div></article>`).join(""):'<div class="empty-pets"><b>Aún no tienes mascotas.</b><span>Crea el primer perfil para guardar su cuidado e historial.</span></div>'}
const petModal=document.getElementById("petModal");document.getElementById("addPet").onclick=()=>petModal.hidden=false;document.getElementById("closePet").onclick=()=>petModal.hidden=true;
document.getElementById("petForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),photo=f.get("photo");let photo_url=null;if(photo&&photo.size){const path=user.id+"/"+crypto.randomUUID()+"-"+photo.name.replace(/[^a-z0-9.]/gi,"-");const up=await sb.storage.from("doglove-pets").upload(path,photo);if(!up.error)photo_url=sb.storage.from("doglove-pets").getPublicUrl(path).data.publicUrl}const row={owner_id:user.id,name:f.get("name"),breed:f.get("breed"),birth_date:f.get("birth_date")||null,weight_lbs:f.get("weight_lbs")||null,temperament:f.get("temperament")||null,allergies:f.get("allergies")||null,notes:f.get("notes")||null,photo_url};const {error}=await sb.from("doglove_pets").insert(row);const s=document.getElementById("petStatus");s.textContent=error?error.message:"Mascota guardada.";s.className="status-box show "+(error?"warn":"ok");if(!error){e.target.reset();setTimeout(()=>{petModal.hidden=true;loadPets()},500)}};
window.showHistory=async(id,name)=>{document.getElementById("historyTitle").textContent="Historial de "+name;const {data}=await sb.from("doglove_pet_history").select("*").eq("pet_id",id).order("service_date",{ascending:false});document.getElementById("historyRows").innerHTML=data?.length?data.map(x=>`<article class="history-row"><time>${x.service_date}</time><div><b>${x.services.join(" · ")}</b><p>${x.notes||"Sin notas adicionales"}</p></div><strong>$${Number(x.amount).toFixed(0)}</strong></article>`).join(""):"<p>Todavía no hay servicios registrados para esta mascota.</p>";document.getElementById("historyModal").hidden=false};document.getElementById("closeHistory").onclick=()=>document.getElementById("historyModal").hidden=true;
sb.auth.getUser().then(({data})=>{if(data.user)boot(data.user)});