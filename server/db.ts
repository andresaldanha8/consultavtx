import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Submission, DashboardStats, StatItem, SubmissionStatus } from '../src/types';
import { INITIAL_DEMO_SUBMISSIONS } from '../src/services/demoData';

let pool: mysql.Pool | null = null;
let storageMode: 'mysql' | 'local_fallback' = 'local_fallback';

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_FILE = path.join(DATA_DIR, 'submissions.json');

// Ensure local fallback data directory exists
function ensureLocalDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(JSON_FILE)) {
    fs.writeFileSync(JSON_FILE, JSON.stringify(INITIAL_DEMO_SUBMISSIONS, null, 2), 'utf-8');
  }
}

function readLocalSubmissions(): Submission[] {
  ensureLocalDir();
  try {
    const raw = fs.readFileSync(JSON_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(JSON_FILE, JSON.stringify(INITIAL_DEMO_SUBMISSIONS, null, 2), 'utf-8');
      return [...INITIAL_DEMO_SUBMISSIONS];
    }
    return parsed;
  } catch (err) {
    console.error('[DB] Error reading local submissions file:', err);
    return [...INITIAL_DEMO_SUBMISSIONS];
  }
}

function writeLocalSubmissions(data: Submission[]) {
  ensureLocalDir();
  const tmpFile = `${JSON_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, JSON_FILE);
}

export async function initDb(): Promise<void> {
  const host = process.env.MYSQL_HOST;
  const dbUrl = process.env.DATABASE_URL;

  // Check if MySQL is configured
  if (host || dbUrl) {
    try {
      console.log('[DB] Connecting to MySQL database...');
      if (dbUrl) {
        pool = mysql.createPool(dbUrl);
      } else {
        pool = mysql.createPool({
          host: process.env.MYSQL_HOST || 'localhost',
          port: parseInt(process.env.MYSQL_PORT || '3306', 10),
          user: process.env.MYSQL_USER || 'root',
          password: process.env.MYSQL_PASSWORD || '',
          database: process.env.MYSQL_DATABASE || 'vozes_vitoria_xingu',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
      }

      // Test connection
      const connection = await pool.getConnection();
      console.log('[DB] MySQL connected successfully!');

      // Create table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS submissions (
          id VARCHAR(64) NOT NULL PRIMARY KEY,
          moraNoMunicipio BOOLEAN NOT NULL,
          localidade VARCHAR(100) NOT NULL,
          localidadeInformada VARCHAR(255) NULL,
          prioridade1 VARCHAR(100) NOT NULL,
          prioridade1Outra VARCHAR(255) NULL,
          prioridade2 VARCHAR(100) NOT NULL,
          prioridade2Outra VARCHAR(255) NULL,
          comentario VARCHAR(300) NULL,
          faixaEtaria VARCHAR(50) NULL,
          status ENUM('VALID', 'INVALID') NOT NULL DEFAULT 'VALID',
          ipHash VARCHAR(64) NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_status (status),
          INDEX idx_createdAt (createdAt),
          INDEX idx_mora_municipio (moraNoMunicipio),
          INDEX idx_prioridade1 (prioridade1),
          INDEX idx_localidade (localidade)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      connection.release();
      storageMode = 'mysql';
      return;
    } catch (err: any) {
      console.warn('[DB] Could not connect to MySQL (' + err.message + '). Falling back to secure local file storage.');
      pool = null;
      storageMode = 'local_fallback';
    }
  } else {
    console.log('[DB] No MySQL environment variables defined. Running with secure local persistence store.');
    storageMode = 'local_fallback';
  }

  ensureLocalDir();
}

export function getStorageMode(): 'mysql' | 'local_fallback' {
  return storageMode;
}

export async function saveSubmission(sub: Submission & { ipHash?: string }): Promise<void> {
  if (storageMode === 'mysql' && pool) {
    try {
      await pool.query(
        `INSERT INTO submissions (
          id, moraNoMunicipio, localidade, localidadeInformada,
          prioridade1, prioridade1Outra, prioridade2, prioridade2Outra,
          comentario, faixaEtaria, status, ipHash, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sub.id,
          sub.moraNoMunicipio ? 1 : 0,
          sub.localidade,
          sub.localidadeInformada || null,
          sub.prioridade1,
          sub.prioridade1Outra || null,
          sub.prioridade2,
          sub.prioridade2Outra || null,
          sub.comentario || null,
          sub.faixaEtaria || null,
          sub.status,
          sub.ipHash || null,
          new Date(sub.createdAt),
          new Date(sub.updatedAt),
        ]
      );
      return;
    } catch (err) {
      console.error('[DB] MySQL insert failed, fallback to local store:', err);
    }
  }

  // Local fallback
  const items = readLocalSubmissions();
  items.unshift({
    id: sub.id,
    moraNoMunicipio: sub.moraNoMunicipio,
    localidade: sub.localidade,
    localidadeInformada: sub.localidadeInformada || null,
    prioridade1: sub.prioridade1,
    prioridade1Outra: sub.prioridade1Outra || null,
    prioridade2: sub.prioridade2,
    prioridade2Outra: sub.prioridade2Outra || null,
    comentario: sub.comentario || null,
    faixaEtaria: sub.faixaEtaria || null,
    status: sub.status,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  });
  writeLocalSubmissions(items);
}

