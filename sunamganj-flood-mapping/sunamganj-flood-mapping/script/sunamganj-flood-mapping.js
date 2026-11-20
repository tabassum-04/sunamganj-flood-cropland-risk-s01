// =========================================================================
// Satellite-Based Flood Inundation Mapping, Sunamganj District (June 2026)
// Sentinel-1 SAR net flood extent, exposed population and flooded cropland
//
// Code source: generated with Google Gemini (AI assistant) and run in the
// Google Earth Engine Code Editor.
//
// Run this whole file in the Code Editor, top to bottom, in one script.
//   Part 1: study area, Sentinel-1 VV mosaics, speckle filter, histogram
//   Part 2: -16.5 dB threshold, permanent water and slope masks, net flood
//           area, exposed population, flooded cropland, flood raster export
//   Part 3: flooded cropland raster export (uses variables from Part 2)
// =========================================================================


// #########################################################################
// PART 1: SAR preprocessing
// #########################################################################


// Load AOI, Sentinel-1 VV, Speckle Filter & Histogram
var districts = ee.FeatureCollection("FAO/GAUL/2015/level2");
var aoi = districts.filter(ee.Filter.eq('ADM2_NAME', 'Sunamganj'));
Map.centerObject(aoi, 9);

var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .select('VV');

// Pre-flood & During-flood mosaics
var preFlood = s1.filterDate('2026-05-01', '2026-05-25').mosaic().clip(aoi);
var duringFlood = s1.filterDate('2026-06-15', '2026-06-30').mosaic().clip(aoi);

// Speckle reduction (focal_median)
var preSmooth = preFlood.focal_median(50, 'circle', 'meters');
var duringSmooth = duringFlood.focal_median(50, 'circle', 'meters');

// Plot Histogram of During-flood VV backscatter to inspect bimodal separation
var hist = ui.Chart.image.histogram({
  image: duringSmooth,
  region: aoi,
  scale: 100,
  maxBuckets: 100
}).setOptions({
  title: 'During-Flood Sentinel-1 VV Backscatter Histogram (dB)',
  hAxis: {title: 'VV Backscatter (dB)'},
  vAxis: {title: 'Pixel Count'}
});
print(hist);

// Visualize raw vs filtered dB
Map.addLayer(preSmooth, {min: -25, max: 0}, 'Pre-Flood VV (dB)', false);
Map.addLayer(duringSmooth, {min: -25, max: 0}, 'During-Flood VV (dB)', true);


// #########################################################################
// PART 2: Flood extent and exposure
// #########################################################################


// Thresholding, Permanent Water & Slope Masking, and Exposure Analysis
var districts = ee.FeatureCollection("FAO/GAUL/2015/level2");
var aoi = districts.filter(ee.Filter.eq('ADM2_NAME', 'Sunamganj'));
Map.centerObject(aoi, 9);

// Calibrated threshold from histogram valley (dB)
var threshold = -16.5;

var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .select('VV');

var preSmooth = s1.filterDate('2026-05-01', '2026-05-25')
  .mosaic().clip(aoi).focal_median(50, 'circle', 'meters');

var duringSmooth = s1.filterDate('2026-06-15', '2026-06-30')
  .mosaic().clip(aoi).focal_median(50, 'circle', 'meters');

// Initial water masks (< threshold dB)
var preWater = preSmooth.lt(threshold);
var duringWater = duringSmooth.lt(threshold);

// Mask out permanent water (seasonality >= 10 months)
var jrc = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").clip(aoi);
var permanentWater = jrc.select('seasonality').gte(10);

// Mask out steep slopes (> 5 degrees)
var dem = ee.Image("USGS/SRTMGL1_003").clip(aoi);
var slope = ee.Terrain.slope(dem);
var flatTerrain = slope.lte(5);

// Net flood inundation during June 2026
var floodExtent = duringWater
  .and(preWater.not())
  .and(permanentWater.not())
  .and(flatTerrain)
  .selfMask();

// 1. Net Flooded Area (sq km)
var floodAreaSqKm = floodExtent.multiply(ee.Image.pixelArea()).divide(1e6)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 30,
    maxPixels: 1e10
  });
print('Net Flooded Area (sq km):', floodAreaSqKm);

// 2. Exposed Population (WorldPop 100m)
var pop = ee.ImageCollection("WorldPop/GP/100m/pop")
  .filterBounds(aoi).mosaic().clip(aoi);
var exposedPop = pop.updateMask(floodExtent).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 100,
  maxPixels: 1e10
});
print('Estimated Exposed Population:', exposedPop);

// 3. Flooded Cropland Area (ESA WorldCover 2021 - class 40 is Cropland)
var landcover = ee.ImageCollection("ESA/WorldCover/v200").first().clip(aoi);
var floodedCropland = floodExtent.and(landcover.eq(40)).selfMask();
var croplandAreaSqKm = floodedCropland.multiply(ee.Image.pixelArea()).divide(1e6)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e10
  });
print('Flooded Cropland Area (sq km):', croplandAreaSqKm);

// Map layers
Map.addLayer(permanentWater.selfMask(), {palette: ['navy']}, 'Permanent Water (Masked)', false);
Map.addLayer(floodExtent, {palette: ['dodgerblue']}, 'Net Flood Extent (June 2026)');
Map.addLayer(floodedCropland, {palette: ['orange']}, 'Flooded Cropland');

// Export GeoTIFF to Google Drive
Export.image.toDrive({
  image: floodExtent.toByte(),
  description: 'sunamganj-flood-mapping',
  folder: 'sunamganj-flood-mapping',
  scale: 30,
  region: aoi.geometry(),
  maxPixels: 1e10
});


// #########################################################################
// PART 3: Flooded cropland export
// #########################################################################


// Export Flooded Cropland GeoTIFF to Google Drive
Export.image.toDrive({
  image: floodedCropland.toByte(),
  description: 'sunamganj-flood-mapping-cropland',
  folder: 'sunamganj-flood-mapping',
  scale: 30,
  region: aoi.geometry(),
  maxPixels: 1e10
});
