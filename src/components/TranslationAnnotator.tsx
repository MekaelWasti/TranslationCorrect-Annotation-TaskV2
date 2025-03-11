import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Tooltip,
  TextField,
  Slider,
} from '@mui/material';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { TranslationEntry, ErrorType, ErrorSpan, ErrorSeverity } from '../types';

// Interface for annotation submission to MongoDB
interface AnnotationSubmission {
  id: string;
  originalText: string;
  machineTranslation: string;
  editedTranslation: string;
  errorSpans: ErrorSpan[];
  overallScore: number;
}

const getErrorTypeColor = (errorType: ErrorType): string => {
  switch (errorType) {
    case 'Addition': return '#ffcdd2';
    case 'Omission': return '#c8e6c9';
    case 'Mistranslation': return '#ffe0b2';
    case 'Untranslated': return '#e1bee7';
    case 'Grammar': return '#bbdefb';
    case 'Spelling': return '#f8bbd0';
    case 'Typography': return '#cfd8dc';
    case 'Unintelligible': return '#f5f5f5';
    default: return 'transparent';
  }
};

const getSeverityColor = (severity: ErrorSeverity): string => {
  switch (severity) {
    case 'Minor': return '#4caf50';  // Green
    case 'Major': return '#f44336';  // Red
    default: return 'transparent';
  }
};

interface Props {
  entry: TranslationEntry;
  onSubmit: (editedTranslation: string, errorSpans: ErrorSpan[], overallScore: number) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const TranslationAnnotator = ({ entry, onSubmit, onCancel, isSubmitting }: Props) => {
  const [editedTranslation, setEditedTranslation] = useState(entry.chineseText);
  const [currentErrorType, setCurrentErrorType] = useState<ErrorType>('Addition');
  const [currentSeverity, setCurrentSeverity] = useState<ErrorSeverity>('Minor');
  const [errorSpans, setErrorSpans] = useState<ErrorSpan[]>([]);
  const annotationRef = useRef<HTMLDivElement>(null);
  const [overallScore, setOverallScore] = useState<number>(50);

  // Add useEffect to update editedTranslation when entry changes
  useEffect(() => {
    setEditedTranslation(entry.chineseText);
    setErrorSpans([]);  // Clear error spans for new entry
    setOverallScore(50);  // Reset score for new entry
  }, [entry]);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedTranslation(event.target.value);
  };

  const handleSelect = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString();
    
    if (!text.trim() || !annotationRef.current) return;

    // Calculate start and end positions
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(annotationRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + text.length;

    // Create new error span
    const newSpan: ErrorSpan = {
      start,
      end,
      type: currentErrorType,
      text,
      severity: currentSeverity,
    };

    // Add new error span
    setErrorSpans([...errorSpans, newSpan]);
    selection.removeAllRanges();
  };

  const handleSpanRemove = (spanToRemove: ErrorSpan) => {
    setErrorSpans(errorSpans.filter(span => 
      span.start !== spanToRemove.start || 
      span.end !== spanToRemove.end || 
      span.text !== spanToRemove.text
    ));
  };

  const renderTextWithHighlights = () => {
    let lastIndex = 0;
    const result: JSX.Element[] = [];
    const sortedSpans = [...errorSpans].sort((a, b) => a.start - b.start);

    sortedSpans.forEach((span, index) => {
      // Add text before the highlight
      if (span.start > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {entry.chineseText.slice(lastIndex, span.start)}
          </span>
        );
      }

      // Add highlighted text
      result.push(
        <Tooltip key={`highlight-${index}`} title={`${span.type} - ${span.severity}`}>
          <span
            style={{
              backgroundColor: getErrorTypeColor(span.type),
              padding: '0 2px',
              borderRadius: '2px',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: `0 -2px 0 ${getSeverityColor(span.severity)} inset`,
            }}
            onClick={() => handleSpanRemove(span)}
          >
            {span.text}
          </span>
        </Tooltip>
      );

      lastIndex = span.end;
    });

    // Add remaining text
    if (lastIndex < entry.chineseText.length) {
      result.push(
        <span key="text-end">
          {entry.chineseText.slice(lastIndex)}
        </span>
      );
    }

