function decodeVin(vin) {
  if (vin.length !== 17) {
    return { error: "Invalid VIN length" };
  }

  const yearCode = vin[9];
  const year = decodeYear(yearCode);

  return {
    vin,
    year,
    make: "Chevrolet",
    model: "S-10"
  };
}

function decodeYear(code) {
  const map = {
    A: 1980, B: 1981, C: 1982, D: 1983, E: 1984,
    F: 1985, G: 1986, H: 1987, J: 1988, K: 1989,
    L: 1990, M: 1991, N: 1992, P: 1993, R: 1994,
    S: 1995, T: 1996, V: 1997, W: 1998, X: 1999,
    Y: 2000, 1: 2001, 2: 2002, 3: 2003, 4: 2004
  };
  return map[code] || null;
}
