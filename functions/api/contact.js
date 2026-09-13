// Cloudflare Pages Function — POST /api/contact
// Recibe el formulario de contacto y lo envía por email usando Resend.
// La API key vive en la variable de entorno RESEND_API_KEY (Cloudflare Pages → Settings → Environment variables → Secret).
// Nunca hardcodear la key acá: este archivo se sube a un repo de GitHub.

const TO_EMAIL = "mariapazshowroomm@gmail.com";
const FROM_EMAIL = "onboarding@resend.dev"; // dominio de pruebas de Resend, no requiere verificación

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const nombre = (body.nombre || "").toString().trim().slice(0, 200);
    const email = (body.email || "").toString().trim().slice(0, 200);
    const mensaje = (body.mensaje || "").toString().trim().slice(0, 5000);

    if (!nombre || !email || !mensaje) {
      return new Response(JSON.stringify({ error: "Faltan datos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `María Paz Web <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `Nuevo mensaje de ${nombre} — web María Paz`,
        html: `
          <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return new Response(JSON.stringify({ error: "Resend error", detail: errText }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
