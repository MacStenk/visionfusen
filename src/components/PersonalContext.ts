// Personal Context Schema für Visionfusen
// Wird als Kind 30078 Nostr-Event gespeichert

export interface PersonalContext {
  version: string;
  
  // Basis-Identität
  identity: {
    name: string;
    role?: string;
    location?: string;
    languages?: string[];
  };
  
  // Human Design (optional)
  human_design?: {
    type?: 'Generator' | 'Manifesting Generator' | 'Projector' | 'Manifestor' | 'Reflector';
    profile?: string;  // z.B. "1/3", "4/6"
    authority?: string; // z.B. "Sakral", "Emotional", "Milz"
    strategy?: string;  // z.B. "Warten auf Reaktion"
    not_self?: string;  // z.B. "Frustration"
    definition?: string; // z.B. "Single", "Split"
    
    // Tiefere Details (optional, oft privat)
    centers?: {
      defined?: string[];
      open?: string[];
    };
    channels?: string[];
    gates?: number[];
    incarnation_cross?: string;
    variables?: string;
  };
  
  // Wie ich kommuniziere / arbeite
  communication?: {
    tone?: string;           // z.B. "direkt, keine Floskeln"
    depth?: string;          // z.B. "technisch versiert"
    avoid?: string[];        // z.B. ["Marketing-Sprache", "Smalltalk"]
    prefer?: string[];       // z.B. ["Klartext", "Beispiele"]
    decision_style?: string; // z.B. "Brauche Zeit", "Ja/Nein-Fragen"
    energy_pattern?: string; // z.B. "Morgens am produktivsten"
  };
  
  // Aktueller Fokus
  focus?: {
    projects?: string[];
    interests?: string[];
    learning?: string[];
    goals?: string[];
  };
  
  // Expertise & Wissen
  expertise?: {
    domains?: string[];      // z.B. ["TypeScript", "Nostr", "Human Design"]
    tools?: string[];        // z.B. ["Astro", "React", "Claude"]
    years_experience?: number;
  };
  
  // Spezifische Anweisungen für LLMs
  llm_instructions?: {
    language?: string;       // z.B. "de"
    format?: string;         // z.B. "knapp, Tabellen wenn sinnvoll"
    always?: string[];       // z.B. ["Optionen anbieten", "Nachfragen bei Unklarheit"]
    never?: string[];        // z.B. ["Floskeln", "Unnötige Disclaimers"]
    context_hints?: string;  // Freitext für spezielle Hinweise
  };
  
  // Meta
  meta?: {
    created_at?: string;
    updated_at?: string;
    visibility?: 'public' | 'private' | 'shared';
    shared_with?: string[]; // pubkeys die Zugriff haben
  };
}

// Leerer Kontext als Startpunkt
export const emptyContext: PersonalContext = {
  version: '1.0',
  identity: {
    name: '',
  },
};

// Beispiel-Kontext
export const exampleContext: PersonalContext = {
  version: '1.0',
  
  identity: {
    name: 'Steven Noack',
    role: 'System-Builder',
    location: 'Berlin',
    languages: ['de', 'en'],
  },
  
  human_design: {
    type: 'Generator',
    profile: '1/3',
    authority: 'Sakral',
    strategy: 'Warten auf Reaktion',
    not_self: 'Frustration',
  },
  
  communication: {
    tone: 'direkt, keine Floskeln',
    depth: 'technisch versiert',
    avoid: ['Marketing-Sprache', 'Übertreibungen', 'Smalltalk'],
    prefer: ['Klartext', 'Optionen statt eine Lösung', 'Tabellen'],
    decision_style: 'Ja/Nein-Fragen, nicht offen',
  },
  
  focus: {
    projects: ['Visionfusen'],
    interests: ['Digitale Souveränität', 'Nostr', 'Lightning', 'Human Design'],
    learning: ['Rust', 'Bitcoin'],
  },
  
  expertise: {
    domains: ['TypeScript', 'React', 'Astro', 'Nostr', 'Lightning'],
    tools: ['VS Code', 'Claude', 'Cursor'],
  },
  
  llm_instructions: {
    language: 'de',
    format: 'knapp, Tabellen wenn sinnvoll, Code wenn hilfreich',
    always: ['Optionen anbieten', 'Direkt zur Sache'],
    never: ['Floskeln', 'Unnötige Warnungen', 'Übermäßige Höflichkeit'],
  },
};

