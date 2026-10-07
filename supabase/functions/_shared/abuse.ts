// Filtro de palavras para separar mensagens de ódio sem conteúdo informativo.
// Ele só MARCA a denúncia como suspeita: nada é bloqueado nem apagado automaticamente.

export const RATE_LIMIT = { maxRequests: 2, windowMinutes: 30 }

// Minúsculas, sem acentos, números/símbolos trocados por letras e letras repetidas reduzidas.
// A mesma normalização vale para o texto e para as listas, então "m3rdaaa" casa com "merda".
export function normalize(text: string): string {
  const leet: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' }
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[013457@$]/g, (character) => leet[character] ?? character)
    .replace(/[^a-z\s]/g, ' ')
    .replace(/(.)\1+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

const toSet = (words: string[]) => new Set(words.map(normalize))

const OFFENSIVE = toSet([
  // Xingamentos gerais
  'idiota', 'imbecil', 'burro', 'burra', 'otario', 'otaria', 'babaca', 'lixo', 'merda', 'bosta', 'porra', 'caralho',
  'carai', 'krl', 'crl', 'prr', 'puta', 'puto', 'vadia', 'vagabundo', 'vagabunda', 'arrombado', 'arrombada',
  'desgracado', 'desgracada', 'fdp', 'vsf', 'vtnc', 'tnc', 'pqp', 'pnc', 'cuzao', 'cu', 'buceta', 'piranha',
  'escroto', 'escrota', 'nojento', 'nojenta', 'corno', 'corna', 'cretino', 'cretina', 'verme', 'maldito', 'maldita',
  'inutil', 'palhaco', 'safado', 'safada', 'cacete', 'xereca', 'punheta', 'trouxa', 'jumento', 'canalha', 'crapula',
  'miseravel', 'lazarento', 'ordinario', 'escoria', 'cachorra', 'rapariga',
  'quenga', 'prostituta', 'boqueteira', 'mamador', 'chupador', 'merdinha', 'bostinha', 'cuzinho',
  // Verbos e variações de "foder"
  'foder', 'fode', 'fodeu', 'fodendo', 'fodido', 'fodida', 'fodase', 'foda', 'fuder', 'fudeu', 'fudendo', 'fudido',
  // Ofensas discriminatórias (homofobia, racismo, capacitismo, xenofobia)
  'viado', 'veado', 'viadinho', 'bicha', 'sapatao', 'baitola', 'boiola', 'traveco', 'macaco', 'macaca', 'crioulo',
  'criolo', 'retardado', 'retardada', 'mongoloide', 'demente', 'aleijado', 'aleijada', 'favelado',
  // Termos compostos viram uma palavra só (ver PHRASES)
  'filhodaputa', 'tomanocu', 'paunocu', 'enfianocu', 'chupapau', 'putaquepariu',
])

// Radicais de palavras longas e pouco ambíguas: pegam variações como "arrombadinho" ou "vagabundagem".
const OFFENSIVE_STEMS = ['arrombad', 'desgracad', 'vagabund', 'retardad', 'escrotin', 'putinh', 'merdinh', 'bostinh', 'cuzinh', 'filhodaput']

// Expressões ofensivas com várias palavras, juntadas em um termo só antes da análise.
const PHRASES: Array<[string, string]> = [
  ['filho da puta', 'filhodaputa'], ['filha da puta', 'filhodaputa'], ['puta que pariu', 'putaquepariu'],
  ['vai tomar no cu', 'tomanocu'], ['tomar no cu', 'tomanocu'], ['toma no cu', 'tomanocu'], ['pau no cu', 'paunocu'],
  ['enfia no cu', 'enfianocu'], ['chupa pau', 'chupapau'], ['vai se foder', 'foder'], ['vai se fuder', 'fuder'],
].map(([phrase, term]) => [normalize(phrase), normalize(term)] as [string, string])

// Quem recebe a denúncia. Ofensa dirigida a eles, sem relato nenhum, é o caso mais típico de ataque.
const STAFF_TARGETS = toSet([
  'diretor', 'diretora', 'direcao', 'coordenador', 'coordenadora', 'coordenacao', 'orientador', 'orientadora',
  'orientacao', 'professor', 'professora', 'professores', 'escola', 'colegio', 'admin', 'adm', 'adms', 'administrador',
  'administradores', 'administracao', 'funcionario', 'funcionarios', 'equipe', 'staff',
])

// Se a mensagem fala em risco (violência, automutilação, ameaça), NUNCA é separada:
// uma ameaça real precisa ser vista logo pela equipe.
const RISK = toSet([
  'matar', 'matei', 'morrer', 'morte', 'suicidio', 'suicidar', 'arma', 'faca', 'bomba', 'tiro', 'atirar', 'massacre',
  'machucar', 'machuca', 'machucou', 'bater', 'bateu', 'agredir', 'agrediu', 'ameaca', 'ameacou', 'ameacar',
  'sangue', 'enforcar', 'estupro', 'estuprar', 'abuso', 'abusou', 'assedio', 'assediou', 'socorro', 'ajuda',
])

const STOPWORDS = toSet([
  'para', 'pelo', 'pela', 'como', 'mais', 'muito', 'esse', 'essa', 'isso', 'esta', 'este', 'aquele', 'aquela',
  'voce', 'voces', 'vcs', 'que', 'com', 'uma', 'uns', 'umas', 'por', 'dos', 'das', 'nos', 'nas', 'sao', 'foi',
  'tem', 'ter', 'sem', 'sobre', 'tudo', 'todos', 'todas', 'quando', 'onde', 'quem', 'porque', 'pois',
])

export type AbuseVerdict = { suspect: boolean, reason: string | null }

const SAFE: AbuseVerdict = { suspect: false, reason: null }

// Remove o "s" de plural para que "idiotas" e "burros" casem com a lista.
const matches = (set: Set<string>, token: string) => set.has(token) || (token.length > 3 && set.has(token.slice(0, -1)))
const isOffensive = (token: string) => matches(OFFENSIVE, token) || OFFENSIVE_STEMS.some((stem) => token.startsWith(stem))

export function analyzeMessage(...parts: Array<string | undefined | null>): AbuseVerdict {
  const normalized = normalize(parts.filter(Boolean).join(' '))
  // Expressões compostas ("filho da puta", "vai tomar no cu") viram um único termo da lista.
  const joined = PHRASES.reduce((text, [phrase, term]) => text.split(phrase).join(term), normalized)
  const tokens = joined.split(' ').filter(Boolean)
  if (tokens.length === 0) return SAFE

  if (tokens.some((token) => matches(RISK, token))) return SAFE

  const offensive = tokens.filter(isOffensive)
  if (offensive.length === 0) {
    const unique = new Set(tokens).size
    if (tokens.length >= 10 && unique / tokens.length < 0.3) return { suspect: true, reason: 'Texto repetitivo, sem relato do ocorrido' }
    return SAFE
  }

  const ratio = offensive.length / tokens.length
  const targetsStaff = tokens.some((token) => matches(STAFF_TARGETS, token))
  const informative = tokens.filter((token) => token.length >= 4 && !isOffensive(token) && !matches(STAFF_TARGETS, token) && !STOPWORDS.has(token)).length

  if (targetsStaff && offensive.length >= 2 && informative < 6) return { suspect: true, reason: 'Ofensas dirigidas à equipe, sem relato do ocorrido' }
  if (tokens.length <= 8 && informative === 0) return { suspect: true, reason: 'Mensagem curta, composta por ofensas' }
  if (ratio >= 0.25) return { suspect: true, reason: 'Mensagem majoritariamente ofensiva, sem relato do ocorrido' }
  return SAFE
}

// Identifica a origem sem guardar o IP: só um hash com sal, que não permite voltar ao endereço.
export async function hashOrigin(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
