const header=document.querySelector(".site-header");
const progress=document.getElementById("progress");
const menuToggle=document.getElementById("menuToggle");
const nav=document.getElementById("nav");
const modal=document.getElementById("bookingModal");
const serviceSelect=document.getElementById("serviceSelect");
const bookingForm=document.getElementById("bookingForm");

function track(eventName,params={}){
  if(typeof window.gtag==="function") window.gtag("event",eventName,params);
  console.info("[analytics-ready]",eventName,params);
}

function onScroll(){
  header.classList.toggle("scrolled",window.scrollY>20);
  const max=document.documentElement.scrollHeight-window.innerHeight;
  progress.style.width=(max?window.scrollY/max*100:0)+"%";
}
window.addEventListener("scroll",onScroll,{passive:true});
onScroll();

menuToggle.addEventListener("click",()=>{
  const open=nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded",String(open));
});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
},{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

document.querySelectorAll(".faq-item>button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const item=btn.closest(".faq-item");
    document.querySelectorAll(".faq-item.open").forEach(x=>{if(x!==item)x.classList.remove("open")});
    item.classList.toggle("open");
  });
});

function openBooking(service=""){
  if(service&&serviceSelect) serviceSelect.value=service;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modal-open");
  track("booking_open",{service:service||"unspecified"});
  setTimeout(()=>modal.querySelector("input")?.focus(),100);
}
function closeBooking(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modal-open");
}
document.querySelectorAll(".js-book").forEach(btn=>btn.addEventListener("click",()=>openBooking()));
document.querySelectorAll(".js-service").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const service=btn.dataset.service||btn.closest("[data-service]")?.dataset.service||"";
    openBooking(service);
  });
});
document.querySelectorAll("[data-close]").forEach(el=>el.addEventListener("click",closeBooking));
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeBooking()});

bookingForm.addEventListener("submit",e=>{
  e.preventDefault();
  const data=new FormData(bookingForm);
  const name=data.get("name")||"";
  const phone=data.get("phone")||"";
  const pet=data.get("pet")||"";
  const service=data.get("service")||"";
  const date=data.get("date")||"Por coordinar";
  const time=data.get("time")||"Flexible";
  const notes=data.get("notes")||"Ninguna";
  const message=[
    "Hola Pawsitive Love Dog 🐾",
    "",
    "Me gustaría solicitar una cita.",
    `Nombre: ${name}`,
    `Teléfono: ${phone}`,
    `Mascota: ${pet}`,
    `Servicio: ${service}`,
    `Fecha preferida: ${date}`,
    `Horario: ${time}`,
    `Notas: ${notes}`
  ].join("\n");
  track("booking_submit",{service});
  window.open("https://wa.me/13059343028?text="+encodeURIComponent(message),"_blank","noopener");
});

document.querySelectorAll('a[href^="https://wa.me"]').forEach(link=>{
  link.addEventListener("click",()=>track("whatsapp_click",{location:"site"}));
});
document.querySelectorAll('a[href^="tel:"]').forEach(link=>{
  link.addEventListener("click",()=>track("phone_click"));
});