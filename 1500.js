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
