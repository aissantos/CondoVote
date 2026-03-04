import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSignedDocumentUrl, uploadAssemblyDocument, removeAssemblyDocument } from './storage';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUrl: vi.fn(),
        upload: vi.fn(),
        remove: vi.fn(),
      }),
    }
  }
}));

// Mock monitoring to avoid console.errors during test
vi.mock('./monitoring', () => ({
  captureError: vi.fn()
}));

describe('Storage Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSignedDocumentUrl', () => {
    it('retorna a URL assinada em caso de sucesso', async () => {
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: { signedUrl: 'https://mock.url/signed' },
        error: null
      });
      // @ts-ignore
      supabase.storage.from.mockReturnValueOnce({ createSignedUrl: mockCreateSignedUrl });

      const url = await getSignedDocumentUrl('test.pdf');
      expect(url).toBe('https://mock.url/signed');
      expect(supabase.storage.from).toHaveBeenCalledWith('assembly_documents');
    });

    it('retorna null em caso de falha', async () => {
      const mockCreateSignedUrl = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Failed to sign')
      });
      // @ts-ignore
      supabase.storage.from.mockReturnValueOnce({ createSignedUrl: mockCreateSignedUrl });

      const url = await getSignedDocumentUrl('test.pdf');
      expect(url).toBeNull();
    });
  });

  describe('uploadAssemblyDocument', () => {
    it('faz o upload de arquivo e retorna o path', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'condo1/assembly1/file.pdf' }, error: null });
      // @ts-ignore
      supabase.storage.from.mockReturnValueOnce({ upload: mockUpload });
      
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const path = await uploadAssemblyDocument(file, 'condo1', 'assembly1');
      
      expect(path).toContain('condo1/assembly1/');
      expect(path).toContain('test.pdf');
    });

    it('retorna null quando o upload falha', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ data: null, error: new Error('Upload failed') });
      // @ts-ignore
      supabase.storage.from.mockReturnValueOnce({ upload: mockUpload });

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const path = await uploadAssemblyDocument(file, 'condo1', 'assembly1');
      expect(path).toBeNull();
    });
  });

  describe('removeAssemblyDocument', () => {
    it('extrai corretamente o caminho e apaga via rm', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ data: [], error: null });
      // @ts-ignore
      supabase.storage.from.mockReturnValueOnce({ remove: mockRemove });

      await removeAssemblyDocument('https://url/assembly_documents/condo1/ass1/doc.pdf');
      expect(mockRemove).toHaveBeenCalledWith(['condo1/ass1/doc.pdf']);
    });
  });
});
