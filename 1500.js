const header=document.querySelector(".site-header");
const progress=document.getElementById("progress");
const menuToggle=document.getElementById("menuToggle");
const nav=document.getElementById("nav");

function track(name,params={}){
  if(typeof window.gtag==="function") window.gtag("event",name,params);
  console.info("[analytics-ready]",name,params);
}

function initAnalytics(){
  const id=document.documentElement.dataset.gaId||"";
  if(!/^G-[A-Z0-9]+$/i.test(id)) return;
  const s=document.createElement("script");
  s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);
  document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){dataLayer.push(arguments)};
  gtag("js",new Date());gtag("config",id);
}
initAnalytics();

function onScroll(){
  if(header) header.classList.toggle("scrolled",window.scrollY>20);
  if(progress){
    const max=document.documentElement.scrollHeight-window.innerHeight;
    progress.style.width=(max?window.scrollY/max*100:0)+"%";
  }
}
window.addEventListener("scroll",onScroll,{passive:true});onScroll();

if(menuToggle&&nav){
  menuToggle.addEventListener("click",()=>{
    const open=nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded",String(open));
  });
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
}

const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");revealObserver.unobserve(e.target)}})
},{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>revealObserver.observe(el));

document.querySelectorAll('a[href*="wa.me"]').forEach(a=>a.addEventListener("click",()=>track("whatsapp_click",{href:a.href})));
document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.addEventListener("click",()=>track("phone_click")));

const bookingForm=document.getElementById("bookingForm");
if(bookingForm){
  const dateInput=bookingForm.querySelector('input[name="date"]');
  if(dateInput) dateInput.min=new Date().toISOString().split("T")[0];

  const service=bookingForm.querySelector('[name="service"]');
  const date=bookingForm.querySelector('[name="date"]');
  const pet=bookingForm.querySelector('[name="pet"]');
  const summaryService=document.getElementById("summaryService");
  const summaryDate=document.getElementById("summaryDate");
  const summaryPet=document.getElementById("summaryPet");
  const status=document.getElementById("bookingStatus");

  const refresh=()=>{
    if(summaryService) summaryService.textContent=service?.value||"Por elegir";
    if(summaryDate) summaryDate.textContent=date?.value||"Por elegir";
    if(summaryPet) summaryPet.textContent=pet?.value||"Por indicar";
  };
  [service,date,pet].forEach(el=>el?.addEventListener("input",refresh));refresh();

  function getPayload(){
    return Object.fromEntries(new FormData(bookingForm).entries());
  }
  function showStatus(message,type="warn"){
    if(!status)return;
    status.textContent=message;
    status.className="status-box show "+type;
  }
  function whatsappMessage(data){
    return [
      "Hola Pawsitive Love Dog 🐾","",
      "Quiero solicitar una cita.",
      "Nombre: "+(data.name||""),
      "Teléfono: "+(data.phone||""),
      "Mascota: "+(data.pet||""),
      "Servicio: "+(data.service||""),
      "Fecha: "+(data.date||"Por coordinar"),
      "Horario: "+(data.time||"Flexible"),
      "Notas: "+(data.notes||"Ninguna")
    ].join("\n");
  }

  bookingForm.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!bookingForm.reportValidity()) return;
    const data=getPayload();
    track("booking_submit",{service:data.service});
    try{
      const r=await fetch("/api/booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const out=await r.json();
      if(out?.sent) showStatus("Solicitud enviada. También abriremos WhatsApp para confirmar.","ok");
      else showStatus("La automatización por email quedará activa al conectar la cuenta del negocio. Abriremos WhatsApp para confirmar.","warn");
    }catch{
      showStatus("La solicitud está lista. Abriremos WhatsApp para confirmar.","warn");
    }
    window.open("https://wa.me/13059343028?text="+encodeURIComponent(whatsappMessage(data)),"_blank","noopener");
  });

  const pay=document.getElementById("payDeposit");
  if(pay){
    pay.addEventListener("click",async()=>{
      if(!bookingForm.reportValidity()) return;
      const data=getPayload();
      track("payment_start",{service:data.service});
      pay.disabled=true;pay.textContent="Preparando pago…";
      try{
        const r=await fetch("/api/create-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({service:data.service})});
        const out=await r.json();
        if(out?.url){window.location.href=out.url;return}
        showStatus("El flujo de pago ya está preparado. Para cobrar de verdad solo falta conectar la cuenta Stripe del negocio.","warn");
      }catch{
        showStatus("El flujo de pago está preparado; se activa al conectar Stripe en Vercel.","warn");
      }finally{
        pay.disabled=false;pay.innerHTML="Pagar depósito <span>↗</span>";
      }
    });
  }
}


