import { ReactNode, useState } from 'react';
import { TabContext, TabPanel } from '@mui/lab';
import { Box, FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import * as yup from 'yup';
import BackgroundOptions from './BackgroundOptions';

export type BackgroundOptionType = 'image' | 'color';

interface BackgroundOption {
  id: number;
  label: string;
  background: string;
  type: BackgroundOptionType;
}
export interface BackgroundOptionFormValues {
  backgroundOptions: {
    colors: BackgroundOption[];
    images: BackgroundOption[];
    selected: BackgroundOption | null;
  };
}

export const backgroundOptionFormSchema = yup.object({});

interface BackgroudProps {
  actionButton?: ReactNode;
}

const Background = ({ actionButton }: BackgroudProps) => {
  const [currentOptionType, setCurrentOptionType] = useState<BackgroundOptionType>('image');

  const handleOptionTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedType = event.target.value as BackgroundOptionType;
    setCurrentOptionType(selectedType);
  };

  return (
    <Box sx={{ mb: 5 }}>
      <TabContext value={currentOptionType}>
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <RadioGroup row value={currentOptionType} onChange={handleOptionTypeChange}>
            <FormControlLabel value="image" control={<Radio />} label="Images" />
            <FormControlLabel value="color" control={<Radio />} label="Colors" />
          </RadioGroup>
        </FormControl>

        <TabPanel value="image" sx={{ p: 0 }} keepMounted>
          <BackgroundOptions type="image" name="images" actionButton={actionButton} />
        </TabPanel>
        <TabPanel value="color" sx={{ p: 0 }} keepMounted>
          <BackgroundOptions type="color" name="colors" actionButton={actionButton} />
        </TabPanel>
      </TabContext>
    </Box>
  );
};

export default Background;
