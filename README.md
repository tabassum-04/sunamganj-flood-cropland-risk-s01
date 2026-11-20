# Satellite-Based Flood Inundation Mapping and Population Exposure Assessment Under Persistent Cloud Cover Using Sentinel-1 SAR

**Study area:** Sunamganj District, Sylhet Division, Bangladesh
**Monitoring period:** May 1 – June 30, 2026 (pre-monsoon baseline vs. peak monsoon event)
**Platform:** Google Earth Engine (GEE) and a GIS cartographic workflow
**Author:** Tabassum Mahbub
**Type:** Independent, self-initiated study using open-access satellite data

![Flood map](figures/sunamganj-flood-mapping-map.png)

## Overview

Monsoon flooding in northeastern Bangladesh often coincides with dense, multi-week cloud cover, which makes optical satellites (Sentinel-2, Landsat-8/9) unreliable for rapid flood mapping. This project uses all-weather, cloud-penetrating C-band **Sentinel-1 SAR** data to map net flood inundation across Sunamganj District during the June 2026 monsoon surge, and then estimates how much **population** and **cropland** were affected.

Newly flooded land is separated from perennial haor water bodies and radar terrain shadows by combining a histogram-calibrated backscatter threshold with JRC Global Surface Water and SRTM slope masks.

## Key results

| Metric | Result |
| --- | --- |
| Calibrated backscatter threshold (VV) | −16.5 dB |
| Net flood inundated area | **709.06 km²** |
| Estimated exposed population | **~467,282 people** |
| Flooded cropland area | **471.08 km²** |
| Share of flooded area that is cropland | **66.44 %** |

## Repository structure

```
.
├── README.md
├── LICENSE
├── script/
│   └── sunamganj-flood-mapping.js              GEE Code Editor script (Parts 1–3)
├── data/
│   ├── sunamganj-flood-mapping.tif             Net flood extent
│   └── sunamganj-flood-mapping-cropland.tif    Flooded cropland
├── figures/
│   └── sunamganj-flood-mapping-map.png
└── report/
    ├── sunamganj-flood-mapping-report.pdf
    └── sunamganj-flood-mapping-report.docx
```

### Raster specifications

Both GeoTIFFs share the same grid:

| Property | Value |
| --- | --- |
| Size | 2988 × 2347 pixels |
| Resolution | 30 m (≈ 0.00027°) |
| Data type | 8-bit unsigned integer |
| Pixel values | 1 = flooded, 0 = not flooded |
| CRS | WGS 84 (EPSG:4326) |
| Approx. extent | 90.93°E – 91.73°E, 24.57°N – 25.20°N |

They open directly in QGIS, ArcGIS or any GIS or remote-sensing software.

## Data sources

| Dataset | GEE collection / asset ID | Resolution | Role |
| --- | --- | --- | --- |
| Sentinel-1 SAR GRD | `COPERNICUS/S1_GRD` | 10 m (processed at 30 m) | VV backscatter for open-water delineation |
| JRC Global Surface Water | `JRC/GSW1_4/GlobalSurfaceWater` | 30 m | Masks permanent rivers and haor water (seasonality ≥ 10 months) |
| SRTM DEM | `USGS/SRTMGL1_003` | 30 m | Terrain slope mask (> 5°) to remove radar shadow |
| WorldPop Population | `WorldPop/GP/100m/pop` | 100 m | Population exposure |
| ESA WorldCover | `ESA/WorldCover/v200` | 10 m | Cropland (Class 40) extraction |
| FAO GAUL Level 2 | `FAO/GAUL/2015/level2` | Vector | Sunamganj District boundary (area of interest) |

Contains modified Copernicus Sentinel data (2026).

## Methodology

1. **SAR selection:** Sentinel-1 GRD, Interferometric Wide (IW) mode, VV polarisation. Two composites: pre-flood baseline (May 1 – May 25, 2026) and peak flood (June 15 – June 30, 2026).
2. **Speckle suppression:** circular focal median filter, 50 m radius.
3. **Threshold calibration:** the bimodal VV histogram of the June composite gave a valley at **−16.5 dB**. Pixels below this value are classified as water.
4. **Change detection and masking:**

   ```
   Net Flood Extent = (W_June ∧ ¬W_May) ∧ ¬W_Perm ∧ (S ≤ 5°)
   ```

   where `W_June` and `W_May` are the water masks, `W_Perm` is permanent surface water (JRC) and `S` is terrain slope (SRTM).
5. **Exposure quantification:** the flood mask is intersected with WorldPop (population) and ESA WorldCover Class 40 (cropland).

## How to reproduce

1. Open the [Google Earth Engine Code Editor](https://code.earthengine.google.com/) (a free Earth Engine account is required).
2. Paste the whole script `script/sunamganj-flood-mapping.js` into a new file and click **Run**. It must run top to bottom, because the later parts use variables (`aoi`, `floodedCropland`) created earlier.
3. Check the values printed in the Console (net flooded area, exposed population, flooded cropland area).
4. Start the two export tasks (`sunamganj-flood-mapping` and `sunamganj-flood-mapping-cropland`) from the **Tasks** tab. Both GeoTIFFs are saved to the `sunamganj-flood-mapping` folder in Google Drive.

## Limitations

- **Double-bounce scattering** in flooded vegetation and settlements can cause local underestimation of flood extent.
- **Wind-induced roughening** of open haor water can raise backscatter above −16.5 dB and cause minor omission errors.
- **Resolution mismatch:** WorldPop (100 m) cannot fully resolve small raised homestead mounds (*hatis*), so exposure is best read at district level.
- **No independent accuracy assessment:** the flood mask has not been checked against reference data, so omission and commission errors are not quantified.

## Implications

- Cloud-free, near-real-time flood monitoring for regional forecasting centres.
- Prioritising relief and boat-based evacuation for isolated rural clusters.
- Spatial evidence for post-flood agricultural rehabilitation and parametric crop insurance.

For full details, see `report/sunamganj-flood-mapping-report.pdf`.

## Code attribution

The Google Earth Engine code used in this study was generated with Google Gemini (AI assistant) and run in the GEE Code Editor. The draft text of the technical report was also prepared with AI assistance (Gemini) and then formatted into the final document.

## License

Code is released under the MIT License (see `LICENSE`). The report and figures may be reused with attribution to the author.
