import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Document Service for handling document processing and storage
 */
class DocumentService {
  /**
   * Upload and process a document
   * @param {Object} file - File object with uri, name, and type
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processed document data
   */
  async processDocument(file, options = {}) {
    try {
      // Set default options
      const processingOptions = {
        extractText: true,
        generateSummary: true,
        ...options
      };
      
      // Upload and process the document
      const response = await apiClient.uploadFile('/documents/process', file, processingOptions);
      
      // Store document in local storage for offline access
      if (response.document && response.document.id) {
        await this.saveDocumentToStorage(response.document);
      }
      
      return response;
    } catch (error) {
      console.error('Document processing error:', error);
      throw error;
    }
  }
  
  /**
   * Get document by ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Document data
   */
  async getDocument(documentId) {
    try {
      // Try to get from API first
      try {
        const response = await apiClient.get(`/documents/${documentId}`);
        return response.document;
      } catch (apiError) {
        console.log('Could not fetch document from API, trying local storage');
        
        // Fall back to local storage if API fails
        const document = await this.getDocumentFromStorage(documentId);
        if (!document) {
          throw new Error('Document not found');
        }
        return document;
      }
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  }
  
  /**
   * Get user's document history
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Document history data
   */
  async getDocumentHistory(page = 1, limit = 10) {
    try {
      return await apiClient.get('/documents/history', {
        params: { page, limit }
      });
    } catch (error) {
      console.error('Get document history error:', error);
      
      // Fall back to local storage if API fails
      try {
        const historyString = await AsyncStorage.getItem('documentHistory');
        if (!historyString) {
          return { documents: [] };
        }
        
        const history = JSON.parse(historyString);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedHistory = history.slice(startIndex, endIndex);
        
        return {
          documents: paginatedHistory,
          total: history.length,
          page,
          limit
        };
      } catch (localError) {
        console.error('Local history retrieval error:', localError);
        throw error; // Throw original API error
      }
    }
  }
  
  /**
   * Extract key topics from document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Topics data
   */
  async extractTopics(documentId) {
    try {
      return await apiClient.get(`/documents/${documentId}/topics`);
    } catch (error) {
      console.error('Extract topics error:', error);
      throw error;
    }
  }
  
  /**
   * Generate a summary of the document
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} - Summary data
   */
  async generateSummary(documentId) {
    try {
      return await apiClient.get(`/documents/${documentId}/summary`);
    } catch (error) {
      console.error('Generate summary error:', error);
      throw error;
    }
  }
  
  /**
   * Save document to local storage
   * @param {Object} document - Document data
   * @returns {Promise<void>}
   */
  async saveDocumentToStorage(document) {
    try {
      // Save individual document
      await AsyncStorage.setItem(`document_${document.id}`, JSON.stringify(document));
      
      // Update document list
      const documentListString = await AsyncStorage.getItem('documentList');
      const documentList = documentListString ? JSON.parse(documentListString) : [];
      
      // Add to list if not already present
      if (!documentList.includes(document.id)) {
        documentList.push(document.id);
        await AsyncStorage.setItem('documentList', JSON.stringify(documentList));
      }
      
      // Update document history
      const historyString = await AsyncStorage.getItem('documentHistory');
      const history = historyString ? JSON.parse(historyString) : [];
      
      // Add to history if not already present
      const existingIndex = history.findIndex(item => item.id === document.id);
      if (existingIndex >= 0) {
        history[existingIndex] = {
          ...history[existingIndex],
          ...document,
          updatedAt: new Date().toISOString()
        };
      } else {
        history.unshift({
          ...document,
          createdAt: new Date().toISOString()
        });
      }
      
      await AsyncStorage.setItem('documentHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Save document to storage error:', error);
    }
  }
  
  /**
   * Get document from local storage
   * @param {string} documentId - Document ID
   * @returns {Promise<Object|null>}
   */
  async getDocumentFromStorage(documentId) {
    try {
      const documentString = await AsyncStorage.getItem(`document_${documentId}`);
      return documentString ? JSON.parse(documentString) : null;
    } catch (error) {
      console.error('Get document from storage error:', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const documentService = new DocumentService();
export default documentService;
