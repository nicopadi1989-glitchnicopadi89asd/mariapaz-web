// Cloudflare Worker (Static Assets + API) — sirve la web y maneja POST /api/contact
// La API key de Resend vive en la variable de entorno RESEND_API_KEY
// (Cloudflare dashboard → tu Worker → Settings → Variables and Secrets → Add → Secret).
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

async function handleContact(request, env) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }
    // Todo lo demás (index.html, logo.png, etc.) lo sirve el binding de assets estáticos
    return env.ASSETS.fetch(request);
  },
};
