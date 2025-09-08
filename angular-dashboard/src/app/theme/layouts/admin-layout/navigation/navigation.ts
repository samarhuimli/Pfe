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
  roles?: string[]; // Add roles property to control visibility
}

// Function to get filtered navigation items based on user role
export function getNavigationItems(): NavigationItem[] {
  const userRole = localStorage.getItem('role') || '';
  
  return NavigationItems.filter(item => {
    // If item has roles defined, check if user role is included
    if (item.roles && item.roles.length > 0) {
      return item.roles.includes(userRole);
    }
    // If no roles defined, show to all users
    return true;
  }).map(item => {
    // Also filter children based on roles
    if (item.children) {
      const filteredChildren = item.children.filter(child => {
        if (child.roles && child.roles.length > 0) {
          return child.roles.includes(userRole);
        }
        return true;
      });
      
      // Only return the group if it has visible children
      if (filteredChildren.length > 0) {
        return { ...item, children: filteredChildren };
      }
      return null;
    }
    return item;
  }).filter(item => item !== null) as NavigationItem[];
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    translate: 'navigation.dashboard',
    type: 'group',
    icon: 'icon-navigation',
    roles: ['admin'], // Only admins can see dashboard
    children: [
      {
        id: 'default',
        title: 'Tableau de bord',
        translate: 'navigation.dashboardDefault',
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
    title: 'scripts',
    translate: 'navigation.uiComponents',
    type: 'group',
    icon: 'icon-navigation',
    roles: ['scientist'], // Only scientists can see scripts module
    children: [
      {
        id: 'scripts-spaces',
        title: 'Espace des scripts',
        translate: 'navigation.scriptsSpace',
        type: 'item',
        classes: 'nav-item',
        url: '/scripts-spaces',
        icon: 'font-size'
      },
      {
        id: 'tabler-scripts',
        title: 'Scripts',
        translate: 'navigation.scripts',
        type: 'item',
        classes: 'nav-item',
        url: '/scripts',
        icon: 'ant-design'
      },
      {
        id: 'tabler-upload',
        title: 'Téléverser un script',
        translate: 'navigation.uploadScript',
        type: 'item',
        classes: 'nav-item',
        url: '/upload-script',
        icon: 'ant-design'
      }
    ]
  },

  {
    id: 'other',
    title: 'Autres',
    translate: 'navigation.other',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'color',
        title: 'Historique d’exécution',
        translate: 'navigation.executionHistory',
        type: 'item',
        classes: 'nav-item',
        url: '/execution-history',
        icon: 'bg-colors',
        roles: ['admin', 'scientist'] // Both roles can see execution history
      },
 {
        id: 'user-management',
        title: 'Gestion des utulisateurs',
        translate: 'navigation.userManagement',
        type: 'item',
        classes: 'nav-item',
        url: '/user',
        icon: 'user',
        roles: ['admin'] // Only admins can see user management
      },
      {
        id: 'tabler-logs',
        title: 'Journaux',
        translate: 'navigation.logs',
        type: 'item',
        classes: 'nav-item',
        url: '/logs',
        icon: 'ant-design',
        roles: ['admin', 'scientist'] // Both roles can see logs
      },
      {
        id: 'tabler-security',
        title: 'Gestionnaire de sécurité',
        translate: 'navigation.securityManager',
        type: 'item',
        classes: 'nav-item',
        url: '/security',
        icon: 'ant-design',
        roles: ['admin', 'scientist'] // Both roles can see security manager
      }
    ]
  }
];
