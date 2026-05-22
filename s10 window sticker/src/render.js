function renderSticker(sticker) {
  const out = document.getElementById("sticker-output");

  if (sticker.error) {
    out.innerHTML = `<p style="color:red">${sticker.error}</p>`;
    return;
  }

  out.innerHTML = `
    <h2>${sticker.year} ${sticker.make} ${sticker.model}</h2>
    <p><strong>VIN:</strong> ${sticker.vin}</p>
    <p><strong>Trim:</strong> ${sticker.trim}</p>
    <p><strong>Engine:</strong> ${sticker.engine}</p>

    <h3>Options</h3>
    <ul>
      ${sticker.options.map(o => `<li>${o.code} — ${o.description}</li>`).join("")}
    </ul>
  `;
}
