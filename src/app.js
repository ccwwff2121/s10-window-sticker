/**
 * S-10 Window Sticker Generator - Main Application Controller
 * Manages the 3-step flow, user interactions, and export functionality.
 */

(function() {
  'use strict';

  // State
  let currentStep = 1;
  let decodedVIN = null;
  let currentSticker = null;
  let pendingDownloadType = null;

  // DOM Elements
  const vinInput = document.getElementById('vin-input');
  const vinCounter = document.getElementById('vin-counter');
  const vinError = document.getElementById('vin-error');
  const rpoInput = document.getElementById('rpo-input');
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
  const stickerWrapper = document.getElementById('sticker-wrapper');
  const disclaimerModal = document.getElementById('disclaimer-modal');
  const disclaimerAgree = document.getElementById('disclaimer-agree');
  const disclaimerAccept = document.getElementById('disclaimer-accept');

  // Initialize
  async function init() {
    await StickerBuilder.loadData();
    attachEventListeners();
    populateYearDropdown();
  }

  function attachEventListeners() {
    // VIN input
    vinInput.addEventListener('input', onVINInput);
    vinInput.addEventListener('paste', (e) => {
      setTimeout(onVINInput, 50);
    });

    // Decode button
    decodeBtn.addEventListener('click', onDecode);

    // Step navigation
    document.getElementById('back-to-step1').addEventListener('click', () => goToStep(1));
    document.getElementById('back-to-step2').addEventListener('click', () => goToStep(2));
    document.getElementById('generate-sticker-btn').addEventListener('click', onGenerateSticker);
    document.getElementById('new-sticker-btn').addEventListener('click', onNewSticker);

    // Download buttons
    document.getElementById('download-pdf-btn').addEventListener('click', () => requestDownload('pdf'));
    document.getElementById('download-png-btn').addEventListener('click', () => requestDownload('png'));

    // Disclaimer modal
    disclaimerAgree.addEventListener('change', () => {
      disclaimerAccept.disabled = !disclaimerAgree.checked;
    });
    disclaimerAccept.addEventListener('click', onDisclaimerAccepted);
    document.getElementById('disclaimer-cancel').addEventListener('click', closeDisclaimerModal);

    // Edit form changes
    editYear.addEventListener('change', onYearChange);
    editTrim.addEventListener('change', onTrimChange);
    editBody.addEventListener('change', onBodyChange);

    // Allow Enter to decode
    vinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !decodeBtn.disabled) {
        onDecode();
      }
    });
  }

  // VIN Input Handler
  function onVINInput() {
    const val = vinInput.value.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
    vinInput.value = val;
    vinCounter.textContent = `${val.length}/17`;
    
    if (val.length === 17) {
      const check = VINDecoder.validateFormat(val);
      if (check.valid) {
        vinError.textContent = '';
        decodeBtn.disabled = false;
      } else {
        vinError.textContent = check.error;
        decodeBtn.disabled = true;
      }
    } else {
      vinError.textContent = '';
      decodeBtn.disabled = true;
    }
  }

  // Decode VIN
  async function onDecode() {
    const vin = vinInput.value.trim().toUpperCase();
    
    // Show loading state
    decodeBtn.querySelector('.btn-text').style.display = 'none';
    decodeBtn.querySelector('.btn-loading').style.display = 'inline-flex';
    decodeBtn.disabled = true;

    // Small delay for UX
    await new Promise(r => setTimeout(r, 600));

    try {
      const result = VINDecoder.decode(vin);
      
      if (result.error) {
        vinError.textContent = result.error;
        resetDecodeButton();
        return;
      }

      decodedVIN = result;
      
      // Parse RPO codes
      const rpoText = rpoInput.value.trim();
      const rpoList = rpoText ? rpoText.split(/[\s,]+/).filter(Boolean) : [];

      // Populate step 2 with decoded data
      populateStep2(result, rpoList);
      goToStep(2);

    } catch (err) {
      vinError.textContent = 'An error occurred during decoding. Please try again.';
      console.error(err);
    }

    resetDecodeButton();
  }

  function resetDecodeButton() {
    decodeBtn.querySelector('.btn-text').style.display = 'inline';
    decodeBtn.querySelector('.btn-loading').style.display = 'none';
    decodeBtn.disabled = vinInput.value.length !== 17;
  }

  // Populate Step 2
  function populateStep2(decoded, rpoList) {
    // Show summary
    let summaryHTML = `<strong>VIN Decoded Successfully</strong> &mdash; ${decoded.year} Chevrolet S-10`;
    if (decoded.warnings && decoded.warnings.length > 0) {
      summaryHTML += `<br><span style="color:#b45309;">&#9888; ${decoded.warnings.join(', ')}</span>`;
    }
    decodedSummary.innerHTML = summaryHTML;

    // Set year
    editYear.value = String(decoded.year);
    onYearChange();

    // Set drivetrain
    editDrivetrain.value = decoded.drivetrain;

    // Set body style
    if (decoded.bodyStyle) {
      editBody.value = decoded.bodyStyle;
    }

    // Infer trim
    const inferredTrim = StickerBuilder.inferTrimFromData(
      decoded.year, decoded.engineFromVIN, decoded.bodyStyle, rpoList
    );
    editTrim.value = inferredTrim;
    onTrimChange();

    // Set engine
    if (decoded.engineFromVIN && decoded.engineFromVIN !== 'Unknown') {
      editEngine.value = decoded.engineFromVIN;
    }

    // Set plant
    editPlant.value = StickerBuilder.getPlantName(decoded.plantCode);

    // Set default transmission
    const transmissions = StickerBuilder.getTransmissionsForYear(decoded.year);
    if (transmissions.length > 0) {
      editTransmission.value = transmissions[0].description;
    }

    // Set default color
    const colors = StickerBuilder.getColorsForYear(decoded.year);
    if (colors.length > 0) {
      editColor.value = colors[0].name;
    }

    // Populate options and pre-check RPO-specified ones
    populateOptions(decoded.year, rpoList);
  }

  // Year dropdown
  function populateYearDropdown() {
    const data = StickerBuilder.getData();
    editYear.innerHTML = '';
    data.years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = String(y.year);
      opt.textContent = String(y.year);
      editYear.appendChild(opt);
    });
  }

  function onYearChange() {
    const year = parseInt(editYear.value);
    
    // Update trims
    const trims = StickerBuilder.getTrimsForYear(year);
    editTrim.innerHTML = '';
    trims.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = t.name;
      editTrim.appendChild(opt);
    });

    // Update body styles
    const bodies = StickerBuilder.getBodyStylesForYear(year);
    editBody.innerHTML = '';
    bodies.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      editBody.appendChild(opt);
    });

    // Update colors
    const colors = StickerBuilder.getColorsForYear(year);
    editColor.innerHTML = '';
    colors.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name;
      opt.textContent = `${c.name} (${c.code})`;
      editColor.appendChild(opt);
    });

    // Update transmissions
    const trans = StickerBuilder.getTransmissionsForYear(year);
    editTransmission.innerHTML = '';
    trans.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.description;
      opt.textContent = t.description;
      editTransmission.appendChild(opt);
    });

    onTrimChange();
  }

  function onTrimChange() {
    const year = parseInt(editYear.value);
    const trim = editTrim.value;
    
    // Update engines for this trim
    const engines = StickerBuilder.getEnginesForYearTrim(year, trim);
    editEngine.innerHTML = '';
    engines.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e;
      opt.textContent = e;
      editEngine.appendChild(opt);
    });
  }

  function onBodyChange() {
    // Could filter trims by body style if needed
  }

  // Options population
  function populateOptions(year, preSelectedCodes = []) {
    const options = StickerBuilder.getOptionsForYear(year);
    optionsGrid.innerHTML = '';

    options.forEach(opt => {
      const isChecked = preSelectedCodes.includes(opt.code);
      const div = document.createElement('label');
      div.className = 'option-item';
      div.innerHTML = `
        <input type="checkbox" value="${opt.code}" ${isChecked ? 'checked' : ''}>
        <span class="option-desc">${opt.code} - ${opt.description}</span>
        <span class="option-price">${opt.price === 0 ? 'N/C' : (opt.price < 0 ? '-$' + Math.abs(opt.price) : '$' + opt.price)}</span>
      `;
      optionsGrid.appendChild(div);
    });
  }

  // Generate Sticker
  function onGenerateSticker() {
    const year = parseInt(editYear.value);
    const trim = editTrim.value;
    const bodyStyle = editBody.value;
    const engine = editEngine.value;
    const transmission = editTransmission.value;
    const drivetrain = editDrivetrain.value;
    const color = editColor.value;
    const plant = editPlant.value;

    // Gather selected options
    const checkedOptions = [];
    optionsGrid.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
      const code = cb.value;
      const allOpts = StickerBuilder.getOptionsForYear(year);
      const opt = allOpts.find(o => o.code === code);
      if (opt) {
        checkedOptions.push({
          code: opt.code,
          description: opt.description,
          price: opt.price
        });
      }
    });

    const config = {
      vin: decodedVIN ? decodedVIN.vin : 'N/A',
      year,
      trim,
      bodyStyle,
      engine,
      transmission,
      drivetrain,
      color,
      plant,
      selectedOptions: checkedOptions,
      rpoList: []
    };

    currentSticker = StickerBuilder.buildSticker(config);
    
    // Render sticker
    StickerRenderer.render(currentSticker, stickerWrapper);
    
    goToStep(3);
  }

  // Download handling
  function requestDownload(type) {
    pendingDownloadType = type;
    disclaimerModal.style.display = 'flex';
    disclaimerAgree.checked = false;
    disclaimerAccept.disabled = true;
  }

  function closeDisclaimerModal() {
    disclaimerModal.style.display = 'none';
    pendingDownloadType = null;
  }

  function onDisclaimerAccepted() {
    closeDisclaimerModal();
    if (pendingDownloadType === 'pdf') {
      downloadPDF();
    } else if (pendingDownloadType === 'png') {
      downloadPNG();
    }
  }

  // PDF Export
  async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    
    try {
      const canvas = await html2canvas(stickerWrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availWidth = pageWidth - (margin * 2);
      
      const imgWidth = availWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;

      // Center vertically if it fits
      const yOffset = imgHeight < (pageHeight - margin * 2) 
        ? (pageHeight - imgHeight) / 2 
        : margin;

      pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, Math.min(imgHeight, pageHeight - margin * 2));
      
      const filename = `S10_Sticker_${currentSticker.year}_${currentSticker.trim}_${currentSticker.vin}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    }
  }

  // PNG Export
  async function downloadPNG() {
    try {
      const canvas = await html2canvas(stickerWrapper, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const link = document.createElement('a');
      link.download = `S10_Sticker_${currentSticker.year}_${currentSticker.trim}_${currentSticker.vin}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG generation failed:', err);
      alert('PNG generation failed. Please try again.');
    }
  }

  // New sticker
  function onNewSticker() {
    decodedVIN = null;
    currentSticker = null;
    vinInput.value = '';
    rpoInput.value = '';
    vinCounter.textContent = '0/17';
    vinError.textContent = '';
    decodeBtn.disabled = true;
    stickerWrapper.innerHTML = '';
    goToStep(1);
  }

  // Step Navigation
  function goToStep(step) {
    currentStep = step;
    
    // Update panels
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`step-${step}-panel`).classList.add('active');

    // Update progress bar
    document.querySelectorAll('.progress-bar .step').forEach(s => {
      const stepNum = parseInt(s.dataset.step);
      s.classList.remove('active', 'completed');
      if (stepNum === step) s.classList.add('active');
      else if (stepNum < step) s.classList.add('completed');
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Start the app
  init().catch(err => {
    console.error('App initialization failed:', err);
    document.getElementById('step-1-panel').querySelector('.panel-card').innerHTML = `
      <h2>Error Loading Application</h2>
      <p style="color:var(--error);">Failed to load vehicle database. Please refresh the page and try again.</p>
      <p style="color:var(--text-light); font-size:0.85rem;">Error: ${err.message}</p>
    `;
  });

})();
