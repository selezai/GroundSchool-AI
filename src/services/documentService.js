import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

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
      // Commented out as it's currently unused
      // const processingOptions = {
      //   extractText: true,
      //   generateSummary: true,
      //   ...options
      // };
      
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      // Fetch the file data as a blob
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Upload to storage bucket
      const { /* data: storageData, */ error: storageError } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, {
          contentType: file.type,
          cacheControl: '3600'
        });
      
      if (storageError) throw storageError;
      
      // Create document record in database
      const documentData = {
        title: file.name.replace(`.${fileExt}`, ''),
        file_path: fileName,
        file_type: file.type,
        file_size: file.size || 0,
        status: 'completed', // Initially set to completed since we're not doing actual processing
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id
      };
      
      const { data: documentRecord, error: documentError } = await supabase
        .from('documents')
        .insert(documentData)
        .select();
        
      if (documentError) throw documentError;
      
      // Format response to match expected structure
      const documentResponse = {
        document: {
          id: documentRecord[0].id,
          title: documentRecord[0].title,
          filePath: documentRecord[0].file_path,
          fileType: documentRecord[0].file_type,
          fileSize: documentRecord[0].file_size,
          status: documentRecord[0].status,
          createdAt: documentRecord[0].created_at
        }
      };
      
      // Store document in local storage for offline access
      await this.saveDocumentToStorage(documentResponse.document);
      
      return documentResponse;
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
      // Try to get from Supabase first
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .single();
          
        if (error) throw error;
        
        // Get the file URL if available
        let fileUrl = null;
        if (data?.file_path) {
          const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(data.file_path);
          fileUrl = publicUrlData?.publicUrl;
        }
        
        // Format response
        const document = {
          id: data.id,
          title: data.title,
          filePath: data.file_path,
          fileType: data.file_type,
          fileSize: data.file_size,
          fileUrl: fileUrl,
          status: data.status,
          createdAt: data.created_at
        };
        
        // Cache the document locally
        await this.saveDocumentToStorage(document);
        
        return document;
      } catch (_apiError) {
        console.log('Could not fetch document from Supabase, trying local storage');
        
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
      // Try to get documents from Supabase
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const { data, error, count } = await supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
        
      if (error) throw error;
      
      // Format documents
      const formattedDocuments = await Promise.all(
        data.map(async (doc) => {
          // Get file URL if available
          let fileUrl = null;
          if (doc.file_path) {
            const { data: publicUrlData } = supabase.storage
              .from('documents')
              .getPublicUrl(doc.file_path);
            fileUrl = publicUrlData?.publicUrl;
          }
          
          return {
            id: doc.id,
            title: doc.title,
            filePath: doc.file_path,
            fileType: doc.file_type,
            fileSize: doc.file_size,
            fileUrl: fileUrl,
            status: doc.status,
            createdAt: doc.created_at
          };
        })
      );
      
      // Cache documents locally
      for (const doc of formattedDocuments) {
        await this.saveDocumentToStorage(doc);
      }
      
      return {
        documents: formattedDocuments,
        total: count || 0,
        page,
        limit
      };
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
      // Placeholder: In a real implementation, we would use a service to extract topics
      // For now, return a mock response
      const result = {
        topics: [
          { name: 'Topic 1', relevance: 0.95 },
          { name: 'Topic 2', relevance: 0.85 },
          { name: 'Topic 3', relevance: 0.75 }
        ]
      };
      return result;
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
      // Get the document to retrieve its content
      const document = await this.getDocument(documentId);
      
      // Placeholder: In a real implementation, we would use a service to generate a summary
      // For now, return a mock response
      return {
        summary: `This is a summary of the document titled "${document.title}". In a real implementation, this would be generated using natural language processing.`,
        keyPoints: [
          'Key point 1 about the document',
          'Key point 2 about the document',
          'Key point 3 about the document'
        ]
      };
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
