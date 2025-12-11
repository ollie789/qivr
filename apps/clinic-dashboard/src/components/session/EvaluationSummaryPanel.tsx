import { useState } from 'react';
import { Box, Typography, Collapse, Chip, Stack, alpha, Skeleton, Tooltip } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { auraColors } from '@qivr/design-system';
import type { IntakeDetails } from '../../services/intakeApi';

interface EvaluationSummaryPanelProps {
  evaluation: IntakeDetails | null | undefined;
  isLoading?: boolean;
}

export function EvaluationSummaryPanel({ evaluation, isLoading }: EvaluationSummaryPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="text" width={150} />
        <Skeleton variant="rectangular" height={80} sx={{ mt: 1, borderRadius: 1 }} />
      </Box>
    );
  }

  if (!evaluation) {
    return null;
  }

  const { evaluation: evalData, painMap, aiSummary, questionnaireResponses } = evaluation;

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            Evaluation Summary
          </Typography>
        </Box>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>

      <Collapse in={expanded}>
        <Stack spacing={2} sx={{ px: 2, pb: 2 }}>
          {/* Chief Complaint */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Chief Complaint
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {evalData.conditionType || 'Not specified'}
            </Typography>
          </Box>

          {/* AI Summary */}
          {aiSummary?.content && (
            <Tooltip
              title={aiSummary.content.length > 200 ? aiSummary.content : ''}
              placement="right"
              arrow
            >
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: alpha(auraColors.purple.main, 0.08),
                  borderRadius: 1,
                  border: `1px solid ${alpha(auraColors.purple.main, 0.2)}`,
                  cursor: aiSummary.content.length > 200 ? 'help' : 'default',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <LightbulbIcon sx={{ fontSize: 14, color: auraColors.purple.main }} />
                  <Typography variant="caption" fontWeight={600} color={auraColors.purple.main}>
                    AI Triage Summary
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.5 }}>
                  {aiSummary.content.length > 200
                    ? `${aiSummary.content.slice(0, 200)}...`
                    : aiSummary.content}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Symptoms */}
          {evalData.symptoms && evalData.symptoms.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Symptoms
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {evalData.symptoms.slice(0, 5).map((symptom) => (
                  <Chip
                    key={`symptom-${symptom}`}
                    label={symptom}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
                {evalData.symptoms.length > 5 && (
                  <Chip
                    key="symptoms-overflow"
                    label={`+${evalData.symptoms.length - 5}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Duration & Onset */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {evalData.duration && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body2">{evalData.duration}</Typography>
              </Box>
            )}
            {evalData.onset && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Onset
                </Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {evalData.onset}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Pain Map Regions */}
          {painMap?.bodyParts && painMap.bodyParts.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Pain Regions
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {painMap.bodyParts.map((part) => (
                  <Box
                    key={`pain-${part.region}-${part.type || 'default'}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0.75,
                      bgcolor: alpha(
                        part.intensity > 6
                          ? auraColors.red.main
                          : part.intensity > 3
                            ? auraColors.orange.main
                            : auraColors.green.main,
                        0.1
                      ),
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption">{part.region}</Typography>
                    <Chip
                      label={`${part.intensity}/10`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor:
                          part.intensity > 6
                            ? alpha(auraColors.red.main, 0.2)
                            : part.intensity > 3
                              ? alpha(auraColors.orange.main, 0.2)
                              : alpha(auraColors.green.main, 0.2),
                        color:
                          part.intensity > 6
                            ? auraColors.red.main
                            : part.intensity > 3
                              ? auraColors.orange.main
                              : auraColors.green.main,
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Aggravating / Relieving Factors */}
          {(evalData.triggers?.length || evalData.relievingFactors?.length) && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {evalData.triggers && evalData.triggers.length > 0 && (
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Aggravating
                  </Typography>
                  <Typography variant="caption" display="block">
                    {evalData.triggers.slice(0, 3).join(', ')}
                  </Typography>
                </Box>
              )}
              {evalData.relievingFactors && evalData.relievingFactors.length > 0 && (
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Relieving
                  </Typography>
                  <Typography variant="caption" display="block">
                    {evalData.relievingFactors.slice(0, 3).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Treatment Goals */}
          {questionnaireResponses?.goals && questionnaireResponses.goals.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Treatment Goals
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {questionnaireResponses.goals.slice(0, 3).map((goal) => (
                  <Chip
                    key={`goal-${goal}`}
                    label={goal}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}
