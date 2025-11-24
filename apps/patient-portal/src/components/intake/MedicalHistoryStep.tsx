import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface MedicalHistoryStepProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export default function MedicalHistoryStep({
  formData,
  onChange,
}: MedicalHistoryStepProps) {
  const handleCheckboxChange = (field: string, value: string) => {
    const currentValues = formData[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v: string) => v !== value)
      : [...currentValues, value];
    onChange(field, newValues);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Medical History
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Help us understand your medical background and current condition
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>How did your pain/injury start?</InputLabel>
        <Select
          value={formData.painOnset}
          onChange={(e) => onChange("painOnset", e.target.value)}
        >
          <MenuItem value="Sudden injury or trauma">
            Sudden injury or trauma
          </MenuItem>
          <MenuItem value="Gradual onset over time">
            Gradual onset over time
          </MenuItem>
          <MenuItem value="After specific activity or sport">
            After specific activity or sport
          </MenuItem>
          <MenuItem value="Work-related incident">
            Work-related incident
          </MenuItem>
          <MenuItem value="Motor vehicle accident">
            Motor vehicle accident
          </MenuItem>
          <MenuItem value="Fall or slip">Fall or slip</MenuItem>
          <MenuItem value="Post-surgery complication">
            Post-surgery complication
          </MenuItem>
          <MenuItem value="Unknown">Unknown/Can't remember</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="subtitle2" gutterBottom>
        Previous orthopaedic conditions or surgeries
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {[
          "Fracture/Broken bone",
          "ACL/MCL injury",
          "Rotator cuff injury",
          "Hip replacement",
          "Knee replacement",
          "Spinal surgery",
          "Arthroscopy",
          "Tendon repair",
          "None",
        ].map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={(formData.previousOrthoConditions || []).includes(
                  item,
                )}
                onChange={() =>
                  handleCheckboxChange("previousOrthoConditions", item)
                }
              />
            }
            label={item}
          />
        ))}
      </FormGroup>

      <Typography variant="subtitle2" gutterBottom>
        Current treatments
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {[
          "Physical therapy",
          "Chiropractic care",
          "Massage therapy",
          "Acupuncture",
          "Injections (cortisone, etc.)",
          "Prescription medication",
          "Over-the-counter medication",
          "Heat/Ice therapy",
          "Bracing/Support devices",
          "None",
        ].map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={(formData.currentTreatments || []).includes(item)}
                onChange={() => handleCheckboxChange("currentTreatments", item)}
              />
            }
            label={item}
          />
        ))}
      </FormGroup>

      <Typography variant="subtitle2" gutterBottom>
        Current medications
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {[
          "Ibuprofen (Advil, Motrin)",
          "Acetaminophen (Tylenol)",
          "Naproxen (Aleve)",
          "Prescription pain medication",
          "Muscle relaxants",
          "Anti-inflammatory prescription",
          "Topical pain relief",
          "Supplements (glucosamine, etc.)",
          "None",
        ].map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={(formData.medications || []).includes(item)}
                onChange={() => handleCheckboxChange("medications", item)}
              />
            }
            label={item}
          />
        ))}
      </FormGroup>

      <Typography variant="subtitle2" gutterBottom>
        Daily activity impact
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {[
          "Walking/Standing",
          "Climbing stairs",
          "Sitting for long periods",
          "Sleeping/Lying down",
          "Dressing/Grooming",
          "Bathing/Showering",
          "Household chores",
          "Work duties",
          "Exercise/Recreation",
          "Driving",
          "Lifting/Carrying",
          "Minimal impact",
        ].map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={(formData.dailyImpact || []).includes(item)}
                onChange={() => handleCheckboxChange("dailyImpact", item)}
              />
            }
            label={item}
          />
        ))}
      </FormGroup>

      <Typography variant="subtitle2" gutterBottom>
        Additional medical history
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {[
          "Diabetes",
          "Heart disease",
          "High blood pressure",
          "Arthritis",
          "Osteoporosis",
          "Autoimmune condition",
          "Cancer (current/past)",
          "Blood clotting disorder",
          "Smoking (current/former)",
          "None",
        ].map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={(formData.additionalHistory || []).includes(item)}
                onChange={() => handleCheckboxChange("additionalHistory", item)}
              />
            }
            label={item}
          />
        ))}
      </FormGroup>

      <Typography variant="subtitle2" gutterBottom color="error">
        ⚠️ Red Flag Symptoms
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1, display: "block" }}
      >
        If experiencing any of these, seek immediate medical attention
      </Typography>
      <FormGroup>
        {[
          "Recent trauma or injury",
          "Loss of bowel/bladder control",
          "Fever or unexplained weight loss",
          "Severe night pain",
          "Pain getting progressively worse",
          "Numbness or tingling",
          "Muscle weakness",
        ].map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={(formData.redFlags || []).includes(item)}
                onChange={() => handleCheckboxChange("redFlags", item)}
              />
            }
            label={item}
          />
        ))}
      </FormGroup>
    </Box>
  );
}
