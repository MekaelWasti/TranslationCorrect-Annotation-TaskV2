import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Checkbox,
  ListItemIcon,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { TranslationEntry } from '../types';
import { useState } from 'react';

interface BatchNavigatorProps {
  currentBatch: number;
  totalBatches: number;
  onBatchChange: (batch: number) => void;
}

const BatchNavigator = ({ currentBatch, totalBatches, onBatchChange }: BatchNavigatorProps) => {
  const [batchInput, setBatchInput] = useState(currentBatch.toString());

  const handleBatchChange = () => {
    const batch = parseInt(batchInput);
    if (!isNaN(batch) && batch >= 1 && batch <= totalBatches) {
      onBatchChange(batch);
    } else {
      setBatchInput(currentBatch.toString());
    }
  };

  const handlePrevNext = (increment: number) => {
    const newBatch = currentBatch + increment;
    if (newBatch >= 1 && newBatch <= totalBatches) {
      onBatchChange(newBatch);
      setBatchInput(newBatch.toString());
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
      <IconButton 
        onClick={() => handlePrevNext(-1)}
        disabled={currentBatch <= 1}
        size="small"
      >
        <ChevronLeft />
      </IconButton>
      
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField
          size="small"
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleBatchChange();
            }
          }}
          onBlur={handleBatchChange}
          type="number"
          inputProps={{ 
            min: 1, 
            max: totalBatches,
            style: { 
              padding: '4px 8px',
              width: '60px',
              textAlign: 'center'
            }
          }}
        />
        <Typography variant="body2" color="text.secondary">
          / {totalBatches}
        </Typography>
      </Stack>

      <IconButton 
        onClick={() => handlePrevNext(1)}
        disabled={currentBatch >= totalBatches}
        size="small"
      >
        <ChevronRight />
      </IconButton>
    </Stack>
  );
};

interface Props {
  entries: TranslationEntry[];
  currentBatch: number;
  totalBatches: number;
  onBatchChange: (batch: number) => void;
  onEntrySelect: (entry: TranslationEntry) => void;
  selectedEntry: TranslationEntry | null;
}

export const BatchSelector = ({
  entries,
  currentBatch,
  totalBatches,
  onBatchChange,
  onEntrySelect,
  selectedEntry,
}: Props) => {
  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          Translation Batch
        </Typography>
        
        <BatchNavigator
          currentBatch={currentBatch}
          totalBatches={totalBatches}
          onBatchChange={onBatchChange}
        />
      </Box>
      
      <List sx={{ p: 0 }}>
        {entries.map((entry, index) => (
          <Box key={entry.id}>
            {index > 0 && <Divider />}
            <ListItemButton 
              onClick={() => onEntrySelect(entry)}
              selected={selectedEntry?.id === entry.id}
              sx={{ 
                py: 2,
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  borderLeft: '4px solid',
                  borderLeftColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'action.selected',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <ListItemIcon>
                <Checkbox
                  checked={entry.isSubmitted}
                  sx={{ 
                    '&.Mui-checked': {
                      color: 'success.main',
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 1,
                      fontWeight: selectedEntry?.id === entry.id ? 600 : 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {entry.englishText}
                  </Typography>
                }
                secondary={
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {entry.chineseText}
                  </Typography>
                }
              />
            </ListItemButton>
          </Box>
        ))}
      </List>
    </Box>
  );
}; 