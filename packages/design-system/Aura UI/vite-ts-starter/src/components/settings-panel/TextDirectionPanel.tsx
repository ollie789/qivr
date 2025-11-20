import { ChangeEvent } from 'react';
import { FormControlLabel, Radio } from '@mui/material';
import { TextDirection } from 'config';
import { useSettingsContext } from 'providers/SettingsProvider';
import SettingsItem from './SettingsItem';
import SettingsPanelRadioGroup from './SettingsPanelRadioGroup';

const TextDirectionPanel = () => {
  const {
    config: { textDirection, assetsDir },
    setConfig,
  } = useSettingsContext();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfig({
      textDirection: (event.target as HTMLInputElement).value as TextDirection,
    });
  };

  return (
    <SettingsPanelRadioGroup name="text-direction" value={textDirection} onChange={handleChange}>
      <FormControlLabel
        value="ltr"
        control={<Radio />}
        label={
          <SettingsItem
            label="LTR"
            image={{
              light: `${assetsDir}/images/settings-panel/ltr.webp`,
              dark: `${assetsDir}/images/settings-panel/ltr-dark.webp`,
            }}
            active={textDirection === 'ltr'}
          />
        }
      />
      <FormControlLabel
        value="rtl"
        control={<Radio />}
        label={
          <SettingsItem
            label="RTL"
            image={{
              light: `${assetsDir}/images/settings-panel/rtl.webp`,
              dark: `${assetsDir}/images/settings-panel/rtl-dark.webp`,
            }}
            active={textDirection === 'rtl'}
          />
        }
      />
    </SettingsPanelRadioGroup>
  );
};

export default TextDirectionPanel;
