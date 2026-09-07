// Build-time theme presets - human language names.
// One preset = one primary color per client build.
// Select via VITE_THEME=<name> or override with VITE_THEME_PRIMARY="#...".

export const presets = {
  crimson: { primary: '#d31145', label: 'Crimson' },
  ocean: { primary: '#0a7bc2', label: 'Ocean Blue' },
  forest: { primary: '#0e7a4b', label: 'Forest Green' },
  sunset: { primary: '#e85d04', label: 'Sunset Orange' },
  violet: { primary: '#6d28d9', label: 'Violet' },
  slate: { primary: '#334155', label: 'Slate' },
  teal: { primary: '#0d9488', label: 'Teal' },
  midnight: { primary: '#1e293b', label: 'Midnight Navy' },
  coral: { primary: '#e76f51', label: 'Coral' },
  amber: { primary: '#d97706', label: 'Amber' },
  emerald: { primary: '#059669', label: 'Emerald' },
  sapphire: { primary: '#1d4ed8', label: 'Sapphire' },
  ruby: { primary: '#be123c', label: 'Ruby' },
  lavender: { primary: '#7c3aed', label: 'Lavender' },
  charcoal: { primary: '#27272a', label: 'Charcoal' },
  mint: { primary: '#10b981', label: 'Mint' },
  blush: { primary: '#db2777', label: 'Blush Rose' },
  indigo: { primary: '#4338ca', label: 'Indigo' },
  copper: { primary: '#b45309', label: 'Copper' },
  arctic: { primary: '#0891b2', label: 'Arctic Sky' },
}

export const defaultPreset = 'crimson'

export function resolvePreset(themeName, hexOverride) {
  if (hexOverride && /^#[0-9a-fA-F]{6}$/.test(hexOverride)) {
    return { name: 'custom', primary: hexOverride, label: 'Custom' }
  }
  const key = (themeName || defaultPreset).toLowerCase()
  const found = presets[key]
  if (found) return { name: key, ...found }
  return { name: defaultPreset, ...presets[defaultPreset] }
}