export async function getAllSubmissions(filter?: { status?: string; search?: string }): Promise<Submission[]> {
  let list: Submission[] = [];

  if (storageMode === 'mysql' && pool) {
    try {
      let sql = 'SELECT * FROM submissions';
      const params: any[] = [];
      const conditions: string[] = [];

      if (filter?.status && filter.status !== 'ALL') {
        conditions.push('status = ?');
        params.push(filter.status);
      }

      if (filter?.search && filter.search.trim()) {
        conditions.push('(comentario LIKE ? OR localidade LIKE ? OR prioridade1 LIKE ? OR prioridade2 LIKE ?)');
        const term = `%${filter.search.trim()}%`;
        params.push(term, term, term, term);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY createdAt DESC';

      const [rows] = await pool.query(sql, params);
      list = (rows as any[]).map((r) => ({
        id: r.id,
        moraNoMunicipio: Boolean(r.moraNoMunicipio),
        localidade: r.localidade,
        localidadeInformada: r.localidadeInformada,
        prioridade1: r.prioridade1,
        prioridade1Outra: r.prioridade1Outra,
        prioridade2: r.prioridade2,
        prioridade2Outra: r.prioridade2Outra,
        comentario: r.comentario,
        faixaEtaria: r.faixaEtaria,
        status: r.status as SubmissionStatus,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString(),
      }));
      return list;
    } catch (err) {
      console.error('[DB] MySQL query failed, falling back to local file:', err);
    }
  }

  list = readLocalSubmissions();

  if (filter?.status && filter.status !== 'ALL') {
    list = list.filter((item) => item.status === filter.status);
  }

  if (filter?.search && filter.search.trim()) {
    const term = filter.search.trim().toLowerCase();
    list = list.filter(
      (item) =>
        (item.comentario && item.comentario.toLowerCase().includes(term)) ||
        item.localidade.toLowerCase().includes(term) ||
        item.prioridade1.toLowerCase().includes(term) ||
        item.prioridade2.toLowerCase().includes(term) ||
        (item.localidadeInformada && item.localidadeInformada.toLowerCase().includes(term))
    );
  }

  return list;
}

export async function updateSubmissionStatus(id: string, newStatus: SubmissionStatus): Promise<Submission | null> {
  const updatedAt = new Date().toISOString();

  if (storageMode === 'mysql' && pool) {
    try {
      await pool.query(
        'UPDATE submissions SET status = ?, updatedAt = ? WHERE id = ?',
        [newStatus, new Date(updatedAt), id]
      );
      const [rows] = await pool.query('SELECT * FROM submissions WHERE id = ?', [id]);
      const r = (rows as any[])[0];
      if (!r) return null;
      return {
        id: r.id,
        moraNoMunicipio: Boolean(r.moraNoMunicipio),
        localidade: r.localidade,
        localidadeInformada: r.localidadeInformada,
        prioridade1: r.prioridade1,
        prioridade1Outra: r.prioridade1Outra,
        prioridade2: r.prioridade2,
        prioridade2Outra: r.prioridade2Outra,
        comentario: r.comentario,
        faixaEtaria: r.faixaEtaria,
        status: r.status,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString(),
      };
    } catch (err) {
      console.error('[DB] MySQL update status failed:', err);
    }
  }

  const items = readLocalSubmissions();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    status: newStatus,
    updatedAt,
  };

  writeLocalSubmissions(items);
  return items[index];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const all = await getAllSubmissions({ status: 'ALL' });
  const validOnly = all.filter((s) => s.status === 'VALID');

  const participacoesRecebidas = all.length;
  const respostasValidas = validOnly.length;
  const respostasInvalidadas = all.filter((s) => s.status === 'INVALID').length;
  const moradoresVitoriaXingu = validOnly.filter((s) => s.moraNoMunicipio).length;

  const target = 100;
  const metaAlcancada = respostasValidas >= target;
  const percent = target > 0 ? Math.round((respostasValidas / target) * 100) : 0;
  const metaText = metaAlcancada
    ? `META ALCANÇADA — ${respostasValidas} participações`
    : `${respostasValidas} / ${target} — ${percent}%`;

  // 1. Prioridade nº 1 (somente VALID)
  const p1Map = new Map<string, number>();
  for (const s of validOnly) {
    p1Map.set(s.prioridade1, (p1Map.get(s.prioridade1) || 0) + 1);
  }
  const prioridade1: StatItem[] = Array.from(p1Map.entries())
    .map(([name, count]) => ({
      name,
      count,
      percent: respostasValidas > 0 ? Math.round((count / respostasValidas) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 2. Áreas mais priorizadas considerando prioridade 1 + prioridade 2 combinadas
  const combMap = new Map<string, number>();
  for (const s of validOnly) {
    if (s.prioridade1) combMap.set(s.prioridade1, (combMap.get(s.prioridade1) || 0) + 1);
    if (s.prioridade2) combMap.set(s.prioridade2, (combMap.get(s.prioridade2) || 0) + 1);
  }
  const totalChoices = Array.from(combMap.values()).reduce((acc, c) => acc + c, 0);
  const prioridadesCombinadas: StatItem[] = Array.from(combMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percent: totalChoices > 0 ? Math.round((count / totalChoices) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 3. Distribuição por localidade
  const locMap = new Map<string, number>();
  for (const s of validOnly) {
    locMap.set(s.localidade, (locMap.get(s.localidade) || 0) + 1);
  }
  const distribuicaoLocalidade: StatItem[] = Array.from(locMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percent: respostasValidas > 0 ? Math.round((count / respostasValidas) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Faixa etária
  const ageMap = new Map<string, number>();
  for (const s of validOnly) {
    const age = s.faixaEtaria || 'Não informada';
    ageMap.set(age, (ageMap.get(age) || 0) + 1);
  }
  const faixaEtaria: StatItem[] = Array.from(ageMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percent: respostasValidas > 0 ? Math.round((count / respostasValidas) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Comentários recentes (somente VALID e com texto)
  const recentComments = validOnly
    .filter((s) => s.comentario && s.comentario.trim().length > 0)
    .slice(0, 15)
    .map((s) => ({
      id: s.id,
      prioridade1: s.prioridade1,
      comentario: s.comentario!,
      createdAt: s.createdAt,
    }));

  return {
    participacoesRecebidas,
    respostasValidas,
    respostasInvalidadas,
    moradoresVitoriaXingu,
    meta: {
      metaAlcancada,
      current: respostasValidas,
      target,
      percent,
      text: metaText,
    },
    prioridade1,
    prioridadesCombinadas,
    distribuicaoLocalidade,
    faixaEtaria,
    recentComments,
    storageMode,
  };
}
