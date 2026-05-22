/**
 * Sticker Builder - Assembles all vehicle data into a complete sticker object
 * Loads JSON data and maps decoded VIN + user selections to sticker fields.
 */

const StickerBuilder = (() => {
  // Data stores (loaded from JSON)
  let DATA = {
    years: [],
    trims: [],
    engines: [],
    options: [],
    pricing: [],
    colors: [],
    rpoCodes: [],
    standardEquipment: [],
    fuelEconomy: [],
    transmissions: [],
    plants: {}
  };

  let dataLoaded = false;

  async function loadData() {
    if (dataLoaded) return;
    
    try {
      const basePath = '../data/';
      const [years, trims, engines, options, pricing, colors, rpoCodes, stdEquip, fuel, trans, plants] = await Promise.all([
        fetch(basePath + 's10_years.json').then(r => r.json()),
        fetch(basePath + 's10_trims.json').then(r => r.json()),
        fetch(basePath + 's10_engines.json').then(r => r.json()),
        fetch(basePath + 's10_options.json').then(r => r.json()),
        fetch(basePath + 's10_pricing.json').then(r => r.json()),
        fetch(basePath + 's10_colors.json').then(r => r.json()),
        fetch(basePath + 'rpo_codes.json').then(r => r.json()),
        fetch(basePath + 's10_standard_equipment.json').then(r => r.json()),
        fetch(basePath + 's10_fuel_economy.json').then(r => r.json()),
        fetch(basePath + 's10_transmissions.json').then(r => r.json()),
        fetch(basePath + 's10_plants.json').then(r => r.json())
      ]);

      DATA = { years, trims, engines, options, pricing, colors, rpoCodes, standardEquipment: stdEquip, fuelEconomy: fuel, transmissions: trans, plants };
      dataLoaded = true;
    } catch (err) {
      console.error('Failed to load data:', err);
      throw new Error('Unable to load vehicle database. Please try again.');
    }
  }

  function getData() {
    return DATA;
  }

  function getTrimsForYear(year) {
    const entry = DATA.trims.find(t => t.year === year);
    return entry ? entry.trims : [];
  }

  function getBodyStylesForYear(year) {
    const entry = DATA.years.find(y => y.year === year);
    return entry ? entry.bodyStyles : ['Regular Cab'];
  }

  function getEnginesForYearTrim(year, trimName) {
    const yearData = DATA.trims.find(t => t.year === year);
    if (!yearData) return [];
    const trim = yearData.trims.find(t => t.name === trimName);
    return trim ? trim.engines : [];
  }

  function getTransmissionsForYear(year) {
    return DATA.transmissions.filter(t => t.years.includes(year));
  }

  function getColorsForYear(year) {
    const entry = DATA.colors.find(c => c.year === year);
    return entry ? entry.colors : [];
  }

  function getOptionsForYear(year) {
    return DATA.options.filter(o => o.years.includes(year));
  }

  function getPlantName(code) {
    return DATA.plants[code] || 'Unknown Plant';
  }

  function getPricing(year, trim) {
    const entry = DATA.pricing.find(p => p.year === year && p.trim === trim);
    return entry || { baseMsrp: 0, destination: 0, approximate: true };
  }

  function getStandardEquipment(year, trim) {
    // Find matching standard equipment entry
    const matches = DATA.standardEquipment.filter(e => {
      return year >= e.yearRange[0] && year <= e.yearRange[1] && e.trim === trim;
    });
    if (matches.length > 0) {
      return matches[0].equipment;
    }
    // Fallback to Base if trim not found
    const base = DATA.standardEquipment.filter(e => {
      return year >= e.yearRange[0] && year <= e.yearRange[1] && e.trim === 'Base';
    });
    return base.length > 0 ? base[0].equipment : [];
  }

  function getFuelEconomy(engine, year, drivetrain) {
    // Normalize engine description for matching
    const engineNorm = engine.replace(/\s+/g, ' ').trim();
    
    const match = DATA.fuelEconomy.find(fe => {
      const feEngine = fe.engine.replace(/\s+/g, ' ').trim();
      return engineNorm.includes(feEngine) && 
             fe.years.includes(year) && 
             fe.drivetrain === drivetrain;
    });

    if (match) {
      return { city: match.mpgCity, highway: match.mpgHighway };
    }

    // Try without drivetrain match
    const partial = DATA.fuelEconomy.find(fe => {
      const feEngine = fe.engine.replace(/\s+/g, ' ').trim();
      return engineNorm.includes(feEngine) && fe.years.includes(year);
    });

    if (partial) {
      return { city: partial.mpgCity, highway: partial.mpgHighway };
    }

    return { city: '--', highway: '--' };
  }

  function resolveRPOCodes(codes) {
    return codes.map(code => {
      const upper = code.toUpperCase().trim();
      const found = DATA.rpoCodes.find(r => r.code === upper);
      const optPricing = DATA.options.find(o => o.code === upper);
      return {
        code: upper,
        description: found ? found.description : 'Unknown Option',
        category: found ? found.category : 'Other',
        price: optPricing ? optPricing.price : 0
      };
    }).filter(r => r.description !== 'Unknown Option' || r.code.length > 0);
  }

  function inferTrimFromData(year, engine, bodyStyle, rpoList) {
    const yearTrims = getTrimsForYear(year);
    if (yearTrims.length === 0) return 'Base';

    // Check RPO codes for trim indicators
    const rpoUpper = rpoList.map(r => r.toUpperCase().trim());
    if (rpoUpper.includes('ZR2')) return 'ZR2';
    
    // Check if engine limits trim options
    const possibleTrims = yearTrims.filter(t => {
      return t.engines.includes(engine) && t.bodyStyles.includes(bodyStyle);
    });

    if (possibleTrims.length === 1) return possibleTrims[0].name;
    if (possibleTrims.length > 1) {
      // Prefer LS over Base if we see options indicating higher trim
      const hasUpscaleOptions = rpoUpper.some(r => 
        ['A31', 'AU3', 'K34', 'AR9', 'UP0'].includes(r)
      );
      if (hasUpscaleOptions) {
        const ls = possibleTrims.find(t => t.name === 'LS');
        if (ls) return 'LS';
      }
      return possibleTrims[0].name;
    }

    return yearTrims[0].name;
  }

  function buildSticker(config) {
    const { vin, year, trim, bodyStyle, engine, transmission, drivetrain, color, plant, selectedOptions, rpoList } = config;

    const pricing = getPricing(year, trim);
    const stdEquip = getStandardEquipment(year, trim);
    const fuelEcon = getFuelEconomy(engine, year, drivetrain);
    
    // Build options with pricing
    let optionsTotal = 0;
    const formattedOptions = selectedOptions.map(opt => {
      optionsTotal += (opt.price || 0);
      return opt;
    });

    const totalMsrp = pricing.baseMsrp + pricing.destination + optionsTotal;

    return {
      vin,
      year,
      make: 'Chevrolet',
      model: 'S-10',
      trim,
      bodyStyle,
      engine,
      transmission,
      drivetrain,
      color,
      plant,
      standardEquipment: stdEquip,
      options: formattedOptions,
      fuelEconomy: fuelEcon,
      pricing: {
        baseMsrp: pricing.baseMsrp,
        destination: pricing.destination,
        optionsTotal,
        totalMsrp,
        approximate: pricing.approximate !== false
      }
    };
  }

  return {
    loadData,
    getData,
    getTrimsForYear,
    getBodyStylesForYear,
    getEnginesForYearTrim,
    getTransmissionsForYear,
    getColorsForYear,
    getOptionsForYear,
    getPlantName,
    getPricing,
    getStandardEquipment,
    getFuelEconomy,
    resolveRPOCodes,
    inferTrimFromData,
    buildSticker
  };
})();
