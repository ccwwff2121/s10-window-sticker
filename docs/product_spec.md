\# Product Specification

\## S-10 Window Sticker Generator (1982–2004)



\### Overview

A static web application that generates reconstructed Monroney-style

window stickers for Chevrolet S-10 trucks from 1982–2004 using VIN

decoding, curated data tables, and optional RPO codes.



\### Inputs

\- VIN (required)

\- RPO codes (optional)



\### Outputs

\- Year, make, model

\- Body style

\- Engine

\- Trim inference

\- Standard equipment

\- Options (from RPO or inference)

\- Pricing (approximate)

\- Fuel economy (approximate)

\- Monroney-style layout



\### Constraints

\- VIN alone cannot determine all options

\- RPO codes improve accuracy

\- Pricing is approximate unless sourced from OEM data

\- App must run offline and online



\### Architecture

\- Fully static HTML/CSS/JS

\- JSON data tables in `/data`

\- Optional online VIN decode via NHTSA vPIC API



