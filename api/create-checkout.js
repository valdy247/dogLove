module.exports = async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):(req.body||{});
    const service=String(body.service||"");
    const priceMap={
      "Pet Grooming":process.env.STRIPE_GROOMING_PRICE_ID,
      "Entrenamiento Canino":process.env.STRIPE_TRAINING_PRICE_ID,
      "Cuidado Personalizado":process.env.STRIPE_CARE_PRICE_ID
    };
    const priceId=priceMap[service];
    const secret=process.env.STRIPE_SECRET_KEY;
    if(!secret||!priceId){
      return res.status(503).json({configured:false,message:"Stripe is ready to connect. Add STRIPE_SECRET_KEY and the service Price IDs in Vercel."});
    }
    const origin=req.headers.origin||("https://"+req.headers.host);
    const params=new URLSearchParams();
    params.set("mode","payment");
    params.set("line_items[0][price]",priceId);
    params.set("line_items[0][quantity]","1");
    params.set("success_url",origin+"/premium-booking.html?payment=success");
    params.set("cancel_url",origin+"/premium-booking.html?payment=cancelled");
    params.set("metadata[service]",service);
    const stripe=await fetch("https://api.stripe.com/v1/checkout/sessions",{
      method:"POST",
      headers:{"Authorization":"Bearer "+secret,"Content-Type":"application/x-www-form-urlencoded"},
      body:params.toString()
    });
    const data=await stripe.json();
    if(!stripe.ok||!data.url) return res.status(502).json({error:"Could not create checkout session",details:data.error?.message||"Stripe error"});
    return res.status(200).json({url:data.url});
  }catch(error){
    return res.status(500).json({error:"Checkout error"});
  }
};