    return result;
  };

  const handleSubmit = () => {
    // Create the complete annotation submission
    const submission: AnnotationSubmission = {
      id: entry.id,
      originalText: entry.englishText,
      machineTranslation: entry.chineseText,
      editedTranslation: editedTranslation,
      errorSpans: errorSpans.sort((a, b) => a.start - b.start),
      overallScore,
    };

    // Pass the complete submission data to the parent component
    onSubmit(submission.editedTranslation, submission.errorSpans, submission.overallScore);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Source Text */}
      <Typography variant="h6" gutterBottom>
        Source Text
      </Typography>
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Typography>{entry.englishText}</Typography>
      </Paper>

      {/* Machine Translation */}
      <Typography variant="h6" gutterBottom>
        Machine Translation
      </Typography>
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Typography>{entry.chineseText}</Typography>
      </Paper>

      {/* Reference Translation */}
      <Typography variant="h6" gutterBottom>
        Reference Translation
      </Typography>
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Typography>{entry.referenceText}</Typography>
      </Paper>

      {/* Error Annotation Section */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3, 
          mb: 4,
          backgroundColor: 'background.default'
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 500,
            mb: 2
          }}
        >
          Error Annotation
        </Typography>
        
        <Stack spacing={2}>
          {/* Error Type Selection */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Select Error Type:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(['Addition', 'Omission', 'Mistranslation', 'Untranslated', 
                'Grammar', 'Spelling', 'Typography', 'Unintelligible'] as ErrorType[]).map((type) => (
                <Button
                  key={type}
                  size="small"
                  variant={currentErrorType === type ? "contained" : "outlined"}
                  onClick={() => setCurrentErrorType(type)}
                  sx={{
                    backgroundColor: currentErrorType === type ? getErrorTypeColor(type) : 'transparent',
                    color: 'text.primary',
                    borderColor: getErrorTypeColor(type),
                    '&:hover': {
                      backgroundColor: currentErrorType === type 
                        ? getErrorTypeColor(type) 
                        : `${getErrorTypeColor(type)}88`
                    }
                  }}
                >
                  {type}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Severity Selection */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Select Error Severity:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(['Minor', 'Major'] as ErrorSeverity[]).map((severity) => (
                <Button
                  key={severity}
                  size="small"
                  variant={currentSeverity === severity ? "contained" : "outlined"}
                  onClick={() => setCurrentSeverity(severity)}
                  sx={{
                    backgroundColor: currentSeverity === severity 
                      ? getSeverityColor(severity) 
                      : 'transparent',
                    color: currentSeverity === severity ? '#fff' : getSeverityColor(severity),
                    borderColor: getSeverityColor(severity),
                    '&:hover': {
                      backgroundColor: currentSeverity === severity 
                        ? getSeverityColor(severity) 
                        : `${getSeverityColor(severity)}22`
                    }
                  }}
                >
                  {severity}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Text for Annotation */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Select text to annotate:</Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                backgroundColor: 'background.paper',
                position: 'relative',
              }}
            >
              <Box
                ref={annotationRef}
                onMouseUp={handleSelect}
                sx={{
                  minHeight: '100px',
                  outline: 'none',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  userSelect: 'text',
                  cursor: 'text',
                }}
              >
                {renderTextWithHighlights()}
              </Box>
            </Paper>
          </Box>
        </Stack>
      </Paper>

      {/* Post Edit Section */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3,
          mb: 4,
          backgroundColor: 'background.default'
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 500,
            mb: 2
          }}
        >
          Post Edit
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          value={editedTranslation}
          onChange={handleTextChange}
          variant="outlined"
          placeholder="Edit the translation here..."
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper'
            }
          }}
        />

        <Typography variant="body2" sx={{ mb: 2 }}>Changes Preview:</Typography>
        <ReactDiffViewer
          oldValue={entry.chineseText}
          newValue={editedTranslation}
          splitView={false}
          showDiffOnly={false}
        />
      </Paper>

      {/* Overall Translation Score Section */}
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 3,
          mb: 4,
          backgroundColor: 'background.default'
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 500,
            mb: 2
          }}
        >
          Overall Translation Score
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={overallScore}
            onChange={(_, value) => setOverallScore(value as number)}
            min={0}
            max={100}
            step={1}
            marks={[
              { value: 0, label: '0' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
              { value: 75, label: '75' },
              { value: 100, label: '100' }
            ]}
            valueLabelDisplay="on"
            sx={{
              '& .MuiSlider-markLabel': {
                color: 'text.secondary',
              },
            }}
          />
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center" 
            sx={{ mt: 1 }}
          >
            {overallScore === 100 ? 'Perfect' : 
             overallScore >= 80 ? 'Excellent' :
             overallScore >= 60 ? 'Good' :
             overallScore >= 40 ? 'Fair' :
             overallScore >= 20 ? 'Poor' :
             'Very Poor'}
          </Typography>
        </Box>
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Submitting...' : 'Submit Annotation'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleCancel}
          disabled={isSubmitting}
          fullWidth
        >
          Cancel Submit
        </Button>
      </Stack>
    </Box>
  );
}; 