/**
 * Sticker Renderer - Generates the visual Monroney-style sticker HTML
 */

const StickerRenderer = (() => {

  function formatCurrency(amount) {
    if (amount === 0) return 'N/C';
    if (amount < 0) return '-$' + Math.abs(amount).toLocaleString();
    return '$' + amount.toLocaleString();
  }

  function render(sticker, container) {
    const optionsHTML = sticker.options.length > 0 ? sticker.options.map(opt => `
      <tr>
        <td class="opt-code">${opt.code}</td>
        <td class="opt-desc">${opt.description}</td>
        <td class="opt-price">${formatCurrency(opt.price)}</td>
      </tr>
    `).join('') : '<tr><td colspan="3" style="padding:6px 0; color:#888;">No optional equipment selected</td></tr>';

    const stdEquipHTML = sticker.standardEquipment.map(item => 
      `<li>${item}</li>`
    ).join('');

    const transmissionDisplay = sticker.transmission || 'Standard';
    const colorDisplay = sticker.color || 'Not Specified';
    const plantDisplay = sticker.plant || 'Not Specified';

    const fuelCity = sticker.fuelEconomy.city;
    const fuelHwy = sticker.fuelEconomy.highway;

    const html = `
      <div class="sticker">
        <div class="sticker-border">
          <!-- Header -->
          <div class="sticker-header">
            <div class="sticker-header-left">
              <h1>CHEVROLET S-10</h1>
              <div class="subtitle">${sticker.year} ${sticker.trim} ${sticker.bodyStyle}</div>
            </div>
            <div class="sticker-header-right">
              <div class="vin-display">VIN: ${sticker.vin}</div>
              <div>RECONSTRUCTED LABEL</div>
            </div>
          </div>

          <!-- Vehicle Description -->
          <div class="sticker-vehicle-desc">
            <div class="vd-item"><span class="vd-label">Year</span><span class="vd-value">${sticker.year}</span></div>
            <div class="vd-item"><span class="vd-label">Make</span><span class="vd-value">${sticker.make}</span></div>
            <div class="vd-item"><span class="vd-label">Model</span><span class="vd-value">S-10 Pickup</span></div>
            <div class="vd-item"><span class="vd-label">Trim</span><span class="vd-value">${sticker.trim}</span></div>
            <div class="vd-item"><span class="vd-label">Body</span><span class="vd-value">${sticker.bodyStyle}</span></div>
            <div class="vd-item"><span class="vd-label">Engine</span><span class="vd-value">${sticker.engine}</span></div>
            <div class="vd-item"><span class="vd-label">Trans</span><span class="vd-value">${transmissionDisplay}</span></div>
            <div class="vd-item"><span class="vd-label">Drive</span><span class="vd-value">${sticker.drivetrain}</span></div>
            <div class="vd-item"><span class="vd-label">Color</span><span class="vd-value">${colorDisplay}</span></div>
            <div class="vd-item"><span class="vd-label">Plant</span><span class="vd-value">${plantDisplay}</span></div>
          </div>

          <!-- Standard Equipment -->
          <div class="sticker-section">
            <div class="sticker-section-title">Standard Equipment</div>
            <ul class="sticker-equip-list">
              ${stdEquipHTML}
            </ul>
          </div>

          <!-- Optional Equipment -->
          <div class="sticker-section">
            <div class="sticker-section-title">Optional Equipment</div>
            <table class="sticker-options-table">
              ${optionsHTML}
            </table>
          </div>

          <!-- Engine & Mechanical -->
          <div class="sticker-section">
            <div class="sticker-section-title">Engine & Mechanical Specifications</div>
            <div class="sticker-engine-specs">
              <div class="spec-row"><span class="spec-label">Engine</span><span class="spec-value">${sticker.engine}</span></div>
              <div class="spec-row"><span class="spec-label">Transmission</span><span class="spec-value">${transmissionDisplay}</span></div>
              <div class="spec-row"><span class="spec-label">Drivetrain</span><span class="spec-value">${sticker.drivetrain === '4WD' ? 'Four-Wheel Drive' : 'Rear-Wheel Drive'}</span></div>
              <div class="spec-row"><span class="spec-label">Fuel Type</span><span class="spec-value">Regular Unleaded Gasoline</span></div>
            </div>
          </div>

          <!-- Fuel Economy -->
          <div class="sticker-section">
            <div class="sticker-section-title">Estimated EPA Fuel Economy</div>
            <div class="sticker-fuel-economy">
              <div class="fuel-badge">
                <div class="fuel-number">${fuelCity}</div>
                <div class="fuel-label">City MPG</div>
              </div>
              <div class="fuel-badge">
                <div class="fuel-number">${fuelHwy}</div>
                <div class="fuel-label">Hwy MPG</div>
              </div>
              <div class="fuel-note">
                Estimated fuel economy values are approximate reconstructions based on EPA data available for this model year and engine configuration. Actual mileage will vary.
              </div>
            </div>
          </div>

          <!-- Pricing -->
          <div class="sticker-section">
            <div class="sticker-section-title">Total Manufacturer's Suggested Retail Price</div>
            <div class="sticker-pricing">
              <div class="pricing-row">
                <span>Base Vehicle Price (${sticker.year} ${sticker.trim})</span>
                <span>${formatCurrency(sticker.pricing.baseMsrp)}</span>
              </div>
              ${sticker.options.filter(o => o.price !== 0).map(opt => `
                <div class="pricing-row">
                  <span>${opt.description}</span>
                  <span>${formatCurrency(opt.price)}</span>
                </div>
              `).join('')}
              <div class="pricing-row subtotal">
                <span>Options Subtotal</span>
                <span>${formatCurrency(sticker.pricing.optionsTotal)}</span>
              </div>
              <div class="pricing-row">
                <span>Destination Charge</span>
                <span>${formatCurrency(sticker.pricing.destination)}</span>
              </div>
              <div class="pricing-row total">
                <span>TOTAL MSRP${sticker.pricing.approximate ? '*' : ''}</span>
                <span>${formatCurrency(sticker.pricing.totalMsrp)}</span>
              </div>
              ${sticker.pricing.approximate ? '<div style="font-size:8px;color:#888;margin-top:4px;">* Pricing is approximate and based on historical records.</div>' : ''}
            </div>
          </div>

          <!-- Footer -->
          <div class="sticker-footer">
            <div class="disclaimer-line">RECONSTRUCTED WINDOW STICKER - NOT AN OFFICIAL DOCUMENT</div>
            <div class="disclaimer-line">This label is generated from historical data and user input. Not affiliated with or endorsed by General Motors, Chevrolet, or any OEM.</div>
            <div class="disclaimer-line">For informational and enthusiast purposes only. All pricing approximate unless otherwise noted.</div>
            <div class="disclaimer-line" style="margin-top:4px;">Generated by S-10 StickerGen</div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  return { render };
})();
