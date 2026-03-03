// src/lib/storage.ts
// Abstração de acesso ao Storage do Supabase com suporte a URLs assinadas (privadas).
// Usar este módulo em vez de getPublicUrl() direto para buckets sensíveis.

import { supabase } from './supabase';
import { captureError } from './monitoring';

const ASSEMBLY_DOCS_BUCKET = 'assembly_documents';
const DEFAULT_EXPIRY_SECONDS = 3600; // 1 hora

/**
 * Gera uma URL assinada e temporária para um documento privado.
 * Retorna null se o arquivo não existir ou o usuário não tiver acesso.
 *
 * @param filePath - Caminho relativo ao bucket (ex: "condo-id/assembly-id/ts_doc.pdf")
 * @param expiresIn - Duração em segundos (padrão: 3600 = 1h)
 */
export async function getSignedDocumentUrl(
  filePath: string,
  expiresIn = DEFAULT_EXPIRY_SECONDS
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(ASSEMBLY_DOCS_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    captureError(error, { filePath, bucket: ASSEMBLY_DOCS_BUCKET });
    return null;
  }

  return data.signedUrl;
}

/**
 * Faz upload de um arquivo para o bucket de documentos de assembleia.
 * Retorna o filePath relativo ou null em caso de erro.
 *
 * @param file - Arquivo a ser enviado
 * @param condoId - ID do condomínio (para organizar pasta)
 * @param assemblyId - ID da assembleia (para organizar subpasta)
 */
export async function uploadAssemblyDocument(
  file: File,
  condoId: string,
  assemblyId: string
): Promise<string | null> {
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${condoId}/${assemblyId}/${timestamp}_${cleanName}`;

  const { error } = await supabase.storage
    .from(ASSEMBLY_DOCS_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (error) {
    captureError(error, { filePath, bucket: ASSEMBLY_DOCS_BUCKET });
    return null;
  }

  return filePath;
}

/**
 * Remove um arquivo do bucket de documentos de assembleia.
 * Extrai o caminho a partir da URL pública ou assinada.
 */
export async function removeAssemblyDocument(fileUrlOrPath: string): Promise<void> {
  // Suporta tanto paths relativos quanto URLs públicas
  let storagePath = fileUrlOrPath;

  if (fileUrlOrPath.includes('/assembly_documents/')) {
    const parts = fileUrlOrPath.split('/assembly_documents/');
    storagePath = parts[1] ?? fileUrlOrPath;
  }

  const { error } = await supabase.storage
    .from(ASSEMBLY_DOCS_BUCKET)
    .remove([storagePath]);

  if (error) {
    captureError(error, { storagePath, bucket: ASSEMBLY_DOCS_BUCKET });
  }
}
