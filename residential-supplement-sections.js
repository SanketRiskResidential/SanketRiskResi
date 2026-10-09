// Supplementary Form — sections organised from Sanket Risk's draft.
// One definition drives the form (app-residential-supplement.html), the saved
// data (form_data.supp) and the report. Edit options here and all three follow.
// Field types: select | multi | number | text | textarea
// Set note:true on a section to show a NOTE box beneath it (saved as <section id>_note).
var YN = ['No', 'Yes'];
var COND = ['Good', 'Average', 'Poor'];
window.SUPP_SECTIONS = [
  { id: 'occupancy', title: 'Occupancy & Construction', note: true, fields: [
    { id: 'occupancy_type', label: 'Occupancy', type: 'multi', options: ['Single family', 'Multiple families', 'Short-term rental (e.g. Airbnb)', 'Home business'] },
    { id: 'tenants', label: 'Number of Tenants', type: 'number', min: 0, max: 50 },
    { id: 'trees_roof', label: 'Trees Rubbing Against Roof Covering', type: 'select', options: YN }
  ]},
  { id: 'electrical', title: 'Utilities — Electrical', note: true, fields: [
    { id: 'wiring', label: 'Wiring', type: 'multi', options: ['Copper', 'Aluminum', 'BX (armoured cable)', 'Conduit', 'Knob & tube'] },
    { id: 'service', label: 'Service Connection', type: 'select', options: ['Overhead', 'Underground'] },
    { id: 'wires_trees', label: 'Overhead Wires Close to Trees', type: 'select', options: YN },
    { id: 'circuit_protection', label: 'Circuit Protection', type: 'multi', options: ['Circuit breakers', 'Fuses'] },
    { id: 'generator', label: 'Backup Generator', type: 'select', options: ['None', 'Portable', 'Standby (permanent)'] },
    { id: 'generator_kw', label: 'Generator Capacity (kW)', type: 'number', min: 0, max: 1000 }
  ]},
  { id: 'fuel', title: 'Fuel, Heating & Water Heating', note: true, fields: [
    { id: 'fuel_type', label: 'Fuel Type', type: 'multi', options: ['Natural gas', 'Propane', 'Oil', 'Electric', 'Wood / solid fuel'] },
    { id: 'fuel_supply', label: 'Fuel Supply', type: 'multi', options: ['Piped', 'Storage tank(s)'] },
    { id: 'oil_tank', label: 'Oil Tank', type: 'select', options: ['None', 'Aboveground — dyked', 'Aboveground — not dyked', 'Underground'] },
    { id: 'water_heater', label: 'Water Heater', type: 'select', options: ['Electric', 'Gas', 'Geothermal', 'Oil', 'Other'] },
    { id: 'heating_cooling', label: 'Heating / Air Conditioning', type: 'multi', options: ['Forced air', 'Heat pump', 'Boiler with radiators', 'Floor heating', 'Air heat exchange system'] },
    { id: 'drain_backup', label: 'Drain Backup Valves', type: 'select', options: ['Yes', 'No', 'Unknown'] }
  ]},
  { id: 'plumbing', title: 'Plumbing & Water', note: true, fields: [
    { id: 'piping', label: 'Piping', type: 'multi', options: ['Copper', 'Plastic', 'PEX', 'Galvanized iron'] },
    { id: 'large_tanks', label: 'Large Water Tanks', type: 'multi', options: ['Inside', 'Outside', 'Rain-harvesting system'] },
    { id: 'septic', label: 'Septic Tank', type: 'select', options: ['None — municipal sewer', 'Septic tank'] },
    { id: 'septic_serviced', label: 'Septic Last Inspected / Serviced', type: 'text' },
    { id: 'sump', label: 'Sump Pump', type: 'select', options: ['None', 'Present'] },
    { id: 'sump_features', label: 'Sump / Flood Protection', type: 'multi', options: ['Backup pump', 'Battery backup', 'Pump alarm', 'Flood alarm'] },
    { id: 'laundry_hoses', label: 'Laundry Hoses', type: 'select', options: ['Steel-reinforced', 'Rubber / standard', 'Not seen'] },
    { id: 'dryer_vent', label: 'Dryer Vent', type: 'select', options: ['Metal', 'Plastic / foil', 'Not seen'] },
    { id: 'window_wells', label: 'Window Wells', type: 'select', options: ['None', 'Covered', 'Not covered'] }
  ]},
  { id: 'interior', title: 'Interior Features', note: false, fields: [
    { id: 'kitchens', label: 'Kitchens', type: 'number', min: 0, max: 10 },
    { id: 'bedrooms', label: 'Bedrooms', type: 'number', min: 0, max: 30 },
    { id: 'bathrooms', label: 'Bathrooms', type: 'number', min: 0, max: 30 },
    { id: 'hallways', label: 'Hallways', type: 'number', min: 0, max: 30 },
    { id: 'laundry_room', label: 'Laundry Room', type: 'select', options: YN },
    { id: 'elevators', label: 'Elevators / Lifts', type: 'select', options: ['None', 'Elevator', 'Stair lift'] },
    { id: 'stairs', label: 'Interior Stairs', type: 'select', options: ['None', 'One flight', 'Multiple flights'] },
    { id: 'balconies_int', label: 'Balconies', type: 'select', options: ['None', 'One', 'Several'] },
    { id: 'below_grade', label: 'Basement / Crawl Space', type: 'select', options: ['Full basement', 'Partial basement', 'Crawl space', 'None'] }
  ]},
  { id: 'exterior_features', title: 'Exterior Features', note: true, fields: [
    { id: 'structures', label: 'Exterior Structures', type: 'multi', options: ['Balcony', 'Fence', 'Deck', 'Canopy', 'Dock', 'Exterior stairs', 'Pergola', 'Storm shutters', 'Carport', 'Detached garage', 'Attached garage', 'Workshop'] },
    { id: 'amenities', label: 'Outdoor Amenities', type: 'multi', options: ['Swimming pool', 'Sprinkler system', 'Artificial turf', 'Basketball court', 'Tennis court'] },
    { id: 'energy', label: 'Alternative Energy', type: 'multi', options: ['Solar panels', 'Wind power', 'Run-of-river generator'] },
    { id: 'sidewalks', label: 'Sidewalks', type: 'multi', options: ['Concrete', 'Gravel', 'Paving stones', 'Patio stones', 'Other'] },
    { id: 'ramp', label: 'Wheelchair Ramp', type: 'select', options: YN },
    { id: 'ev_charging', label: 'EV Charging Facility', type: 'select', options: YN }
  ]},
  { id: 'site', title: 'Site & Grounds', note: true, fields: [
    { id: 'gutters', label: 'Antenna / Gutters / Downspouts', type: 'multi', options: ['In good repair', 'Damaged', 'Leaking', 'Blocked by leaves', 'Clean'] },
    { id: 'well', label: 'Well', type: 'multi', options: ['Borewell', 'Open well — covered', 'Open well — not covered', 'Pumping system'] },
    { id: 'wall_material', label: 'Retaining Walls', type: 'multi', options: ['Block', 'Concrete', 'Stone', 'Brick', 'Timber'] },
    { id: 'wall_height', label: 'Retaining Wall Height', type: 'text' },
    { id: 'wall_condition', label: 'Retaining Wall Repair', type: 'select', options: COND },
    { id: 'insects', label: 'Signs of Insect Infestation', type: 'select', options: YN },
    { id: 'driveway', label: 'Driveway', type: 'multi', options: ['Paved', 'Concrete', 'Gravel', 'Interlocking stones', 'Other'] },
    { id: 'ornamental', label: 'Ornamental Features', type: 'multi', options: ['Large statues', 'Garden ornaments', 'Bridge', 'Stream / river', 'Other'] }
  ]},
  { id: 'crime', title: 'Crime & Burglary', note: true, fields: [
    { id: 'window_protection', label: 'Window Protection', type: 'multi', options: ['None', 'Bars', 'Non-breakable glass', 'Shutters'] },
    { id: 'door_security', label: 'Doors', type: 'multi', options: ['Spring latch', 'Deadbolt', 'Electronic lock', 'Barred doors'] },
    { id: 'burglar_alarm', label: 'Burglar Alarm', type: 'multi', options: ['No alarm', 'Local alarm only', 'Motion detectors', 'Door contacts'] },
    { id: 'alarm_monitoring', label: 'Alarm Monitoring', type: 'select', options: ['Monitored', 'Not monitored', 'No alarm'] },
    { id: 'alarm_company', label: 'Alarm Company', type: 'text' },
    { id: 'outside_lighting', label: 'Outside Lighting', type: 'select', options: ['None', 'Poor', 'Adequate', 'Motion-activated'] }
  ]},
  { id: 'environmental', title: 'Environmental Hazards', note: true, fields: [
    { id: 'env_hazards', label: 'Observed / Suspected', type: 'multi', options: ['None observed', 'Asbestos suspected', 'Radon concern', 'Poor ventilation', 'Above-ground oil tank'] }
  ]},
  { id: 'fire', title: 'Fire Protection', note: true, fields: [
    { id: 'sprinklers', label: 'Sprinklers', type: 'select', options: ['None', 'Monitored', 'Not monitored'] },
    { id: 'fire_alarm_company', label: 'Alarm Company', type: 'text' },
    { id: 'extinguishers', label: 'Fire Extinguishers', type: 'select', options: ['None seen', 'One', 'Several'] },
    { id: 'detection', label: 'Fire / Smoke Detection', type: 'multi', options: ['Smoke alarms', 'Heat detection — monitored', 'Heat detection — not monitored', 'Combination heat / smoke / CO', 'CO alarm'] },
    { id: 'fire_dept_distance', label: 'Distance to Fire Department (km)', type: 'text' },
    { id: 'fus_grade', label: 'FUS Residential Grading', type: 'select', options: ['1', '2', '3', '4', '5', 'Not available'] }
  ]},
  { id: 'neighbourhood', title: 'Neighbourhood', note: true, fields: [
    { id: 'area_type', label: 'Area Type', type: 'multi', options: ['Urban', 'Semi-urban', 'Rural', 'Semi-rural', 'Residential', 'Industrial', 'Farming'] },
    { id: 'trend', label: 'Trend', type: 'select', options: ['Stable', 'Growing', 'Deteriorating'] },
    { id: 'vandalism', label: 'Signs of Vandalism / Graffiti', type: 'select', options: YN }
  ]},
  { id: 'natcat', title: 'Natural Catastrophe Grading', note: true, fields: [
    { id: 'nc_flood', label: 'Flood', type: 'select', options: ['Low', 'Moderate', 'High', 'Very high'] },
    { id: 'nc_wildfire', label: 'Wildfire', type: 'select', options: ['Low', 'Moderate', 'High', 'Very high'] },
    { id: 'nc_earthquake', label: 'Earthquake', type: 'select', options: ['Low', 'Moderate', 'High', 'Very high'] },
    { id: 'nc_wind', label: 'Wind / Hail / Tornado', type: 'select', options: ['Low', 'Moderate', 'High', 'Very high'] },
    { id: 'nc_winter', label: 'Winter Storm / Ice', type: 'select', options: ['Low', 'Moderate', 'High', 'Very high'] },
    { id: 'nc_other', label: 'Other (landslide, storm surge, etc.)', type: 'text' }
  ]},
  { id: 'liability', title: 'Liability', note: true, fields: [
    { id: 'stairs_cond', label: 'Exterior Stairs — Repair', type: 'select', options: COND },
    { id: 'handrails', label: 'Handrails Provided', type: 'select', options: ['Yes', 'No', 'Partial'] },
    { id: 'deck_cond', label: 'Decks — Condition', type: 'select', options: COND },
    { id: 'deck_rails', label: 'Deck Railings', type: 'select', options: ['Adequate', 'Inadequate'] },
    { id: 'trip_hazards', label: 'Trips / Slips / Falls', type: 'multi', options: ['Tripping hazard', 'Gravel driveway or walkway', 'Snow / ice accumulation'] },
    { id: 'pool_cond', label: 'Swimming Pool — Condition', type: 'select', options: ['No pool'].concat(COND) },
    { id: 'pool_fence', label: 'Pool Fencing', type: 'select', options: ['Adequate', 'Inadequate'] },
    { id: 'pool_space', label: 'Space Around Pool', type: 'select', options: ['Adequate', 'Inadequate'] },
    { id: 'pool_depth', label: 'Depth Markings', type: 'select', options: ['Present', 'Missing'] },
    { id: 'play_equipment', label: 'Play Equipment', type: 'text' },
    { id: 'safety_equipment', label: 'Safety Equipment', type: 'text' },
    { id: 'pet_breed', label: 'Pet Exposure — Breed', type: 'text' },
    { id: 'pet_age', label: 'Pet Age', type: 'text' },
    { id: 'pet_weight', label: 'Pet Weight', type: 'text' },
    { id: 'pet_temper', label: 'Pet Temperament', type: 'select', options: ['No pets', 'Friendly', 'Aggressive'] },
    { id: 'wind_hazards', label: 'Wind Hazards — Large Tents / Canopies', type: 'select', options: YN }
  ]}
];
