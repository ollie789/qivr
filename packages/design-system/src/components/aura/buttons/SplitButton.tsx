import { Button, ButtonGroup, Menu, MenuItem, ButtonProps } from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';
import { useState, useRef, ReactNode } from 'react';

export interface SplitButtonOption {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface SplitButtonProps extends Omit<ButtonProps, 'onClick'> {
  options: SplitButtonOption[];
  mainLabel?: ReactNode;
}

export const SplitButton = ({ options, mainLabel, variant = 'contained', color, size, ...props }: SplitButtonProps) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleMainClick = () => options[0]?.onClick();

  return (
    <>
      <ButtonGroup variant={variant} color={color} size={size} ref={anchorRef}>
        <Button onClick={handleMainClick} {...props}>{mainLabel || options[0]?.label}</Button>
        <Button onClick={() => setOpen(!open)}>
          <ArrowDropDown />
        </Button>
      </ButtonGroup>
      <Menu anchorEl={anchorRef.current} open={open} onClose={() => setOpen(false)}>
        {options.slice(1).map((opt, i) => (
          <MenuItem key={i} onClick={() => { opt.onClick(); setOpen(false); }} disabled={opt.disabled}>
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
