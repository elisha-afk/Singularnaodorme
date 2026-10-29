// Etapas de ensino das unidades: Médio (1ª a 3ª série) e Fundamental (1º ao 9º ano).
export type Level = 'medio' | 'fundamental'

export const LEVEL_YEARS: Record<Level, number[]> = {
  medio: [1, 2, 3],
  fundamental: [1, 2, 3, 4, 5, 6, 7, 8, 9],
}

export const LEVEL_LABELS: Record<Level, string> = {
  medio: 'Ensino Médio',
  fundamental: 'Ensino Fundamental',
}

export const isLevel = (value: unknown): value is Level => value === 'medio' || value === 'fundamental'

// Sem unidade (acessos antigos) vale a etapa do Médio.
export const yearsForLevel = (level: unknown): number[] => (isLevel(level) ? LEVEL_YEARS[level] : LEVEL_YEARS.medio)
