import { useState, useEffect } from 'react';
import { Container, Box, CircularProgress, AppBar, Toolbar, Typography, Button, SvgIcon, Snackbar, Alert } from '@mui/material';
import { TranslationAnnotator } from './components/TranslationAnnotator';
import { BatchSelector } from './components/BatchSelector';
import { useAuth } from './context/AuthContext';
import { TranslationEntry, ErrorSpan, AnnotationSubmission } from './types';
import logo from './assets/logo.svg';

const GoogleIcon = () => (
  <SvgIcon>
    <svg viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  </SvgIcon>
);

const BATCH_SIZE = 20;

function App() {
  const { user, signInWithGoogle, logout, loading } = useAuth();
  const [translations, setTranslations] = useState<TranslationEntry[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(() => {
    // Try to restore page from localStorage, default to 1
    const savedPage = localStorage.getItem('currentPage');
    return savedPage ? parseInt(savedPage) : 1;
  });
  const [selectedEntry, setSelectedEntry] = useState<TranslationEntry | null>(null);
  const [lastSelectedEntryId, setLastSelectedEntryId] = useState<string | null>(() => {
    return localStorage.getItem('lastSelectedEntryId');
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage.toString());
  }, [currentPage]);

  // Save last selected entry ID to localStorage
  useEffect(() => {
    if (selectedEntry) {
      localStorage.setItem('lastSelectedEntryId', selectedEntry.id);
    }
  }, [selectedEntry]);

  // Restore selected entry when translations load
  useEffect(() => {
    if (translations && lastSelectedEntryId) {
      const savedEntry = translations.find(t => t.id === lastSelectedEntryId);
      if (savedEntry && !savedEntry.isSubmitted) {
        setSelectedEntry(savedEntry);
      } else {
        // Clear saved entry if not found or already submitted
        localStorage.removeItem('lastSelectedEntryId');
        setLastSelectedEntryId(null);
      }
    }
  }, [translations, lastSelectedEntryId]);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_AWS_ANNOTATION_ENDPOINT}?page=${currentPage}&limit=${BATCH_SIZE}${user ? `&userId=${user.uid}` : ''}`,
          {
            method: 'GET',
            headers: {
              'content-type': 'application/json',
            },
          }
        );
        

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);

        if (result.translations && result.pagination) {
          setTranslations(result.translations);
          setTotalPages(result.pagination.totalPages);
        } else {
          console.error('Invalid response structure:', result);
          setError('Invalid response format from server.');
        }
      } catch (error) {
        console.error('Error loading translations:', error);
        setError('Failed to load translations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadTranslations();
    }
  }, [currentPage, user]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Don't clear selection when changing pages
    // setSelectedEntry(null);
  };

  const handleEntrySelect = (entry: TranslationEntry) => {
    if (!user) return;
    setSelectedEntry(entry);
  };

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  const moveToNextEntry = () => {
    if (!translations) return;
    
    const currentEntries = getCurrentBatchEntries();
    const currentIndex = currentEntries.findIndex(entry => entry.id === selectedEntry?.id);
    
    if (currentIndex === -1) return;
    
    // If there's a next entry in current batch
    if (currentIndex < currentEntries.length - 1) {
      setSelectedEntry(currentEntries[currentIndex + 1]);
    } 
    // If we're at the end of current batch and there are more batches
    else if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      const nextBatchEntries = translations.slice(currentPage * BATCH_SIZE, (currentPage + 1) * BATCH_SIZE);
      if (nextBatchEntries.length > 0) {
        setSelectedEntry(nextBatchEntries[0]);
      }
    }
    // If we're at the very end, just clear selection
    else {
      setSelectedEntry(null);
    }
  };

  const handleAnnotationSubmit = async (editedTranslation: string, errorSpans: ErrorSpan[], overallScore: number) => {
    if (!user || !selectedEntry) return;

    // Check if already submitted
    if (selectedEntry.isSubmitted) {
      setMessage({
        text: "This translation has already been annotated by you. Please move to the next one.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const annotation: AnnotationSubmission = {
      id: selectedEntry.id,
      userId: user.uid,
      userEmail: user.email,
      originalText: selectedEntry.englishText,
      machineTranslation: selectedEntry.chineseText,
      editedTranslation,
      errorSpans,
      overallScore,
      submittedAt: new Date(),
    };

    // Log the submission data (for development)
    console.log("Submitting annotation:", annotation);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_AWS_ANNOTATION_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(annotation),
        }
      );

      const result = await response.json();
      console.log("API Response:", result);

      // Check if the response itself was not successful
      if (!response.ok) {
        setMessage({
          text: result.message || "Failed to submit annotation.",
          type: "error",
        });
        return;
      }

      // Check specific error cases
      if (result.statusCode === 404) {
        setMessage({
          text: "Translation not found. It may have been deleted.",
          type: "error",
        });
        setCurrentPage(currentPage);
        return;
      }

      if (result.statusCode === 409) {
        setMessage({
          text: "This translation has already been annotated by you. Please move to the next one.",
          type: "error",
        });
        return;
      }
      if (result.statusCode != 200) {
        setMessage({
          text: "Failed to submit annotation. Please try again.",
          type: "error",
        });
        return;
      }

      // Only update state and show success if everything worked
      setTranslations((prev) => {
        if (!prev) return prev;
        return prev.map((t) =>
          t.id === selectedEntry.id ? { ...t, isSubmitted: true } : t
        );
      });

      setMessage({
        text: "Annotation submitted successfully!",
        type: "success",
      });
      moveToNextEntry();

    } catch (err) {
      console.error("Submission error:", err);
      setMessage({
        text: "Failed to submit annotation. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!user || !selectedEntry) return;
    setIsSubmitting(true);
    setMessage(null);

    // Log the submission data (for development)
    const deleteBody = {
      userId: user.uid,
      id: selectedEntry.id,
    };
    console.log("Submitting annotation deletion:", deleteBody);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_AWS_ANNOTATION_ENDPOINT}`,
        {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(deleteBody),
        }
      );

      const result = await response.json();

      console.log("API Response:", result);

      if (result.statusCode === 404) {
        setMessage({
          text: "Translation not found. It may have been deleted.",
          type: "error",
        });
        // Refresh translations to get updated state
        setCurrentPage(currentPage);
        return;
      }

      if (result.statusCode != 200 || result.error) {
        setMessage({
          text: result.message || "Failed to cancel submission.",
          type: "error",
        });
        return;
      }

      // Update the isSubmitted status in the translations array
      setTranslations((prev) => {
        if (!prev) return prev;
        return prev.map((t) =>
          t.id === selectedEntry.id ? { ...t, isSubmitted: false } : t
        );
      });

      setMessage({
        text: "Submission cancelled successfully.",
        type: "success",
      });
    } catch (err) {
      console.error("Cancel error:", err);
      setMessage({
        text: "Failed to cancel submission. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentBatchEntries = () => translations || [];

  // Clear selected entry but keep lastSelectedEntryId when logging out
  const handleLogout = async () => {
    setSelectedEntry(null);
    await logout();
  };

  // Try to restore selected entry after login
  useEffect(() => {
    if (user && translations && lastSelectedEntryId) {
      const savedEntry = translations.find(t => t.id === lastSelectedEntryId);
      if (savedEntry && !savedEntry.isSubmitted) {
        setSelectedEntry(savedEntry);
      } else {
        // Clear saved entry if not found or already submitted
        localStorage.removeItem('lastSelectedEntryId');
        setLastSelectedEntryId(null);
      }
    }
  }, [user, translations, lastSelectedEntryId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img 
              src={logo} 
              alt="TranslationCorrect Logo" 
              style={{ 
                height: '40px',
                marginRight: '16px',
              }} 
            />
          </Box>
          {user && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {user.email}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, px: '0 !important' }}>
        {user ? (
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* Sidebar */}
            <Box
              sx={{
                width: 320,
                flexShrink: 0,
                borderRight: '1px solid',
                borderColor: 'divider',
                height: 'calc(100vh - 100px)',
                position: 'sticky',
                top: '80px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#666',
                },
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : translations && translations.length > 0 ? (
                <BatchSelector
                  entries={getCurrentBatchEntries()}
                  currentBatch={currentPage}
                  totalBatches={totalPages}
                  onBatchChange={handlePageChange}
                  onEntrySelect={handleEntrySelect}
                  selectedEntry={selectedEntry}
                />
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No translations available
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, minHeight: 'calc(100vh - 100px)' }}>
              {selectedEntry ? (
                <TranslationAnnotator
                  entry={selectedEntry}
                  onSubmit={handleAnnotationSubmit}
                  onCancel={handleCancelSubmit}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary'
                  }}
                >
                  <Typography variant="h6">
                    Select an entry from the sidebar to start annotating
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              gap: 3
            }}
          >
            <Typography variant="h4" gutterBottom>
              Welcome to TranslationCorrect
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              A tool for annotating and analyzing translation errors
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={signInWithGoogle}
              startIcon={<GoogleIcon />}
              sx={{ 
                mt: 2,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                backgroundColor: '#fff',
                color: '#757575',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
                }
              }}
            >
              Sign in with Google
            </Button>
          </Box>
        )}
      </Container>

      <Snackbar 
        open={error !== null} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: 2 }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={message !== null} 
        autoHideDuration={6000} 
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: 2 }}
      >
        <Alert 
          onClose={handleCloseMessage} 
          severity={message?.type || 'error'} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
