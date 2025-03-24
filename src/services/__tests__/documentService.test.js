/* global jest, describe, beforeEach, it, expect, Blob */

// Mock Blob if it's not defined in the test environment
// Import dependencies after mocking
import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the service to test
import documentService from '../documentService';

if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(content, options) {
      this.content = content;
      this.options = options;
    }
  };
}

// Mock the modules before importing the service
jest.mock('../supabaseClient', () => {
  const mockSupabase = {
    storage: {
      from: jest.fn().mockReturnThis(),
      upload: jest.fn(),
      getPublicUrl: jest.fn()
    },
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    auth: {
      getUser: jest.fn()
    }
  };
  return { supabase: mockSupabase };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn()
}));

// Mock fetch for file uploads
global.fetch = jest.fn();
global.Blob = class Blob {};

describe('DocumentService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('processDocument', () => {
    it('should process and upload a document successfully', async () => {
      // Mock file and response data
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1024
      };

      const mockBlob = new Blob();
      const mockUserId = 'user-123';
      const mockDocumentId = 'doc-123';

      // Mock fetch response
      fetch.mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob)
      });

      // Mock Supabase storage response
      const mockStorageData = { path: 'documents/timestamp.pdf' };
      supabase.storage.from().upload.mockResolvedValue({
        data: mockStorageData,
        error: null
      });

      // Mock Supabase auth response
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock Supabase document insert response
      const mockDocumentRecord = [{
        id: mockDocumentId,
        title: 'test',
        file_path: 'timestamp.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        status: 'completed',
        created_at: '2023-01-01T00:00:00.000Z'
      }];

      supabase.from.mockReturnThis();
      supabase.insert.mockReturnThis();
      supabase.select.mockResolvedValue({
        data: mockDocumentRecord,
        error: null
      });

      // Call the method
      const result = await documentService.processDocument(mockFile);

      // Verify fetch was called with correct URI
      expect(fetch).toHaveBeenCalledWith('file://test.pdf');

      // Verify Supabase storage was called with correct params
      expect(supabase.storage.from).toHaveBeenCalledWith('documents');
      expect(supabase.storage.from().upload).toHaveBeenCalledWith(
        expect.stringContaining('.pdf'),
        mockBlob,
        {
          contentType: 'application/pdf',
          cacheControl: '3600'
        }
      );

      // Verify document record was created
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.insert).toHaveBeenCalledWith(expect.objectContaining({
        title: 'test',
        file_type: 'application/pdf',
        file_size: 1024,
        status: 'completed',
        user_id: mockUserId
      }));

      // Verify document was saved to local storage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `document_${mockDocumentId}`,
        expect.any(String)
      );

      // Verify correct result was returned
      expect(result).toEqual({
        document: {
          id: mockDocumentId,
          title: 'test',
          filePath: 'timestamp.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          status: 'completed',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      });
    });

    it('should throw error when file upload fails', async () => {
      // Mock file and response data
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        type: 'application/pdf'
      };

      const mockBlob = new Blob();

      // Mock fetch response
      fetch.mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob)
      });

      // Mock Supabase storage error
      supabase.storage.from().upload.mockResolvedValue({
        data: null,
        error: new Error('Storage error')
      });

      // Call the method and expect error
      await expect(documentService.processDocument(mockFile))
        .rejects.toThrow('Storage error');

      // Verify document was not saved to local storage
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should throw error when document record creation fails', async () => {
      // Mock file and response data
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        type: 'application/pdf'
      };

      const mockBlob = new Blob();
      const mockUserId = 'user-123';

      // Mock fetch response
      fetch.mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob)
      });

      // Mock Supabase storage response
      const mockStorageData = { path: 'documents/timestamp.pdf' };
      supabase.storage.from().upload.mockResolvedValue({
        data: mockStorageData,
        error: null
      });

      // Mock Supabase auth response
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock Supabase document insert error
      supabase.from.mockReturnThis();
      supabase.insert.mockReturnThis();
      supabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      // Call the method and expect error
      await expect(documentService.processDocument(mockFile))
        .rejects.toThrow('Database error');

      // Verify document was not saved to local storage
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getDocument', () => {
    it('should get a document from Supabase successfully', async () => {
      const mockDocumentId = 'doc-123';
      const mockDocument = {
        id: mockDocumentId,
        title: 'Test Document',
        file_path: 'test.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        status: 'completed',
        created_at: '2023-01-01T00:00:00.000Z'
      };

      // Mock Supabase responses
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValue({
        data: mockDocument,
        error: null
      });

      supabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test.pdf' }
      });

      // Call the method
      const result = await documentService.getDocument(mockDocumentId);

      // Verify Supabase was called with correct params
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('id', mockDocumentId);

      // Verify storage was called to get public URL
      expect(supabase.storage.from).toHaveBeenCalledWith('documents');
      expect(supabase.storage.from().getPublicUrl).toHaveBeenCalledWith('test.pdf');

      // Verify document was saved to local storage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `document_${mockDocumentId}`,
        expect.any(String)
      );

      // Verify correct result was returned
      expect(result).toEqual({
        id: mockDocumentId,
        title: 'Test Document',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        fileUrl: 'https://example.com/test.pdf',
        status: 'completed',
        createdAt: '2023-01-01T00:00:00.000Z'
      });
    });

    it('should fall back to local storage when Supabase fails', async () => {
      const mockDocumentId = 'doc-123';
      const mockDocument = {
        id: mockDocumentId,
        title: 'Test Document',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        status: 'completed',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock Supabase error
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValue({
        data: null,
        error: new Error('API error')
      });

      // Mock AsyncStorage response
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDocument));

      // Call the method
      const result = await documentService.getDocument(mockDocumentId);

      // Verify Supabase was called
      expect(supabase.from).toHaveBeenCalledWith('documents');

      // Verify local storage was checked
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`document_${mockDocumentId}`);

      // Verify correct result was returned
      expect(result).toEqual(mockDocument);
    });

    it('should throw error when document is not found in Supabase or local storage', async () => {
      const mockDocumentId = 'doc-123';

      // Mock Supabase error
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.single.mockResolvedValue({
        data: null,
        error: new Error('API error')
      });

      // Mock empty AsyncStorage response
      AsyncStorage.getItem.mockResolvedValue(null);

      // Call the method and expect error
      await expect(documentService.getDocument(mockDocumentId))
        .rejects.toThrow('Document not found');
    });
  });

  describe('getDocumentHistory', () => {
    it('should get document history from Supabase successfully', async () => {
      const mockUserId = 'user-123';
      const mockDocuments = [
        {
          id: 'doc-1',
          title: 'Document 1',
          file_path: 'doc1.pdf',
          file_type: 'application/pdf',
          file_size: 1024,
          status: 'completed',
          created_at: '2023-01-02T00:00:00.000Z'
        },
        {
          id: 'doc-2',
          title: 'Document 2',
          file_path: 'doc2.pdf',
          file_type: 'application/pdf',
          file_size: 2048,
          status: 'completed',
          created_at: '2023-01-01T00:00:00.000Z'
        }
      ];

      // Mock Supabase auth response
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock Supabase document query response
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.order.mockReturnThis();
      supabase.range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 2
      });

      // Mock storage public URL responses
      supabase.storage.from().getPublicUrl
        .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/doc1.pdf' } })
        .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/doc2.pdf' } });

      // Call the method
      const result = await documentService.getDocumentHistory(1, 10);

      // Verify Supabase was called with correct params
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(supabase.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(supabase.range).toHaveBeenCalledWith(0, 9);

      // Verify documents were saved to local storage
      expect(AsyncStorage.setItem).toHaveBeenCalled(); // We don't check the exact number of calls as it depends on implementation details

      // Verify correct result was returned
      expect(result).toEqual({
        documents: [
          {
            id: 'doc-1',
            title: 'Document 1',
            filePath: 'doc1.pdf',
            fileType: 'application/pdf',
            fileSize: 1024,
            fileUrl: 'https://example.com/doc1.pdf',
            status: 'completed',
            createdAt: '2023-01-02T00:00:00.000Z'
          },
          {
            id: 'doc-2',
            title: 'Document 2',
            filePath: 'doc2.pdf',
            fileType: 'application/pdf',
            fileSize: 2048,
            fileUrl: 'https://example.com/doc2.pdf',
            status: 'completed',
            createdAt: '2023-01-01T00:00:00.000Z'
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      });
    });

    it('should fall back to local storage when Supabase fails', async () => {
      const mockUserId = 'user-123';
      const mockHistory = [
        {
          id: 'doc-1',
          title: 'Document 1',
          filePath: 'doc1.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          status: 'completed',
          createdAt: '2023-01-02T00:00:00.000Z'
        },
        {
          id: 'doc-2',
          title: 'Document 2',
          filePath: 'doc2.pdf',
          fileType: 'application/pdf',
          fileSize: 2048,
          status: 'completed',
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ];

      // Mock Supabase auth response
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock Supabase error
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.order.mockReturnThis();
      supabase.range.mockResolvedValue({
        data: null,
        error: new Error('API error')
      });

      // Mock AsyncStorage response
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockHistory));

      // Call the method
      const result = await documentService.getDocumentHistory(1, 10);

      // Verify Supabase was called
      expect(supabase.from).toHaveBeenCalledWith('documents');

      // Verify local storage was checked
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('documentHistory');

      // Verify correct result was returned
      expect(result).toEqual({
        documents: mockHistory,
        total: 2,
        page: 1,
        limit: 10
      });
    });

    it('should return empty array when no documents are found', async () => {
      const mockUserId = 'user-123';

      // Mock Supabase auth response
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });

      // Mock Supabase error
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockReturnThis();
      supabase.order.mockReturnThis();
      supabase.range.mockResolvedValue({
        data: null,
        error: new Error('API error')
      });

      // Mock empty AsyncStorage response
      AsyncStorage.getItem.mockResolvedValue(null);

      // Call the method
      const result = await documentService.getDocumentHistory(1, 10);

      // Verify correct result was returned
      expect(result).toEqual({
        documents: []
      });
    });
  });

  describe('extractTopics', () => {
    it('should return mock topics for a document', async () => {
      const mockDocumentId = 'doc-123';

      // Call the method
      const result = await documentService.extractTopics(mockDocumentId);

      // Verify correct result was returned
      expect(result).toEqual({
        topics: [
          { name: 'Topic 1', relevance: 0.95 },
          { name: 'Topic 2', relevance: 0.85 },
          { name: 'Topic 3', relevance: 0.75 }
        ]
      });
    });
  });

  describe('generateSummary', () => {
    it('should generate a summary for a document', async () => {
      const mockDocumentId = 'doc-123';
      const mockDocument = {
        id: mockDocumentId,
        title: 'Test Document',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        status: 'completed',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock getDocument method
      jest.spyOn(documentService, 'getDocument').mockResolvedValue(mockDocument);

      // Call the method
      const result = await documentService.generateSummary(mockDocumentId);

      // Verify getDocument was called
      expect(documentService.getDocument).toHaveBeenCalledWith(mockDocumentId);

      // Verify correct result was returned
      expect(result).toEqual({
        summary: 'This is a summary of the document titled "Test Document". In a real implementation, this would be generated using natural language processing.',
        keyPoints: [
          'Key point 1 about the document',
          'Key point 2 about the document',
          'Key point 3 about the document'
        ]
      });
    });

    it('should throw error when document retrieval fails', async () => {
      const mockDocumentId = 'doc-123';

      // Mock getDocument method to throw error
      jest.spyOn(documentService, 'getDocument').mockRejectedValue(new Error('Document not found'));

      // Call the method and expect error
      await expect(documentService.generateSummary(mockDocumentId))
        .rejects.toThrow('Document not found');
    });
  });

  describe('saveDocumentToStorage', () => {
    it('should save a document to local storage', async () => {
      const mockDocument = {
        id: 'doc-123',
        title: 'Test Document',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        status: 'completed',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock AsyncStorage responses
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(['doc-456'])) // documentList
        .mockResolvedValueOnce(JSON.stringify([{ id: 'doc-456' }])); // documentHistory

      // Call the method
      await documentService.saveDocumentToStorage(mockDocument);

      // Verify document was saved
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'document_doc-123',
        JSON.stringify(mockDocument)
      );

      // Verify document list was updated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'documentList',
        JSON.stringify(['doc-456', 'doc-123'])
      );

      // Verify document history was updated
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'documentHistory',
        expect.stringContaining('doc-123')
      );
    });

    it('should update existing document in history', async () => {
      const mockDocument = {
        id: 'doc-123',
        title: 'Updated Document',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        status: 'completed',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock AsyncStorage responses
      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(['doc-123'])) // documentList
        .mockResolvedValueOnce(JSON.stringify([{ 
          id: 'doc-123', 
          title: 'Test Document',
          createdAt: '2023-01-01T00:00:00.000Z'
        }])); // documentHistory

      // Call the method
      await documentService.saveDocumentToStorage(mockDocument);

      // Verify document was saved
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'document_doc-123',
        JSON.stringify(mockDocument)
      );

      // Verify document was saved to storage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'document_doc-123',
        expect.any(String)
      );

      // Verify document history was updated with new title
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'documentHistory',
        expect.stringContaining('Updated Document')
      );
    });
  });

  describe('getDocumentFromStorage', () => {
    it('should get a document from local storage', async () => {
      const mockDocumentId = 'doc-123';
      const mockDocument = {
        id: mockDocumentId,
        title: 'Test Document',
        filePath: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        status: 'completed',
        createdAt: '2023-01-01T00:00:00.000Z'
      };

      // Mock AsyncStorage response
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDocument));

      // Call the method
      const result = await documentService.getDocumentFromStorage(mockDocumentId);

      // Verify AsyncStorage was called
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`document_${mockDocumentId}`);

      // Verify correct result was returned
      expect(result).toEqual(mockDocument);
    });

    it('should return null when document is not found', async () => {
      const mockDocumentId = 'doc-123';

      // Mock empty AsyncStorage response
      AsyncStorage.getItem.mockResolvedValue(null);

      // Call the method
      const result = await documentService.getDocumentFromStorage(mockDocumentId);

      // Verify AsyncStorage was called
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`document_${mockDocumentId}`);

      // Verify null was returned
      expect(result).toBeNull();
    });

    it('should return null when there is an error', async () => {
      const mockDocumentId = 'doc-123';

      // Mock AsyncStorage error
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      // Call the method
      const result = await documentService.getDocumentFromStorage(mockDocumentId);

      // Verify AsyncStorage was called
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(`document_${mockDocumentId}`);

      // Verify null was returned
      expect(result).toBeNull();
    });
  });
});