// Kontext zu Markdown für LLM-Prompt
export function contextToMarkdown(ctx: PersonalContext): string {
  let md = `# Kontext: ${ctx.identity.name}\n\n`;
  
  // Identität
  md += `## Identität\n`;
  md += `- Name: ${ctx.identity.name}\n`;
  if (ctx.identity.role) md += `- Rolle: ${ctx.identity.role}\n`;
  if (ctx.identity.location) md += `- Ort: ${ctx.identity.location}\n`;
  if (ctx.identity.languages?.length) md += `- Sprachen: ${ctx.identity.languages.join(', ')}\n`;
  md += '\n';
  
  // Human Design
  if (ctx.human_design) {
    md += `## Human Design\n`;
    if (ctx.human_design.type) md += `- Typ: ${ctx.human_design.type}\n`;
    if (ctx.human_design.profile) md += `- Profil: ${ctx.human_design.profile}\n`;
    if (ctx.human_design.authority) md += `- Autorität: ${ctx.human_design.authority}\n`;
    if (ctx.human_design.strategy) md += `- Strategie: ${ctx.human_design.strategy}\n`;
    if (ctx.human_design.not_self) md += `- Nicht-Selbst-Thema: ${ctx.human_design.not_self}\n`;
    md += '\n';
  }
  
  // Kommunikation
  if (ctx.communication) {
    md += `## Kommunikation\n`;
    if (ctx.communication.tone) md += `- Ton: ${ctx.communication.tone}\n`;
    if (ctx.communication.depth) md += `- Tiefe: ${ctx.communication.depth}\n`;
    if (ctx.communication.decision_style) md += `- Entscheidungsstil: ${ctx.communication.decision_style}\n`;
    if (ctx.communication.avoid?.length) md += `- Vermeiden: ${ctx.communication.avoid.join(', ')}\n`;
    if (ctx.communication.prefer?.length) md += `- Bevorzugt: ${ctx.communication.prefer.join(', ')}\n`;
    md += '\n';
  }
  
  // Fokus
  if (ctx.focus) {
    md += `## Aktueller Fokus\n`;
    if (ctx.focus.projects?.length) md += `- Projekte: ${ctx.focus.projects.join(', ')}\n`;
    if (ctx.focus.interests?.length) md += `- Interessen: ${ctx.focus.interests.join(', ')}\n`;
    if (ctx.focus.learning?.length) md += `- Lerne gerade: ${ctx.focus.learning.join(', ')}\n`;
    md += '\n';
  }
  
  // Expertise
  if (ctx.expertise) {
    md += `## Expertise\n`;
    if (ctx.expertise.domains?.length) md += `- Bereiche: ${ctx.expertise.domains.join(', ')}\n`;
    if (ctx.expertise.tools?.length) md += `- Tools: ${ctx.expertise.tools.join(', ')}\n`;
    md += '\n';
  }
  
  // LLM-Anweisungen
  if (ctx.llm_instructions) {
    md += `## Für KI-Assistenten\n`;
    if (ctx.llm_instructions.language) md += `- Sprache: ${ctx.llm_instructions.language}\n`;
    if (ctx.llm_instructions.format) md += `- Format: ${ctx.llm_instructions.format}\n`;
    if (ctx.llm_instructions.always?.length) md += `- Immer: ${ctx.llm_instructions.always.join(', ')}\n`;
    if (ctx.llm_instructions.never?.length) md += `- Niemals: ${ctx.llm_instructions.never.join(', ')}\n`;
    if (ctx.llm_instructions.context_hints) md += `\n${ctx.llm_instructions.context_hints}\n`;
  }
  
  return md;
}

// Kontext zu JSON-String für Nostr-Event
export function contextToEventContent(ctx: PersonalContext): string {
  return JSON.stringify(ctx);
}

// JSON-String zu Kontext
export function parseContextFromEvent(content: string): PersonalContext | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed.version && parsed.identity) {
      return parsed as PersonalContext;
    }
    return null;
  } catch {
    return null;
  }
}
