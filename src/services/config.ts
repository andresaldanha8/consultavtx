/**
 * Configuração Central de Modo de Dados do Projeto
 * 100 Vozes da Cidade — Vitória do Xingu
 *
 * MODOS SUPORTADOS:
 * - 'demo': Opera via demoRepository (armazenamento local resiliente no navegador com 24 respostas mock).
 *           Ideal para demonstrações presenciais, validações de UX e testes sem necessidade de MySQL.
 * - 'api':  Opera via apiRepository consumindo os endpoints REST do Express (/api/*).
 *           Ideal para produção e integração com banco MySQL.
 */
export type DataMode = 'demo' | 'api';

// Permite alternar via variável de ambiente (VITE_DATA_MODE) ou padroniza em 'demo' para demonstração funcional
export const DATA_MODE: DataMode =
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DATA_MODE) as DataMode) || 'demo';

export const IS_DEMO_MODE = DATA_MODE === 'demo';
