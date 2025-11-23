# Rubik's Cube Animation Color Customization Guide

This document provides a quick reference for changing colors and visual properties throughout the animation without reading the entire HTML file.

## File Locations
- **English version**: `public/rubiks-standalone-reset/index.html`
- **Arabic version**: `public/rubiks-standalone-reset/index-ar.html`
- **Cube face patterns**: `public/rubiks-standalone-reset/faces.json`

---

## 1. Large Cube Colors (27 pieces)

**Location**: Line ~1130 in index.html
```javascript
const cube = makeCube(LARGE_SIZE, 0x1A2435, 0xffffff, cubeIndex++);
//                                 ^^^^^^^^  - Fill color
//                                           ^^^^^^^^ - Edge color (white)
```

**Current values**:
- Fill: `0x1A2435` (Dark primary color)
- Edges: `0xffffff` (White)

---

## 2. Mini Cube Initial Colors (729 pieces)

**Location**: Line ~1203 in index.html
```javascript
const m = makeCube(MINI_SIZE, 0x1A2435, 0xffffff); // Dark initial color, inherited from parent
//                           ^^^^^^^^  - Fill color
//                                      ^^^^^^^^ - Edge color (white)
```

**Current values**:
- Fill: `0x1A2435` (Dark, inherited from parent large cube)
- Edges: `0xffffff` (White)

---

## 3. Sticker Face Colors (Procedural texture palette)

**Location**: `faces.json` line 4
```json
"palette": ["#D4AF37", "#E5C158", "#B8960F", "#C9A844", "#D4AF37", "#E5C158"]
```

**Current**: Gold shades for procedural sticker patterns

---

## 4. Cube Frame (Outer beams) Color

**Location**: Line ~1153 in index.html
```javascript
const beamMat = new THREE.MeshPhysicalMaterial({ 
  color: 0xFFD700,  // Gold beams
  metalness: 1.0, 
  roughness: 0.2 
});
```

**Current**: `0xFFD700` (Gold)

---

## 5. Core Sphere (Glowing orb) Color

**Location**: Line ~1174 in index.html
```javascript
const coreSphere = new THREE.Mesh(
  new THREE.SphereGeometry(PHASE1_SPAN * 0.14, 48, 48),
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xD4AF37,      // Glow color
    emissiveIntensity: 0.35   // Glow brightness
  })
);
const coreLight = new THREE.PointLight(0xD4AF37, 2.0, PHASE1_SPAN * 3.0);
//                                      ^^^^^^^^ - Light color
```

**Current**: Gold glow (#D4AF37)

---

## 6. Phase-by-Phase Color Settings

### **Phase 4-5: Transform & Expand**
**Location**: Line ~2466
```javascript
else if (phase.id === 4 || phase.id === 5) {
  setCubeFillColor(miniGroup, 0x1A2435); // Dark inherited color from parents
}
```

### **Phase 6: Popcorn Recolor (one-by-one)**
**Location**: Line ~2208-2210
```javascript
const fromColor = new THREE.Color(0x1A2435);  // Dark (starting color from parents)
const toColor = new THREE.Color(0xD4AF37);    // Gold (target color)
// Transition happens gradually, one cube at a time (0.08 progress window)
```

### **Phase 7-8: Dance & Morph**
**Location**: Line ~2467-2468
```javascript
else if (phase.id === 6 || phase.id === 7 || phase.id === 8) {
  // Carry over per-cube colors from prior phase (popcorn colors persist)
}
```

### **Phase 9: Final Formation (Sculpture)**
**Location**: Line ~2481-2505
```javascript
setCubeFillColor(miniGroup, 0x8B7500);  // Darker gold for visibility

// Change edges to dark grey
miniCubes.forEach(m => {
  m.traverse(o => {
    if (o.isLineSegments && o.material) {
      o.material.color.set(0x444444);  // Dark grey edges
    }
    if (o.isMesh && o.material && 'emissiveIntensity' in o.material) {
      o.material.emissive.setHex(0x6B5500);    // Darker gold glow
      o.material.emissiveIntensity = 0.5;      // Reduced intensity
    }
  });
});
```

---

## 7. Quick Color Reference

| Component | Current Color | Hex Code | Used In Phase(s) |
|-----------|---------------|----------|------------------|
| Large cubes | Dark primary | #1A2435 | 1-5 |
| Mini cubes initial | Dark primary | #1A2435 | 4-5 |
| Popcorn target | Gold | #D4AF37 | 6-8 |
| Sculpture | Dark gold | #8B7500 | 9 |
| Large cube edges | White | #FFFFFF | 1-5 |
| Mini cube edges (initial) | White | #FFFFFF | 4-8 |
| Sculpture edges | Dark grey | #444444 | 9 |
| Frame beams | Gold | #FFD700 | 1,9 |
| Core sphere glow | Gold | #D4AF37 | 1,9 |
| Sculpture glow | Dark gold | #6B5500 | 9 |

---

## 8. How to Change Colors Safely

### To change a specific phase's colors:
1. Find the phase number (1-9) in the "Phase-by-Phase" section above
2. Locate the `setCubeFillColor()` call or color variable
3. Change the hex color code
4. **Apply to both files** (index.html AND index-ar.html)

### To change popcorn transition colors:
1. Go to **Phase 6** section (Line ~2208)
2. Change `fromColor` (starting) or `toColor` (target) hex values
3. **Do not** change the transition timing (0.08 window) unless you know what you're doing

### To change edge colors:
1. Find the `makeCube()` function call or the edge color changing code in Phase 9
2. Change the hex value in `material.color.set(0x444444)`
3. Apply to both files

---

## 9. Troubleshooting

- **Cubes too bright in final sculpture**: Reduce emissiveIntensity (currently 0.5)
- **Cubes hard to see**: Use darker gold (#8B7500) or add darker edges (#444444)
- **Popcorn effect not visible**: Check fromColor vs toColor contrast
- **Beams invisible**: Check beamMat color against background

---

## 10. Testing Changes

After editing colors:
1. Save both HTML files (English & Arabic)
2. Refresh the browser preview (Ctrl+F5 for hard refresh)
3. Play through the entire animation sequence (scroll all the way down)
4. Check all phases visually match your requirements
