export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard',
        icon: 'dashboard',
        breadcrumbs: false
      }
    ]
  },

  {
    id: 'utilities',
    title: 'UI Components',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'scripts-spaces', 
        title: 'Scripts space',
        type: 'item',
        classes: 'nav-item',
        url: '/scripts-spaces',
        icon: 'font-size'
      },
      {
        id: 'color',
        title: 'Execution History',
        type: 'item',
        classes: 'nav-item',
        url: '/execution-history',
        icon: 'bg-colors'
      },
      {
        id: 'tabler',
        title: 'Scripts',
        type: 'item',
        classes: 'nav-item',
        url: '/scripts',
        icon: 'ant-design',
       
      }
    ]
  },

  {
    id: 'other',
    title: 'Other',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      
    
    ]
  }
];