const paymentFlag=new URLSearchParams(location.search).get("payment");
const paymentStatus=document.getElementById("bookingStatus");
if(paymentStatus&&paymentFlag==="success"){
  paymentStatus.textContent="Pago completado. Ahora puedes enviar tu solicitud por WhatsApp para confirmar la cita.";
  paymentStatus.className="status-box show ok";
  track("payment_success");
}
if(paymentStatus&&paymentFlag==="cancelled"){
  paymentStatus.textContent="El pago fue cancelado. No se realizó ningún cargo.";
  paymentStatus.className="status-box show warn";
  track("payment_cancelled");
}

const bookingDrawer=document.getElementById("bookingDrawer");
const bookingWizard=document.getElementById("bookingWizard");
if(bookingDrawer&&bookingWizard){
  const breedNames=["Affenpinscher","Afghan Hound","Airedale Terrier","Akita","Alaskan Malamute","American Bulldog","American Eskimo Dog","American Staffordshire Terrier","Australian Cattle Dog","Australian Shepherd","Basenji","Basset Hound","Beagle","Belgian Malinois","Bernese Mountain Dog","Bichon Frise","Bloodhound","Border Collie","Boston Terrier","Boxer","Brittany","Bull Terrier","Bulldog","Cane Corso","Cavalier King Charles Spaniel","Chihuahua","Chinese Crested","Chow Chow","Cocker Spaniel","Collie","Dachshund","Dalmatian","Doberman Pinscher","English Cocker Spaniel","English Setter","English Springer Spaniel","French Bulldog","German Shepherd","German Shorthaired Pointer","Golden Retriever","Great Dane","Great Pyrenees","Greyhound","Havanese","Irish Setter","Jack Russell Terrier","Labrador Retriever","Lhasa Apso","Maltese","Mastiff","Miniature Pinscher","Miniature Schnauzer","Newfoundland","Papillon","Pekingese","Pembroke Welsh Corgi","Pomeranian","Poodle","Portuguese Water Dog","Pug","Rhodesian Ridgeback","Rottweiler","Saint Bernard","Samoyed","Schnauzer","Scottish Terrier","Shetland Sheepdog","Shiba Inu","Shih Tzu","Siberian Husky","Staffordshire Bull Terrier","Vizsla","Weimaraner","West Highland White Terrier","Whippet","Yorkshire Terrier","Mixed Breed"];
  let step=1;
  const steps=[...bookingWizard.querySelectorAll(".wizard-step")];
  const back=document.getElementById("wizardBack"),next=document.getElementById("wizardNext"),submit=document.getElementById("wizardSubmit");
  const totalEls=[document.getElementById("wizardTotal"),document.getElementById("navTotal")];
  const progressEl=document.getElementById("wizardProgress"),stepLabel=document.getElementById("wizardStepLabel"),title=document.getElementById("wizardTitle");
  const titles=["Tu mascota","Servicios","Fecha y detalles","Confirmación"];
  const serviceChecks=[...bookingWizard.querySelectorAll('input[name="services"]')];
  const total=()=>serviceChecks.filter(x=>x.checked).reduce((n,x)=>n+Number(x.dataset.price||0),0);
  const refreshTotal=()=>totalEls.forEach(x=>{if(x)x.textContent="$"+total()});
  serviceChecks.forEach(x=>x.addEventListener("change",refreshTotal));refreshTotal();
  function renderStep(){
    steps.forEach((x,i)=>x.classList.toggle("active",i===step-1));
    progressEl.style.width=(step*25)+"%";stepLabel.textContent="PASO "+step+" DE 4";title.textContent=titles[step-1];
    back.style.visibility=step===1?"hidden":"visible";next.style.display=step===4?"none":"inline-block";submit.style.display=step===4?"inline-block":"none";
    if(step===4){
      const fd=new FormData(bookingWizard),services=serviceChecks.filter(x=>x.checked).map(x=>x.value);
      document.getElementById("wizardReview").innerHTML=`<div><span>Mascota</span><b>${fd.get("pet")||""}</b></div><div><span>Raza</span><b>${fd.get("breed")||""}</b></div><div><span>Servicios</span><b>${services.join(", ")}</b></div><div><span>Total estimado</span><b>$${total()}</b></div>`;
    }
  }
  function validCurrent(){
    if(step===2&&!serviceChecks.some(x=>x.checked)){alert("Selecciona al menos un servicio.");return false}
    const required=[...steps[step-1].querySelectorAll("[required]")];
    for(const el of required){if(!el.reportValidity())return false}return true;
  }
  document.querySelectorAll("[data-open-booking]").forEach(x=>x.addEventListener("click",()=>{bookingDrawer.classList.add("open");bookingDrawer.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";step=1;renderStep()}));
  document.querySelectorAll("[data-close-booking]").forEach(x=>x.addEventListener("click",()=>{bookingDrawer.classList.remove("open");bookingDrawer.setAttribute("aria-hidden","true");document.body.style.overflow=""}));
  next.addEventListener("click",()=>{if(validCurrent()){step++;renderStep()}});
  back.addEventListener("click",()=>{if(step>1){step--;renderStep()}});
  const breedInput=document.getElementById("breedInput"),breedResults=document.getElementById("breedResults");
  function showBreeds(){
    const q=breedInput.value.trim().toLowerCase();
    if(!q){breedResults.classList.remove("show");return}
    const matches=breedNames.filter(x=>x.toLowerCase().includes(q)).slice(0,8);
    breedResults.innerHTML=matches.map(x=>`<button type="button">${x}</button>`).join("");
    breedResults.classList.toggle("show",matches.length>0);
    breedResults.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{breedInput.value=b.textContent;breedResults.classList.remove("show")}));
  }
  breedInput.addEventListener("input",showBreeds);
  document.addEventListener("click",e=>{if(!e.target.closest(".breed-combobox"))breedResults.classList.remove("show")});
  const dateInput=bookingWizard.querySelector('[name="date"]');if(dateInput)dateInput.min=new Date().toISOString().split("T")[0];
  bookingWizard.addEventListener("submit",async e=>{
    e.preventDefault();if(!validCurrent())return;
    const fd=new FormData(bookingWizard),services=serviceChecks.filter(x=>x.checked).map(x=>x.value);
    const data=Object.fromEntries(fd.entries());data.services=services;data.service=services.join(", ");data.total=total();
    const status=document.getElementById("wizardStatus");submit.disabled=true;submit.textContent="Enviando…";
    try{const r=await fetch("/api/booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const out=await r.json();status.textContent=out?.saved||out?.sent?"Solicitud recibida. Te contactaremos para confirmar la cita.":"No pudimos guardar la solicitud. Intenta de nuevo.";status.className="status-box show "+(out?.saved||out?.sent?"ok":"warn");if(out?.saved||out?.sent)bookingWizard.reset();refreshTotal()}
    catch{status.textContent="No pudimos enviar la solicitud. Intenta de nuevo.";status.className="status-box show warn"}
    finally{submit.disabled=false;submit.textContent="Solicitar cita →"}
  });
  renderStep();
}
