import type { ProjectSettings } from '~/types/project'

export type ThemeVariables = ProjectSettings

export function useThemeVariables() {
  const themeVariables = useState<ThemeVariables | null>('theme-variables', () => null)

  async function fetchThemeVariables(force = false) {
    if (themeVariables.value && !force) return themeVariables.value
    const data = await $fetch<ThemeVariables>('/api/theme-variables')
    themeVariables.value = data
    return data
  }

  /** Merge one category: only keys that still exist in the theme file (no orphaned UI for deleted $vars). */
  function mergeCategory(
    fromFile: Record<string, string>,
    project: Record<string, string>,
  ): Record<string, string> {
    const out: Record<string, string> = {}
    for (const key of Object.keys(fromFile)) {
      const base = fromFile[key]
      if (base === undefined) continue
      out[key] = project[key] ?? base
    }
    return out
  }

  /** Merged settings: parsed defaults from partials + project overrides. */
  function mergedSettings(projectSettings: ProjectSettings): ProjectSettings {
    const fromPartials = themeVariables.value
    if (!fromPartials) return projectSettings
    return {
      globalSettings: mergeCategory(
        fromPartials.globalSettings,
        projectSettings.globalSettings,
      ),
      typography: mergeCategory(
        fromPartials.typography,
        projectSettings.typography,
      ),
      colors: mergeCategory(fromPartials.colors, projectSettings.colors),
      button: mergeCategory(fromPartials.button, projectSettings.button),
      image: mergeCategory(fromPartials.image, projectSettings.image),
    }
  }

  return { themeVariables, fetchThemeVariables, mergedSettings }
}
