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
        id: 'tabler',
        title: 'Scripts',
        type: 'item',
        classes: 'nav-item',
        url: '/scripts',
        icon: 'ant-design',
       
      },
      {
        id: 'tabler',
        title: 'upload script',
        type: 'item',
        classes: 'nav-item',
        url: '/upload-script',
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
        title: 'Logs',
        type: 'item',
        classes: 'nav-item',
        url: '/logs',
        icon: 'ant-design',
       
      },
      {
        id: 'tabler',
        title: 'Security Manager',
        type: 'item',
        classes: 'nav-item',
        url: '/security',
        icon: 'ant-design',
       
      }

      
    
    ]
  }
];
