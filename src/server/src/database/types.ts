/**
 * Local type extensions for tables and columns not yet reflected in the
 * kysely-codegen generated DB type. These must be kept in sync with schema.sql.
 */

export interface ProjectImageSource {
  id: string;
  project_id: string;
  storage_key: string;
  width: number;
  height: number;
  blurhash: string;
  page_count: number;
  created_at: number;
}
