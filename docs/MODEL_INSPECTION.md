# Model inspection and part mapping

All three models are Sketchfab exports (CC BY 4.0, credited in the site footer). None has animations,
cameras or skins. Names below are exactly as they appear in the files. Parts are matched by **material
name**, because node names are generic (`Object_2`, `Cylinder.038`) or duplicated.

Reproduce with `npm run inspect-models`. The mapping lives in `src/config/bikeParts.js`.
In dev, `window.__bike.describeParts()` lists every part's meshes, materials and measured factory colours.

## Asset pipeline

| Source (`assets-src/`) | Output (`public/models/`) | Notes |
| --- | --- | --- |
| `bicycle_m..glb` (40.4 MB) | `city-bicycle.glb` (13.5 MB) | dedup + meshopt |
| `racing_bicycle.glb` (11.2 MB) | `racing-bicycle.glb` (4.8 MB) | **spec/gloss → metal/rough** + meshopt |
| `bmx.glb` (3.8 MB) | `bmx.glb` (1.1 MB) | dedup + meshopt |

`racing_bicycle.glb` *requires* `KHR_materials_pbrSpecularGlossiness`, which three.js removed in r147,
so it would not load in the browser. `npm run prepare-models` converts it. Material dedup is disabled so
material names survive.

HDR: `public/hdr/monochrome_studio_03_2k.hdr` (the only HDR supplied) is used for image-based lighting.

---

## Corsa Classica: `racing-bicycle.glb` ("Racing Bicycle" by Francesco Coldesina)

- 11 meshes (`Object_2` to `Object_12`) under `BiciCorsa A1.obj.cleaner.materialmerger.gles`.
  These are **arbitrary 65k-vertex chunks**. Each chunk cuts across frame, wheels and components.
- **1 material:** `BiciCorsa_A1`, a single 1024² texture atlas (diffuse, spec/gloss, occlusion).

| Part | How it is addressed |
| --- | --- |
| Frame paint | atlas region: red hue 340°–22°, sat ≥ 0.3 |
| Tyre sidewalls (tan gumwall) | atlas region: hue 30°–58°, sat 0.18–0.62, lum 0.14–0.46 |
| Yellow bottle | atlas region: hue 36°–62°, sat ≥ 0.5, lum 0.46–0.85 |
| Protective coat | roughness / clearcoat of the whole material |

**Not configurable, and not offered:** individual rims, tyres, bar tape, saddle, cranks, visibility of
bottles or cages. No mesh or material isolates them. The red bottle shares the frame's red in the
atlas, so it follows the frame paint (the UI says so).

## Kit Urban: `city-bicycle.glb` ("Bicycle m." by Milionna)

Materials were identified by rendering each one in isolation:

| Part | Material(s) | Nodes (examples) | Texture |
| --- | --- | --- | --- |
| Frame | `finbike1lambert7SG1` | `finbike1:pCube6` | yes: paint + blue "kit bike" decal (2 channels) |
| Fork | `finbike1lambert9SG1` | `finbike1:mirrored_z_7` | no (gold `#b08116`) |
| Seatpost | `finbike1lambert6SG1` | `finbike1:group25_duplicated_01` | no |
| Saddle | `finbike1lambert3SG1` | `finbike1:duplicated_02group13` | yes |
| Handlebar | `finbike1lambert31SG1` | `finbike1:pCylinder54` | yes (cobalt) |
| Tyres **and** grips | `finbike1lambert13SG1` | `finbike1:pCylinder58` (3 interleaved chunks) | yes |
| Rims | `finbike1lambert15SG1` | `finbike1:tire3` | yes (gold rear / blue front) |
| Spokes | `finbike1initialShadingGroup1`, `finbike1lambert17SG1` | `…polySurface23/24`, `…polySurface48` | no |
| Drivetrain | `finbike1lambert20SG1` (cassette, chainring, disc), `finbike1lambert2SG1` (chain), `finbike1lambert23SG1` (cranks, pedals) | `finbike1:polySurface1`, `finbike1:MASH2_ReproMesh`, `finbike1:group19_mirrored_z_3` | partly |
| Kickstand | `finbike1lambert27SG1` | `finbike1:_pCube18group20` | yes |
| Not exposed | `lambert25/11/24/18/29/4SG1` | derailleur, hubs, headset, levers, saddle rails | small hardware |

**Limitation:** tyres and bar grips share one material *and* the same mesh chunks, so they are
configured together ("Tyres & grips").

## Zenith 20: `bmx.glb` ("BMX" by stealth86)

24 descriptive materials, and several use `KHR_materials_clearcoat`.

| Part | Material(s) | Notes |
| --- | --- | --- |
| Frame | `body_color`, `body_1`, `body_2` | `body_1/2` carry the red + cream "ZENITH" texture (paint and decal channels) |
| Frame accents | `black_body` | headset, clamps, BB |
| Handlebar | `handlebar` | |
| Grips | `handle_grip` | |
| Rims & hubs | `material` | `Circle.001`, `Circle.003`, `Cylinder.016`, `Cylinder.029` |
| Spokes & hardware | `screws_nuts` | spokes and bolts share this material |
| Tyres | `tyre` | `Plane`, `Plane.001` |
| Saddle | `seat` | `Plane.003` |
| Sprocket & cranks | `gear`, `gear_inner`, `chain_link`, `chain_connection` | |
| Pedals | `pedal` | studs (`studs`) left untouched |
| Axle pegs | `stand` | `Cylinder.011`, `Cylinder.056`. **Toggle** |
| Rear brake | `brake`, `brake_holder`, `brake_Wire`, `brake_inner_wire`, `brake_shoe`, `brake_shoe_holder` | **Brakeless** option hides them |

## Supported operations

| Operation | Mechanism |
| --- | --- |
| Colour on untextured material | `material.color` |
| Colour on textured material / atlas region | GPU HSL-keyed recolour after `map_fragment` (keeps baked shading, wear and lettering) |
| Finish | `MeshPhysicalMaterial` roughness / metalness / clearcoat |
| Accessory / variant | mesh `visible` |
| Surface texture (carbon twill, forged carbon, brushed alloy, fleck; tyre knurl / file tread / micro-grain) | procedural tileable textures (`src/three/patterns.js`) projected **triplanar in world space**, with bump, roughness and metalness, masked to the part's paint channel so decals stay crisp |
| Texture swap (API only) | `updatePartTexture(part, texture)` |

Surface textures use triplanar projection, not UVs, because the UV layouts here would scramble a
UV-mapped pattern (the racing bike is one atlas, and the city frame UVs are fragmented). On the racing
bike the frame texture is masked to the red paint region, so it also covers the red bottle. Racing
tyres get no tread texture, because the tread shares its atlas colour with other black parts.

**Not offered, because the assets have nothing to support them:** tyre size or tread-geometry
variants, and alternative wheel or saddle models.
