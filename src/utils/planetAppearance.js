// Function to determine ring, line, and label colors based on state
export function getRingAppearance(isSelected, hovered, planetName, followingPlanet) {
  let appearance;

  if (isSelected) {
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

  // Update CSS variables for this planet
  if (planetName) {
    document.documentElement.style.setProperty(`--line-color-${planetName}`, appearance.lineColor);
    document.documentElement.style.setProperty(`--label-border-color-${planetName}`, appearance.labelBorderColor);
    document.documentElement.style.setProperty(`--label-bg-color-${planetName}`, appearance.labelBgColor);
    document.documentElement.style.setProperty(`--label-font-color-${planetName}`, appearance.labelFontColor);
    document.documentElement.style.setProperty(`--label-inner-border-color-${planetName}`, appearance.labelInnerBorderColor);
    document.documentElement.style.setProperty(`--label-border-shadow-color-${planetName}`, appearance.labelBorderShadowColor);
  }

  return appearance;
}
