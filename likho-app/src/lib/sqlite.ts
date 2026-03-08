/**
 * SQLite service for offline note storage via Tauri SQL plugin.
 * Only available when running inside the Tauri desktop app.
 */
import { isTauri } from '@/utils/platform';
import type { Folder, Note } from '@/types/workspace';

let db: any = null;

async function getDb() {
  if (db) return db;
  if (!isTauri()) throw new Error('SQLite is only available in Tauri');
  const Database = (await import('@tauri-apps/plugin-sql')).default;
  db = await Database.load('sqlite:likho.db');
  return db;
}

// ── Folders ──

export async function getAllFolders(): Promise<Folder[]> {
  const conn = await getDb();
  const rows: any[] = await conn.select('SELECT * FROM folders ORDER BY sort_order');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    spaceType: 'offline' as const,
    parentId: r.parent_id || null,
    icon: r.icon || null,
    sortOrder: r.sort_order,
    isExpanded: !!r.is_expanded,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createFolder(folder: Folder): Promise<void> {
  const conn = await getDb();
  await conn.execute(
    'INSERT INTO folders (id, name, parent_id, icon, sort_order, is_expanded, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [folder.id, folder.name, folder.parentId, folder.icon, folder.sortOrder, folder.isExpanded ? 1 : 0, folder.createdAt, folder.updatedAt]
  );
}

export async function updateFolder(id: string, data: Partial<Folder>): Promise<void> {
  const conn = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.parentId !== undefined) { fields.push(`parent_id = $${idx++}`); values.push(data.parentId); }
  if (data.icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(data.icon); }
  if (data.sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }
  if (data.isExpanded !== undefined) { fields.push(`is_expanded = $${idx++}`); values.push(data.isExpanded ? 1 : 0); }
  fields.push(`updated_at = $${idx++}`);
  values.push(new Date().toISOString());
  values.push(id);

  await conn.execute(`UPDATE folders SET ${fields.join(', ')} WHERE id = $${idx}`, values);
}

export async function deleteFolder(id: string): Promise<void> {
  const conn = await getDb();
  // Delete child notes first
  await conn.execute('DELETE FROM notes WHERE folder_id = $1', [id]);
  await conn.execute('DELETE FROM folders WHERE id = $1', [id]);
}

// ── Notes ──

export async function getAllNotes(): Promise<Note[]> {
  const conn = await getDb();
  const rows: any[] = await conn.select('SELECT * FROM notes ORDER BY sort_order');
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content ? JSON.parse(r.content) : undefined,
    folderId: r.folder_id || null,
    spaceType: 'offline' as const,
    icon: r.icon || null,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createNote(note: Note): Promise<void> {
  const conn = await getDb();
  await conn.execute(
    'INSERT INTO notes (id, title, content, folder_id, icon, sort_order, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [note.id, note.title, note.content ? JSON.stringify(note.content) : null, note.folderId, note.icon, note.sortOrder, note.createdAt, note.updatedAt]
  );
}

export async function updateNote(id: string, data: Partial<Note>): Promise<void> {
  const conn = await getDb();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title); }
  if (data.content !== undefined) { fields.push(`content = $${idx++}`); values.push(JSON.stringify(data.content)); }
  if (data.folderId !== undefined) { fields.push(`folder_id = $${idx++}`); values.push(data.folderId); }
  if (data.icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(data.icon); }
  if (data.sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }
  fields.push(`updated_at = $${idx++}`);
  values.push(new Date().toISOString());
  values.push(id);

  if (fields.length > 1) {
    await conn.execute(`UPDATE notes SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  }
}

export async function deleteNote(id: string): Promise<void> {
  const conn = await getDb();
  await conn.execute('DELETE FROM notes WHERE id = $1', [id]);
}
