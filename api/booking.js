module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const data=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
    const {name="",phone="",pet="",service="",date="",time="",notes=""}=data;
    if(!name||!phone||!pet||!service) return res.status(400).json({error:"Missing required fields"});
    const apiKey=process.env.RESEND_API_KEY;
    const to=process.env.BOOKING_EMAIL_TO;
    const from=process.env.BOOKING_EMAIL_FROM;
    if(!apiKey||!to||!from) return res.status(200).json({sent:false,configured:false});
    const text=[
      "Nueva solicitud de Pawsitive Love Dog",
      "",
      "Nombre: "+name,
      "Teléfono: "+phone,
      "Mascota: "+pet,
      "Servicio: "+service,
      "Fecha: "+(date||"Por coordinar"),
      "Horario: "+(time||"Flexible"),
      "Notas: "+(notes||"Ninguna")
    ].join("\n");
    const response=await fetch("https://api.resend.com/emails",{
      method:"POST",
      headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({from,to:[to],subject:"Nueva reserva — "+service,text})
    });
    if(!response.ok) return res.status(200).json({sent:false,configured:true});
    return res.status(200).json({sent:true});
  }catch(error){
    return res.status(500).json({error:"Booking error"});
  }
};