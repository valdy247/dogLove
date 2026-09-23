# Pawsitive Love Dog — demos

## Entrada
- `index.html`: selector entre la propuesta de **$500** y la de **$1,500**.
- `500.html`: demo esencial.
- `1500.html`: home de la experiencia premium.

## Versión premium de $1,500
La demo premium está construida como una web completa:
- `1500.html`: inicio.
- `premium-services.html`: servicios.
- `premium-about.html`: nosotros / enfoque.
- `premium-gallery.html`: galería preparada para contenido real.
- `premium-booking.html`: reserva, WhatsApp y flujo de pago.

Incluye diseño premium responsive, animaciones, formulario de reserva, eventos preparados para Analytics, SEO on-page/schema, automatización de solicitudes y checkout de Stripe preparado.

### Imagen del hero
Sube la imagen al root del repo con este nombre exacto:
`fondo.jpg`

### Activar Google Analytics
En cada HTML premium se puede añadir el Measurement ID como atributo del elemento HTML:
`<html lang="es" data-ga-id="G-XXXXXXXXXX">`

El JavaScript cargará GA4 y registrará eventos como WhatsApp, teléfono, reserva y pago.

### Activar Stripe en Vercel
Añadir estas variables:
- `STRIPE_SECRET_KEY`
- `STRIPE_GROOMING_PRICE_ID`
- `STRIPE_TRAINING_PRICE_ID`
- `STRIPE_CARE_PRICE_ID`

Los Price IDs permiten que el dueño defina el depósito/precio real sin hardcodearlo en la web.

### Activar automatización de reservas por email
Añadir:
- `RESEND_API_KEY`
- `BOOKING_EMAIL_TO`
- `BOOKING_EMAIL_FROM`

La solicitud se envía por email y también prepara WhatsApp como vía de confirmación.

No se inventaron precios, reseñas, ubicación ni fotos reales del negocio; esos datos se completan con la información del cliente.
