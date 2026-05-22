/**
 * S-10 Window Sticker Generator - Application Controller
 * Manages the flow: Hero (VIN Entry) -> Review -> Preview & Download
 */

(function() {
  'use strict';

  let decodedVIN = null;
  let currentSticker = null;
  let pendingDownloadType = null;

  // DOM refs
  const heroSection = document.getElementById('hero-section');
  const step2Panel = document.getElementById('step-2-panel');
  const step3Panel = document.getElementById('step-3-panel');
  const vinInput = document.getElementById('vin-input');
  const vinCounter = document.getElementById('vin-counter');
  const vinError = document.getElementById('vin-error');
  const rpoInput = document.getElementById('rpo-input');
  const rpoToggleBtn = document.getElementById('rpo-toggle-btn');
  const rpoInputArea = document.getElementById('rpo-input-area');
  const decodeBtn = document.getElementById('decode-btn');
  const decodedSummary = document.getElementById('decoded-summary');
  const editYear = document.getElementById('edit-year');
  const editTrim = document.getElementById('edit-trim');
  const editBody = document.getElementById('edit-body');
  const editEngine = document.getElementById('edit-engine');
  const editTransmission = document.getElementById('edit-transmission');
  const editDrivetrain = document.getElementById('edit-drivetrain');
  const editColor = document.getElementById('edit-color');
  const editPlant = document.getElementById('edit-plant');
  const optionsGrid = document.getElementById('options-grid');
  const optionsCount = document.getElementById('options-count');
  const stickerWrapper = document.getElementById('sticker-wrapper');
  const disclaimerModal = document.getElementById('disclaimer-modal');
  const disclaimerAgree = document.getElementById('disclaimer-agree');
  const disclaimerAccept = document.getElementById('disclaimer-accept');

  async function init() {
    await StickerBuilder.loadData();
    bindEvents();
    populateYearDropdown();
  }

  function bindEvents() {
    vinInput.addEventListener('input', onVINInput);
    vinInput.addEventListener('keypress', e => { if (e.key === 'Enter' && !decodeBtn.disabled) onDecode(); });
    decodeBtn.addEventListener('click', onDecode);

    rpoToggleBtn.addEventListener('click', () => {
      const showing = rpoInputArea.style.display !== 'none';
      rpoInputArea.style.display = showing ? 'none' : 'block';
      rpoToggleBtn.querySelector('svg').style.transform = showing ? '' : 'rotate(45deg)';
    });

    document.getElementById('back-to-step1').addEventListener('click', () => showSection('hero'));
    document.getElementById('back-to-step2').addEventListener('click', () => showSection('step2'));
    document.getElementById('generate-sticker-btn').addEventListener('click', onGenerate);
    document.getElementById('new-sticker-btn').addEventListener('click', onReset);
    document.getElementById('download-pdf-btn').addEventListener('click', () => requestDownload('pdf'));
    document.getElementById('download-png-btn').addEventListener('click', () => requestDownload('png'));

    disclaimerAgree.addEventListener('change', () => { disclaimerAccept.disabled = !disclaimerAgree.checked; });
    disclaimerAccept.addEventListener('click', onAcceptDisclaimer);
    document.getElementById('disclaimer-cancel').addEventListener('click', closeModal);

    editYear.addEventListener('change', onYearChange);
    editTrim.addEventListener('change', onTrimChange);

    // Update options count on any checkbox change
    optionsGrid.addEventListener('change', updateOptionsCount);
  }

  function onVINInput() {
    const val = vinInput.value.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
    vinInput.value = val;
    vinCounter.textContent = `${val.length} / 17`;

    if (val.length === 17) {
      const check = VINDecoder.validateFormat(val);
      if (check.valid) { vinError.textContent = ''; decodeBtn.disabled = false; }
      else { vinError.textContent = check.error; decodeBtn.disabled = true; }
    } else {
      vinError.textContent = '';
      decodeBtn.disabled = true;
    }
  }

  async function onDecode() {
    const vin = vinInput.value.trim().toUpperCase();
    decodeBtn.querySelector('.btn-decode-text').style.display = 'none';
    decodeBtn.querySelector('.btn-decode-loading').style.display = 'inline-flex';
    decodeBtn.disabled = true;

    await new Promise(r => setTimeout(r, 500));

    const result = VINDecoder.decode(vin);
    if (result.error) {
      vinError.textContent = result.error;
      resetDecodeBtn();
      return;
    }

    decodedVIN = result;
    const rpoText = rpoInput.value.trim();
    const rpoList = rpoText ? rpoText.split(/[\s,]+/).filter(Boolean) : [];
    populateStep2(result, rpoList);
    showSection('step2');
    resetDecodeBtn();
  }

  function resetDecodeBtn() {
    decodeBtn.querySelector('.btn-decode-text').style.display = 'inline';
    decodeBtn.querySelector('.btn-decode-loading').style.display = 'none';
    decodeBtn.disabled = vinInput.value.length !== 17;
  }

  function populateStep2(decoded, rpoList) {
    let html = `<strong>VIN decoded:</strong> ${decoded.year} Chevrolet S-10 ${decoded.bodyStyle}`;
    if (decoded.warnings && decoded.warnings.length) {
      html += ` <span style="color:#b45309;"> — ${decoded.warnings[0]}</span>`;
    }
    decodedSummary.innerHTML = html;

    editYear.value = String(decoded.year);
    onYearChange();
    editDrivetrain.value = decoded.drivetrain;
    if (decoded.bodyStyle) editBody.value = decoded.bodyStyle;

    const inferredTrim = StickerBuilder.inferTrimFromData(decoded.year, decoded.engineFromVIN, decoded.bodyStyle, rpoList);
    editTrim.value = inferredTrim;
    onTrimChange();

    if (decoded.engineFromVIN && decoded.engineFromVIN !== 'Unknown') editEngine.value = decoded.engineFromVIN;
    editPlant.value = StickerBuilder.getPlantName(decoded.plantCode);

    const trans = StickerBuilder.getTransmissionsForYear(decoded.year);
    if (trans.length) editTransmission.value = trans[0].description;

    const colors = StickerBuilder.getColorsForYear(decoded.year);
    if (colors.length) editColor.value = colors[0].name;

    populateOptions(decoded.year, rpoList);
  }

  function populateYearDropdown() {
    const data = StickerBuilder.getData();
    editYear.innerHTML = data.years.map(y => `<option value="${y.year}">${y.year}</option>`).join('');
  }

  function onYearChange() {
    const year = parseInt(editYear.value);
    const trims = StickerBuilder.getTrimsForYear(year);
    editTrim.innerHTML = trims.map(t => `<option value="${t.name}">${t.name}</option>`).join('');

    const bodies = StickerBuilder.getBodyStylesForYear(year);
    editBody.innerHTML = bodies.map(b => `<option value="${b}">${b}</option>`).join('');

    const colors = StickerBuilder.getColorsForYear(year);
    editColor.innerHTML = colors.map(c => `<option value="${c.name}">${c.name} (${c.code})</option>`).join('');

    const trans = StickerBuilder.getTransmissionsForYear(year);
    editTransmission.innerHTML = trans.map(t => `<option value="${t.description}">${t.description}</option>`).join('');

    onTrimChange();
  }

  function onTrimChange() {
    const year = parseInt(editYear.value);
    const trim = editTrim.value;
    const engines = StickerBuilder.getEnginesForYearTrim(year, trim);
    editEngine.innerHTML = engines.map(e => `<option value="${e}">${e}</option>`).join('');
  }

  function populateOptions(year, preSelected = []) {
    const opts = StickerBuilder.getOptionsForYear(year);
    optionsGrid.innerHTML = opts.map(opt => {
      const checked = preSelected.includes(opt.code) ? 'checked' : '';
      const priceStr = opt.price === 0 ? 'N/C' : (opt.price < 0 ? '-$' + Math.abs(opt.price) : '$' + opt.price);
      return `<label class="option-item">
        <input type="checkbox" value="${opt.code}" ${checked}>
        <span class="option-desc">${opt.code} — ${opt.description}</span>
        <span class="option-price">${priceStr}</span>
      </label>`;
    }).join('');
    updateOptionsCount();
  }

  function updateOptionsCount() {
    const count = optionsGrid.querySelectorAll('input:checked').length;
    optionsCount.textContent = `${count} selected`;
  }

  function onGenerate() {
    const year = parseInt(editYear.value);
    const checkedOpts = [];
    optionsGrid.querySelectorAll('input:checked').forEach(cb => {
      const allOpts = StickerBuilder.getOptionsForYear(year);
      const opt = allOpts.find(o => o.code === cb.value);
      if (opt) checkedOpts.push({ code: opt.code, description: opt.description, price: opt.price });
    });

    currentSticker = StickerBuilder.buildSticker({
      vin: decodedVIN ? decodedVIN.vin : 'N/A',
      year,
      trim: editTrim.value,
      bodyStyle: editBody.value,
      engine: editEngine.value,
      transmission: editTransmission.value,
      drivetrain: editDrivetrain.value,
      color: editColor.value,
      plant: editPlant.value,
      selectedOptions: checkedOpts,
      rpoList: []
    });

    StickerRenderer.render(currentSticker, stickerWrapper);
    showSection('step3');
  }

  function showSection(which) {
    heroSection.style.display = which === 'hero' ? '' : 'none';
    step2Panel.style.display = which === 'step2' ? '' : 'none';
    step3Panel.style.display = which === 'step3' ? '' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onReset() {
    decodedVIN = null;
    currentSticker = null;
    vinInput.value = '';
    rpoInput.value = '';
    vinCounter.textContent = '0 / 17';
    vinError.textContent = '';
    decodeBtn.disabled = true;
    stickerWrapper.innerHTML = '';
    showSection('hero');
  }

  function requestDownload(type) {
    pendingDownloadType = type;
    disclaimerModal.style.display = 'flex';
    disclaimerAgree.checked = false;
    disclaimerAccept.disabled = true;
  }

  function closeModal() {
    disclaimerModal.style.display = 'none';
    pendingDownloadType = null;
  }

  function onAcceptDisclaimer() {
    closeModal();
    if (pendingDownloadType === 'pdf') downloadPDF();
    else if (pendingDownloadType === 'png') downloadPNG();
  }

  async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    try {
      const canvas = await html2canvas(stickerWrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgW = pw - margin * 2;
      const imgH = (canvas.height / canvas.width) * imgW;
      const yOff = imgH < (ph - margin * 2) ? (ph - imgH) / 2 : margin;
      pdf.addImage(imgData, 'PNG', margin, yOff, imgW, Math.min(imgH, ph - margin * 2));
      pdf.save(`S10_${currentSticker.year}_${currentSticker.trim}_${currentSticker.vin}.pdf`);
    } catch (e) { console.error(e); alert('PDF generation failed.'); }
  }

  async function downloadPNG() {
    try {
      const canvas = await html2canvas(stickerWrapper, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const link = document.createElement('a');
      link.download = `S10_${currentSticker.year}_${currentSticker.trim}_${currentSticker.vin}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error(e); alert('PNG generation failed.'); }
  }

  init().catch(err => {
    console.error('Init failed:', err);
    document.querySelector('.vin-entry-body').innerHTML = `<p style="color:#dc2626;padding:12px;font-size:0.9rem;">Failed to load vehicle database: ${err.message}</p>`;
  });

})();
