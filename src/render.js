/**
 * Sticker Renderer - Generates an authentic Monroney-style document
 * Unique layout inspired by but distinct from factory labels
 */

const StickerRenderer = (() => {

  function fmt(amount) {
    if (typeof amount !== 'number' || amount === 0) return 'N/C';
    if (amount < 0) return '-$' + Math.abs(amount).toLocaleString('en-US');
    return '$' + amount.toLocaleString('en-US');
  }

  function render(sticker, container) {
    const stdItems = sticker.standardEquipment.map(item =>
      `<li>${item}</li>`
    ).join('');

    const optRows = sticker.options.length > 0 ? sticker.options.map(opt => `
      <tr>
        <td class="opt-code-cell">${opt.code}</td>
        <td class="opt-desc-cell">${opt.description}</td>
        <td class="opt-price-cell">${fmt(opt.price)}</td>
      </tr>
    `).join('') : `<tr><td colspan="3" style="padding:8px 0;color:#999;font-style:italic;">No optional equipment selected</td></tr>`;

    const pricedOptions = sticker.options.filter(o => o.price > 0);
    const optionLines = pricedOptions.map(opt =>
      `<div class="price-line"><span class="price-label">${opt.description}</span><span class="price-amount">${fmt(opt.price)}</span></div>`
    ).join('');

    const fuelCity = sticker.fuelEconomy.city;
    const fuelHwy = sticker.fuelEconomy.highway;
    const driveDisplay = sticker.drivetrain === '4WD' ? 'Four-Wheel Drive' : 'Rear-Wheel Drive';

    const html = `
      <div class="sticker">
        <div class="sticker-outer-border">
          <!-- Top Bar -->
          <div class="sticker-topbar">
            <div class="sticker-topbar-left">
              <h1>${sticker.year} Chevrolet S-10</h1>
              <div class="sticker-subtitle">${sticker.trim} &bull; ${sticker.bodyStyle} &bull; ${sticker.engine}</div>
            </div>
            <div class="sticker-topbar-right">
              <div>
                <div class="sticker-vin-label">Vehicle Identification Number</div>
                <div class="sticker-vin-number">${sticker.vin}</div>
              </div>
              <div class="sticker-doc-type">Reconstructed Label</div>
            </div>
          </div>

          <!-- Vehicle Info Grid -->
          <div class="sticker-info-grid">
            <div class="sticker-info-cell">
              <div class="info-label">Model Year</div>
              <div class="info-value">${sticker.year}</div>
            </div>
            <div class="sticker-info-cell">
              <div class="info-label">Trim / Series</div>
              <div class="info-value">${sticker.trim}</div>
            </div>
            <div class="sticker-info-cell">
              <div class="info-label">Body Style</div>
              <div class="info-value">${sticker.bodyStyle}</div>
            </div>
            <div class="sticker-info-cell">
              <div class="info-label">Exterior Color</div>
              <div class="info-value">${sticker.color || 'Not Specified'}</div>
            </div>
            <div class="sticker-info-cell">
              <div class="info-label">Assembly Plant</div>
              <div class="info-value">${sticker.plant || 'N/A'}</div>
            </div>
            <div class="sticker-info-cell">
              <div class="info-label">Drivetrain</div>
              <div class="info-value">${driveDisplay}</div>
            </div>
          </div>

          <!-- Standard Equipment -->
          <div class="sticker-sec">
            <div class="sticker-sec-head">Standard Equipment</div>
            <ul class="sticker-std-list">
              ${stdItems}
            </ul>
          </div>

          <!-- Optional Equipment -->
          <div class="sticker-sec">
            <div class="sticker-sec-head">Optional Equipment &amp; Packages</div>
            <table class="sticker-opt-table">
              ${optRows}
            </table>
          </div>

          <!-- Engine & Mechanical -->
          <div class="sticker-sec">
            <div class="sticker-sec-head">Engine &amp; Mechanical Specifications</div>
            <div class="sticker-mech-grid">
              <div class="mech-row"><span class="mech-label">Engine</span><span class="mech-value">${sticker.engine}</span></div>
              <div class="mech-row"><span class="mech-label">Transmission</span><span class="mech-value">${sticker.transmission}</span></div>
              <div class="mech-row"><span class="mech-label">Drive Type</span><span class="mech-value">${driveDisplay}</span></div>
              <div class="mech-row"><span class="mech-label">Fuel Type</span><span class="mech-value">Regular Unleaded</span></div>
            </div>
          </div>

          <!-- EPA Fuel Economy -->
          <div class="sticker-sec">
            <div class="sticker-sec-head">EPA Estimated Fuel Economy</div>
            <div class="sticker-fuel">
              <div class="fuel-gauge">
                <div class="fuel-num">${fuelCity}</div>
                <div class="fuel-unit">City MPG</div>
              </div>
              <div class="fuel-gauge">
                <div class="fuel-num">${fuelHwy}</div>
                <div class="fuel-unit">Hwy MPG</div>
              </div>
              <div class="fuel-disclaimer">
                Estimated fuel economy based on EPA data for this engine and drivetrain configuration. Actual mileage will vary with driving conditions, vehicle condition, and driving habits.
              </div>
            </div>
          </div>

          <!-- Total MSRP -->
          <div class="sticker-sec">
            <div class="sticker-sec-head">Manufacturer's Suggested Retail Price</div>
            <div class="sticker-price-block">
              <div class="price-line">
                <span class="price-label">Base Vehicle Price (${sticker.year} S-10 ${sticker.trim})</span>
                <span class="price-amount">${fmt(sticker.pricing.baseMsrp)}</span>
              </div>
              ${optionLines}
              ${pricedOptions.length > 0 ? `
              <div class="price-line price-separator">
                <span class="price-label">Options Subtotal</span>
                <span class="price-amount">${fmt(sticker.pricing.optionsTotal)}</span>
              </div>` : ''}
              <div class="price-line">
                <span class="price-label">Destination &amp; Delivery</span>
                <span class="price-amount">${fmt(sticker.pricing.destination)}</span>
              </div>
              <div class="price-line price-total">
                <span class="price-label">TOTAL MSRP</span>
                <span class="price-amount">${fmt(sticker.pricing.totalMsrp)}</span>
              </div>
              ${sticker.pricing.approximate ? '<div class="price-approx">* All pricing is approximate, based on historical records for this model year and trim level.</div>' : ''}
            </div>
          </div>

          <!-- Document Footer -->
          <div class="sticker-doc-footer">
            <strong>Reconstructed Window Sticker &mdash; Not An Official Document</strong>
            Generated from historical data and VIN decoding. Not affiliated with or endorsed by General Motors, Chevrolet, or any OEM.
            For informational and enthusiast purposes only. S-10 StickerGen.
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  return { render };
})();
