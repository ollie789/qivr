/**
 * IntakeReviewSection Component
 * Displays a summary of intake form data for review before submission
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import { auraTokens } from '../../theme/auraTokens';
import { glassEffect } from '../../theme/auraTokens';
import type { PainRegion } from '../../types/pain-drawing';

export interface ReviewItemProps {
  /** Label for the review item */
  label: string;
  /** Value to display - can be string, array of strings, or number */
  value: string | string[] | number | undefined;
  /** Whether to show as chips (for arrays) */
  showAsChips?: boolean;
  /** Color for chips */
  chipColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

/**
 * Single review item with label and value
 */
export const ReviewItem: React.FC<ReviewItemProps> = ({
  label,
  value,
  showAsChips = false,
  chipColor = 'default',
}) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: auraTokens.fontWeights.semibold,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Typography>

      {Array.isArray(value) ? (
        showAsChips ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
            {value.map((item, idx) => (
              <Chip
                key={idx}
                label={item}
                size="small"
                color={chipColor}
                variant="outlined"
                sx={{ borderRadius: auraTokens.borderRadius.sm }}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ mt: 0.25 }}>
            {value.join(', ')}
          </Typography>
        )
      ) : (
        <Typography variant="body2" sx={{ mt: 0.25 }}>
          {value}
        </Typography>
      )}
    </Box>
  );
};

export interface PainSummaryProps {
  /** Pain regions from 3D body map */
  painRegions: PainRegion[];
  /** Pain intensity (0-10) */
  painIntensity?: number;
  /** Pain duration selection */
  painDuration?: string;
  /** Pain qualities (aching, burning, etc.) */
  painQualities?: string[];
}

/**
 * Displays pain mapping summary
 */
