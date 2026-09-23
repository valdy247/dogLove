module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const data=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
    const {name="",email="",phone="",pet="",breed="",services=[],service="",total=0,date="",time="",notes=""}=data;
    const selected=Array.isArray(services)&&services.length?services:String(service||"").split(",").map(x=>x.trim()).filter(Boolean);
    if(!name||!email||!phone||!pet||!breed||!selected.length) return res.status(400).json({error:"Missing required fields"});

    let saved=false;
    const supabaseUrl=process.env.SUPABASE_URL;
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(supabaseUrl&&serviceKey){
      const db=await fetch(supabaseUrl.replace(/\/$/,"")+"/rest/v1/doglove_booking_requests",{
        method:"POST",
        headers:{"apikey":serviceKey,"Authorization":"Bearer "+serviceKey,"Content-Type":"application/json","Prefer":"return=minimal"},
        body:JSON.stringify({customer_name:name,email,phone,pet_name:pet,breed,services:selected,estimated_total:Number(total)||0,preferred_date:date||null,preferred_time:time||null,notes:notes||null,status:"new"})
      });
      saved=db.ok;
    }

    let sent=false;
    const apiKey=process.env.RESEND_API_KEY,to=process.env.BOOKING_EMAIL_TO,from=process.env.BOOKING_EMAIL_FROM;
    if(apiKey&&to&&from){
      const text=["Nueva solicitud de Pawsitive Love Dog","",
        "Cliente: "+name,"Email: "+email,"Teléfono: "+phone,
        "Mascota: "+pet,"Raza: "+breed,
        "Servicios: "+selected.join(", "),"Total estimado: $"+(Number(total)||0),
        "Fecha: "+(date||"Por coordinar"),"Horario: "+(time||"Flexible"),
        "Notas: "+(notes||"Ninguna")].join("\n");
      const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({from,to:[to],reply_to:email,subject:"Nueva cita — "+pet+" · $"+(Number(total)||0),text})});
      sent=response.ok;
    }
    return res.status(200).json({saved,sent});
  }catch(error){return res.status(500).json({error:"Booking error"})}
};