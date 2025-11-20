import { icons as entypoSocialIcons } from "@iconify-json/entypo-social";
import { icons as evaIcons } from "@iconify-json/eva";
import { icons as fa6Brands } from "@iconify-json/fa6-brands";
import { icons as flagIcons } from "@iconify-json/flag";
import { icons as icIcons } from "@iconify-json/ic";
import { icons as materialIcons } from "@iconify-json/material-symbols";
import { icons as materialLightIcons } from "@iconify-json/material-symbols-light";
import { icons as mdiIcons } from "@iconify-json/mdi";
import { icons as mdiLightIcons } from "@iconify-json/mdi-light";
import { icons as riIcons } from "@iconify-json/ri";
import { icons as twemojiIcons } from "@iconify-json/twemoji";
import { Icon, IconifyJSON, IconProps } from "@iconify/react";
import { getIconData } from "@iconify/utils";
import { Box, BoxProps } from "@mui/material";

interface IconifyProps extends IconProps {
  sx?: BoxProps["sx"];
  flipOnRTL?: boolean;
  icon: string;
}

const iconSets: Record<string, IconifyJSON> = {
  "material-symbols": materialIcons,
  "material-symbols-light": materialLightIcons,
  twemoji: twemojiIcons,
  eva: evaIcons,
  ri: riIcons,
  ic: icIcons,
  flag: flagIcons,
  "fa6-brands": fa6Brands,
  "entypo-social": entypoSocialIcons,
  mdi: mdiIcons,
  "mdi-light": mdiLightIcons,
};

const iconData = (icon: string) => {
  const [prefix, name] = icon.includes(":") ? icon.split(":") : ["", icon];

  if (prefix && iconSets[prefix]) {
    const data = getIconData(iconSets[prefix], name);
    if (data) return data;
  }

  for (const [_, icons] of Object.entries(iconSets)) {
    const data = getIconData(icons, name);
    if (data) return data;
  }
};

const IconifyIcon = ({
  icon,
  flipOnRTL = false,
  sx,
  ...rest
}: IconifyProps) => {
  return (
    <Box
      component={icon ? Icon : "span"}
      {...(icon ? { icon: iconData(icon), ssr: true } : ({} as any))}
      className='iconify'
      sx={[
        flipOnRTL && {
          transform: (theme) =>
            theme.direction === "rtl" ? "scaleX(-1)" : "none",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
};

export default IconifyIcon;
