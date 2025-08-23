// Function to determine ring, line, and label colors based on state
export function getRingAppearance(isSelected, hovered, planetName, followingPlanet) {
  let appearance;

  // Handle sun labels specially
  if (planetName && planetName.startsWith('sun-')) {
    appearance = { 
      color: '#00ff88',
      opacity: 0, // Ring remains invisible for sun
      lineColor: 'rgba(0, 255, 136, 0.4)', // Make line visible with reduced opacity
      labelBorderColor: '#00ff88',
      labelBgColor: 'rgba(0, 20, 40, 0.95)',
      labelFontColor: '#00ff88',
      labelInnerBorderColor: '#00ff88',
      labelBorderShadowColor: 'rgba(0, 255, 136, 0.3)'
    };
  } else if (isSelected) {
    appearance = { 
      color: '#ff6b6b', 
      opacity: 1.0,
      lineColor: 'rgba(255, 107, 107, 0)',
      labelBorderColor: 'rgba(255, 107, 107, 0)',
      labelBgColor: 'rgba(255, 107, 107, 0)',
      labelFontColor: 'rgba(255, 107, 107, 0)',
      labelInnerBorderColor: 'rgba(255, 107, 107, 0)',
      labelBorderShadowColor: 'rgba(255, 107, 107, 0)'
    };
  } else if (hovered && followingPlanet) {
    // When following a planet, show a different hover color to indicate jump targets
    appearance = { 
      color: '#64ffda', // Use hex instead of rgba for THREE.js
      opacity: 0.6,
      lineColor: 'rgba(100, 255, 218, 0)',
      labelBorderColor: 'rgba(100, 255, 218, 0)',
      labelBgColor: 'rgba(26, 26, 46, 0)',
      labelFontColor: 'rgba(100, 255, 218, 0)',
      labelInnerBorderColor: 'rgba(100, 255, 218, 0)',
      labelBorderShadowColor: 'rgba(100, 255, 218, 0)'
    };
  } else if (hovered && !followingPlanet) {
    // Normal hover when not following any planet
    appearance = { 
      color: '#64ffda', // Use hex instead of rgba for THREE.js
      opacity: 0.8,
      lineColor: 'rgba(100, 255, 218, 1)',
      labelBorderColor: 'rgba(100, 255, 218, 1)',
      labelBgColor: 'rgba(26, 26, 46, 0.9)',
      labelFontColor: '#ffffff',
      labelInnerBorderColor: 'rgba(100, 255, 218, 0.7)',
      labelBorderShadowColor: 'rgba(100, 255, 219, 0.7)'
    };
  } else {
    appearance = { 
      color: '#64ffda', // Use hex color with opacity 0 instead of rgba
      opacity: 0.3,
      lineColor: 'rgba(100, 255, 218, 0)',
      labelBorderColor: 'rgba(100, 255, 218, 0)',
      labelBgColor: 'rgba(26, 26, 46, 0)',
      labelFontColor: 'rgba(100, 255, 218, 0)',
      labelInnerBorderColor: 'rgba(100, 255, 218, 0)',
      labelBorderShadowColor: 'rgba(100, 255, 218, 0)'
    };
  }

  // Sanitize planetName for CSS variable usage
  const sanitizeName = (name) => name ? name.replace(/[^a-zA-Z0-9_-]/g, '_') : '';

  // Update CSS variables for this planet (skip for sun)
  if (planetName && !planetName.startsWith('sun-')) {
    const safePlanetName = sanitizeName(planetName);
    document.documentElement.style.setProperty(`--line-color-${safePlanetName}`, appearance.lineColor);
    document.documentElement.style.setProperty(`--label-border-color-${safePlanetName}`, appearance.labelBorderColor);
    document.documentElement.style.setProperty(`--label-bg-color-${safePlanetName}`, appearance.labelBgColor);
    document.documentElement.style.setProperty(`--label-font-color-${safePlanetName}`, appearance.labelFontColor);
    document.documentElement.style.setProperty(`--label-inner-border-color-${safePlanetName}`, appearance.labelInnerBorderColor);
    document.documentElement.style.setProperty(`--label-border-shadow-color-${safePlanetName}`, appearance.labelBorderShadowColor);
  }

  return appearance;
}
