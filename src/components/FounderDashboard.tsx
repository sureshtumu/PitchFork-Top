import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, FileText, User, ChevronDown, Upload, BarChart3, Trash2, Eye } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

interface FounderDashboardProps {
  isDark: boolean;
  toggleTheme: () => void;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  address?: string;
  country?: string;
  contact_name_1?: string;
  title_1?: string;
  email_1?: string;
  phone_1?: string;
  contact_name_2?: string;
  title_2?: string;
  email_2?: string;
  phone_2?: string;
  description?: string;
  funding_sought?: string;
  status?: string;
  date_submitted: string;
  created_at: string;
}

interface FounderMessage {
  id: string;
  company_id: string;
  title: string;
  message: string;
  status: string;
  date_sent: string;
}

interface Document {
  id: string;
  company_id: string;
  filename: string;
  document_name: string;
  description: string;
  path: string;
  date_added: string;
}

const FounderDashboard: React.FC<FounderDashboardProps> = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [messages, setMessages] = useState<FounderMessage[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newFiles, setNewFiles] = useState<FileList | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<{[key: string]: {name: string, description: string}}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check authentication and load data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      await loadFounderCompany();
    };
    
    checkAuthAndLoadData();
  }, [navigate]);

  const loadFounderCompany = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      // Look for companies where the founder is the contact
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('email_1', currentUser.email)
        .maybeSingle();

      if (companyError) {
        console.error('Error loading company:', companyError);
        setIsLoading(false);
        return;
      }

      if (companyData) {
        setCompany(companyData);
        await loadDocuments(companyData.id);
        await loadMessages(companyData.id);
      }
    } catch (error) {
      console.error('Error loading founder data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (companyId: string) => {
    try {
      setIsLoadingDocuments(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .order('date_added', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadMessages = async (companyId: string) => {
    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('founder_messages')
        .select('*')
        .eq('company_id', companyId)
        .order('date_sent', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFiles(e.target.files);
    
    // Initialize metadata for new files
    if (e.target.files) {
      const newMetadata: {[key: string]: {name: string, description: string}} = {};
      Array.from(e.target.files).forEach(file => {
        newMetadata[file.name] = {
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for default name
          description: ''
        };
      });
      setDocumentMetadata(newMetadata);
    }
  };

  const handleMetadataChange = (filename: string, field: 'name' | 'description', value: string) => {
    setDocumentMetadata(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async () => {
    if (!company || !newFiles || newFiles.length === 0) return;

    try {
      setIsUploading(true);
      const uploadPromises = [];
      const documentRecords = [];

      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const filePath = `${company.id}/${file.name}`;
        const metadata = documentMetadata[file.name] || { name: file.name, description: '' };

        // Upload file to Supabase Storage
        const uploadPromise = supabase.storage
          .from('company-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        uploadPromises.push(uploadPromise);
        documentRecords.push({
          company_id: company.id,
          filename: file.name,
          document_name: metadata.name,
          description: metadata.description,
          path: filePath
        });
      }

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      
      // Check for upload errors
      const failedUploads = uploadResults.filter(result => result.error);
      if (failedUploads.length > 0) {
        console.error('Upload errors:', failedUploads);
        setMessage({ type: 'error', text: `Failed to upload ${failedUploads.length} file(s)` });
        return;
      }

      // Insert document records into database
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert(documentRecords)
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        setMessage({ type: 'error', text: 'Files uploaded but failed to save records' });
        return;
      }

      // Add new documents to the list
      setDocuments(prev => [...(data || []), ...prev]);
      setMessage({ type: 'success', text: 'Files uploaded successfully!' });
      setNewFiles(null);
      setDocumentMetadata({});
      setShowUploadModal(false);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload files' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.document_name}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('company-documents')
        .remove([document.path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) {
        console.error('Error deleting document:', dbError);
        setMessage({ type: 'error', text: 'Failed to delete document' });
        return;
      }

      setDocuments(prev => prev.filter(d => d.id !== document.id));
      setMessage({ type: 'success', text: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  const handleCompanyUpdate = async () => {
    if (!editingCompany || !company) return;

    try {
      setIsUploading(true);
      const { error } = await supabase
        .from('companies')
        .update(editingCompany)
        .eq('id', company.id);

      if (error) {
        console.error('Error updating company:', error);
        setMessage({ type: 'error', text: 'Failed to update company information' });
        return;
      }

      setCompany(editingCompany);
      setEditingCompany(null);
      setShowEditModal(false);
              <div className="text-center py-8">
                        <p className={\`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        </div>
                  multiple
                  {Array.from(newFiles).map((file, index) => (
                        />
              )
              )
              }
    }
  }
}