export const PainSummary: React.FC<PainSummaryProps> = ({
  painRegions,
  painIntensity,
  painDuration,
  painQualities,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: auraTokens.borderRadius.md,
        ...glassEffect.subtle,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: auraTokens.fontWeights.semibold,
          mb: 2,
          color: 'primary.main',
        }}
      >
        Pain Information
      </Typography>

      <ReviewItem label="Pain Areas" value={`${painRegions.length} regions marked`} />

      {painRegions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {painRegions.map((region, idx) => (
              <Chip
                key={idx}
                label={`${region.meshName} (${region.quality})`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ borderRadius: auraTokens.borderRadius.sm }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {painIntensity !== undefined && (
        <ReviewItem label="Intensity" value={`${painIntensity}/10`} />
      )}

      {painDuration && <ReviewItem label="Duration" value={painDuration} />}

      {painQualities && painQualities.length > 0 && (
        <ReviewItem label="Qualities" value={painQualities} showAsChips chipColor="info" />
      )}
    </Paper>
  );
};

export interface ConsentSectionProps {
  /** Whether treatment consent is checked */
  consentTreatment?: boolean;
  /** Whether privacy consent is checked */
  consentPrivacy?: boolean;
  /** Whether marketing consent is checked */
  consentMarketing?: boolean;
  /** Callback when consent changes */
  onConsentChange: (field: string, checked: boolean) => void;
  /** Validation errors */
  errors?: Record<string, string>;
  /** Whether to show marketing consent option */
  showMarketing?: boolean;
}

/**
 * Consent checkboxes section
 */
export const ConsentSection: React.FC<ConsentSectionProps> = ({
  consentTreatment = false,
  consentPrivacy = false,
  consentMarketing = false,
  onConsentChange,
  errors = {},
  showMarketing = false,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: auraTokens.borderRadius.md,
        border: '1px solid',
        borderColor: errors.consentTreatment || errors.consentPrivacy ? 'error.main' : 'divider',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: auraTokens.fontWeights.semibold,
          mb: 2,
        }}
      >
        Consent & Agreement
      </Typography>

      <Stack spacing={1}>
        <FormControlLabel
          control={
            <Checkbox
              checked={consentTreatment}
              onChange={(e) => onConsentChange('consentTreatment', e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              I consent to receiving evaluation and treatment recommendations
              <Typography component="span" color="error">
                {' '}
                *
              </Typography>
            </Typography>
          }
        />
        {errors.consentTreatment && (
          <Typography variant="caption" color="error" sx={{ ml: 4 }}>
            {errors.consentTreatment}
          </Typography>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={consentPrivacy}
              onChange={(e) => onConsentChange('consentPrivacy', e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2">
              I have read and agree to the Privacy Policy
              <Typography component="span" color="error">
                {' '}
                *
              </Typography>
            </Typography>
          }
        />
        {errors.consentPrivacy && (
          <Typography variant="caption" color="error" sx={{ ml: 4 }}>
            {errors.consentPrivacy}
          </Typography>
        )}

        {showMarketing && (
          <FormControlLabel
            control={
              <Checkbox
                checked={consentMarketing}
                onChange={(e) => onConsentChange('consentMarketing', e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                I would like to receive updates and health tips (optional)
              </Typography>
            }
          />
        )}
      </Stack>
    </Paper>
  );
};

export interface IntakeReviewSectionProps {
  /** Pain regions from 3D body map */
  painRegions: PainRegion[];
  /** Current form data */
  formData: {
    painIntensity?: number;
    painDuration?: string;
    painQualities?: string[];
    chiefComplaint?: string;
    painStart?: string;
    prevOrtho?: string[];
    currentTreatments?: string[];
    medications?: string[];
    mobilityAids?: string[];
    dailyImpact?: string[];
    additionalHistory?: string[];
    redFlags?: string[];
    goals?: string[];
    timeline?: string;
    milestones?: string[];
    concerns?: string[];
    additionalNotes?: string;
    consentTreatment?: boolean;
    consentPrivacy?: boolean;
    consentMarketing?: boolean;
    // Widget-specific fields
    fullName?: string;
    email?: string;
    phone?: string;
    ageRange?: string;
  };
  /** Callback when consent changes */
  onConsentChange: (field: string, checked: boolean) => void;
  /** Validation errors */
  errors?: Record<string, string>;
  /** Whether this is for the widget (show personal info) */
  isWidget?: boolean;
  /** Whether to show marketing consent option */
  showMarketing?: boolean;
}

/**
 * Complete review section for intake forms
 */
export const IntakeReviewSection: React.FC<IntakeReviewSectionProps> = ({
  painRegions,
  formData,
  onConsentChange,
  errors = {},
  isWidget = false,
  showMarketing = false,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: auraTokens.fontWeights.semibold,
          mb: 1,
        }}
      >
        Review Your Information
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Please review your information before submitting. You can go back to make changes if
        needed.
      </Typography>

      {/* Red Flags Alert */}
      {formData.redFlags && formData.redFlags.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Important Health Indicators
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {formData.redFlags.map((flag, idx) => (
              <Chip key={idx} label={flag} size="small" color="warning" />
            ))}
          </Stack>
        </Alert>
      )}

      {/* Personal Info (Widget only) */}
      {isWidget && (formData.fullName || formData.email) && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: auraTokens.borderRadius.md,
            ...glassEffect.subtle,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: auraTokens.fontWeights.semibold,
              mb: 2,
              color: 'primary.main',
            }}
          >
            Personal Information
          </Typography>
          {formData.fullName && <ReviewItem label="Name" value={formData.fullName} />}
          {formData.email && <ReviewItem label="Email" value={formData.email} />}
          {formData.phone && <ReviewItem label="Phone" value={formData.phone} />}
          {formData.ageRange && <ReviewItem label="Age Range" value={formData.ageRange} />}
        </Paper>
      )}

      {/* Pain Summary */}
      <PainSummary
        painRegions={painRegions}
        painIntensity={formData.painIntensity}
        painDuration={formData.painDuration}
        painQualities={formData.painQualities}
      />

      {/* Chief Complaint */}
      {formData.chiefComplaint && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: auraTokens.borderRadius.md,
            ...glassEffect.subtle,
          }}
        >
          <ReviewItem label="Main Concern" value={formData.chiefComplaint} />
        </Paper>
      )}

      {/* Medical History */}
      {(formData.painStart ||
        formData.prevOrtho?.length ||
        formData.currentTreatments?.length ||
        formData.medications?.length) && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: auraTokens.borderRadius.md,
            ...glassEffect.subtle,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: auraTokens.fontWeights.semibold,
              mb: 2,
              color: 'primary.main',
            }}
          >
            Medical History
          </Typography>
          {formData.painStart && <ReviewItem label="How Pain Started" value={formData.painStart} />}
          {formData.prevOrtho && formData.prevOrtho.length > 0 && (
            <ReviewItem
              label="Previous Conditions"
              value={formData.prevOrtho}
              showAsChips
              chipColor="default"
            />
          )}
          {formData.currentTreatments && formData.currentTreatments.length > 0 && (
            <ReviewItem
              label="Current Treatments"
              value={formData.currentTreatments}
              showAsChips
              chipColor="info"
            />
          )}
          {formData.medications && formData.medications.length > 0 && (
            <ReviewItem
              label="Medications"
              value={formData.medications}
              showAsChips
              chipColor="default"
            />
          )}
          {formData.mobilityAids && formData.mobilityAids.length > 0 && (
            <ReviewItem
              label="Mobility Aids"
              value={formData.mobilityAids}
              showAsChips
              chipColor="default"
            />
          )}
          {formData.dailyImpact && formData.dailyImpact.length > 0 && (
            <ReviewItem
              label="Daily Impact"
              value={formData.dailyImpact}
              showAsChips
              chipColor="warning"
            />
          )}
        </Paper>
      )}

      {/* Goals */}
      {(formData.goals?.length || formData.timeline || formData.milestones?.length) && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: auraTokens.borderRadius.md,
            ...glassEffect.subtle,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: auraTokens.fontWeights.semibold,
              mb: 2,
              color: 'primary.main',
            }}
          >
            Treatment Goals
          </Typography>
          {formData.goals && formData.goals.length > 0 && (
            <ReviewItem label="Goals" value={formData.goals} showAsChips chipColor="success" />
          )}
          {formData.timeline && <ReviewItem label="Expected Timeline" value={formData.timeline} />}
          {formData.milestones && formData.milestones.length > 0 && (
            <ReviewItem label="Milestones" value={formData.milestones} showAsChips chipColor="primary" />
          )}
          {formData.concerns && formData.concerns.length > 0 && (
            <ReviewItem label="Concerns" value={formData.concerns} showAsChips chipColor="warning" />
          )}
        </Paper>
      )}

      {/* Additional Notes */}
      {formData.additionalNotes && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: auraTokens.borderRadius.md,
            ...glassEffect.subtle,
          }}
        >
          <ReviewItem label="Additional Notes" value={formData.additionalNotes} />
        </Paper>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Consent Section */}
      <ConsentSection
        consentTreatment={formData.consentTreatment}
        consentPrivacy={formData.consentPrivacy}
        consentMarketing={formData.consentMarketing}
        onConsentChange={onConsentChange}
        errors={errors}
        showMarketing={showMarketing}
      />
    </Box>
  );
};
