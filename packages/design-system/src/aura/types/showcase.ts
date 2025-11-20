export interface LayoutConfig {
  fieldname: 'layout' | 'topnavShape' | 'sidenavShape';
  title: string;
  options: {
    value: string;
    label: string;
  }[];
}

export interface PrefixedLayoutItem {
  title: string;
  link: string;
}

export interface WebApp {
  title: string;
  link: string;
}
