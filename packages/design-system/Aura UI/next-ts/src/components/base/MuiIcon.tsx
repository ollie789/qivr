import { SvgIconOwnProps } from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';

interface MuiIconProps extends SvgIconOwnProps {
  icon: typeof SvgIcon;
}

const MuiIcon = ({ icon: Icon, ...rest }: MuiIconProps) => {
  return <Icon {...rest} />;
};

export default MuiIcon;
