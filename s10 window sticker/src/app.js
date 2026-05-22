document.getElementById("generate-btn").addEventListener("click", () => {
  const vin = document.getElementById("vin-input").value.trim();
  const rpoText = document.getElementById("rpo-input").value.trim();
  const rpoList = rpoText ? rpoText.split(/[\s,]+/) : [];

  const decoded = decodeVin(vin);
  const sticker = buildSticker(decoded, rpoList);

  renderSticker(sticker);
});
