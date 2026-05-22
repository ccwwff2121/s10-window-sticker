/**
 * VIN Decoder for GM S-10 Trucks (1982-2004)
 * Handles validation, checksum verification, and position-based decoding.
 */

const VINDecoder = (() => {
  // VIN character weights for checksum calculation
  const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const TRANSLITERATION = {
    A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,J:1,K:2,L:3,M:4,N:5,P:7,R:9,
    S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9,
    '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9
  };

  // Model year codes (position 10)
  const YEAR_CODES = {
    'C':1982,'D':1983,'E':1984,'F':1985,'G':1986,'H':1987,'J':1988,
    'K':1989,'L':1990,'M':1991,'N':1992,'P':1993,'R':1994,'S':1995,
    'T':1996,'V':1997,'W':1998,'X':1999,'Y':2000,
    '1':2001,'2':2002,'3':2003,'4':2004
  };

  // GM division codes (position 2)
  const MAKE_CODES = {
    'G': 'Chevrolet (General Motors)',
    'C': 'Chevrolet',
    'B': 'Chevrolet (early)'
  };

  // Vehicle type / series from positions 4-5 for S-10
  const SERIES_MAP = {
    'CS': 'S-10 Regular Cab 2WD',
    'CT': 'S-10 Extended Cab 2WD',
    'CG': 'S-10 Crew Cab 2WD',
    'ZS': 'S-10 Regular Cab 4WD',
    'ZT': 'S-10 Extended Cab 4WD',
    'ZG': 'S-10 Crew Cab 4WD',
    'CC': 'S-10 Pickup',
    'ZC': 'S-10 Pickup 4WD'
  };

  // Engine codes (position 8) for S-10 
  const ENGINE_VIN_CODES = {
    'A': '2.5L I4',
    'E': '2.5L I4',
    'R': '2.5L I4',
    '4': '2.2L I4',
    'D': '2.2L I4',
    'S': '2.2L I4',
    'W': '4.3L V6',
    'X': '4.3L V6',
    'Z': '4.3L V6',
    'B': '2.8L V6',
    'L': '1.9L I4',
    'G': '2.0L I4',
    'N': '2.8L V6'
  };

  // Body style inference from VIN position 5
  const BODY_CODES_GEN2 = {
    'S': 'Regular Cab',
    'T': 'Extended Cab',
    'G': 'Crew Cab'
  };

  // Drivetrain from position 4 (2nd gen)
  const DRIVETRAIN_CODES = {
    'C': '2WD',
    'Z': '4WD'
  };

  function validateFormat(vin) {
    if (!vin || vin.length !== 17) {
      return { valid: false, error: 'VIN must be exactly 17 characters.' };
    }
    // VIN cannot contain I, O, or Q
    if (/[IOQ]/i.test(vin)) {
      return { valid: false, error: 'VIN cannot contain letters I, O, or Q.' };
    }
    // Must be alphanumeric
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      return { valid: false, error: 'VIN contains invalid characters.' };
    }
    return { valid: true };
  }

  function validateChecksum(vin) {
    const upper = vin.toUpperCase();
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const val = TRANSLITERATION[upper[i]];
      if (val === undefined) return false;
      sum += val * WEIGHTS[i];
    }
    const remainder = sum % 11;
    const checkChar = remainder === 10 ? 'X' : String(remainder);
    return upper[8] === checkChar;
  }

  function decode(vin) {
    const upper = vin.toUpperCase().trim();
    
    // Validate format
    const formatCheck = validateFormat(upper);
    if (!formatCheck.valid) {
      return { error: formatCheck.error };
    }

    // Check if it's a GM vehicle (position 1-3 WMI)
    const wmi = upper.substring(0, 3);
    const isGM = wmi.startsWith('1GC') || wmi.startsWith('1GS') || 
                 wmi.startsWith('2GC') || wmi.startsWith('1GB') ||
                 wmi.startsWith('3GC');

    // Verify checksum
    const checksumValid = validateChecksum(upper);
    
    // Decode year (position 10)
    const yearChar = upper[9];
    const year = YEAR_CODES[yearChar];
    if (!year) {
      return { error: 'Cannot determine model year from VIN. This may not be a 1982-2004 vehicle.' };
    }
    if (year < 1982 || year > 2004) {
      return { error: `Model year ${year} is outside the S-10 production range (1982-2004).` };
    }

    // Decode engine (position 8)
    const engineChar = upper[7];
    const engineDesc = ENGINE_VIN_CODES[engineChar] || 'Unknown';

    // Decode plant (position 11)
    const plantCode = upper[10];

    // Decode body/drivetrain from positions 4-5 (2nd gen: 1994+)
    let bodyStyle = 'Regular Cab';
    let drivetrain = '2WD';
    
    if (year >= 1994) {
      const pos4 = upper[3]; // C = 2WD, Z = 4WD for trucks
      const pos5 = upper[4]; // S = Regular, T = Extended, G = Crew
      drivetrain = DRIVETRAIN_CODES[pos4] || '2WD';
      bodyStyle = BODY_CODES_GEN2[pos5] || 'Regular Cab';
    } else {
      // First gen - less standardized
      const pos4 = upper[3];
      drivetrain = (pos4 === 'K' || pos4 === 'Z') ? '4WD' : '2WD';
    }

    // Determine VDS (Vehicle Descriptor Section) for series
    const vds = upper.substring(3, 5);
    const seriesDesc = SERIES_MAP[vds] || null;

    return {
      vin: upper,
      valid: true,
      checksumValid,
      year,
      make: 'Chevrolet',
      model: 'S-10',
      engineFromVIN: engineDesc,
      bodyStyle,
      drivetrain,
      plantCode,
      isGM,
      wmi,
      seriesDesc,
      warnings: !checksumValid ? ['VIN checksum does not match. The VIN may contain a typo.'] : []
    };
  }

  return { decode, validateFormat, validateChecksum };
})();
