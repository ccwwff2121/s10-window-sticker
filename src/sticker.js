function buildSticker(decoded, rpoList) {
  return {
    vin: decoded.vin,
    year: decoded.year,
    make: decoded.make,
    model: decoded.model,
    trim: "Unknown",
    engine: "Unknown",
    options: rpoList.map(code => ({ code, description: "Unknown Option" }))
  };
}
