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
    title: 'Tableau de bord',
    translate: 'navigation.dashboard',
    type: 'group',
    icon: 'icon-navigation',
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
        icon: 'bg-colors'
      },
 {
        id: 'color',
        title: 'Gestion des utulisateurs',
        translate: 'navigation.executionHistory',
        type: 'item',
        classes: 'nav-item',
        url: '/user',
        icon: 'user'
      },
      {
        id: 'tabler-logs',
        title: 'Journaux',
        translate: 'navigation.logs',
        type: 'item',
        classes: 'nav-item',
        url: '/logs',
        icon: 'ant-design'
      },
      {
        id: 'tabler-security',
        title: 'Gestionnaire de sécurité',
        translate: 'navigation.securityManager',
        type: 'item',
        classes: 'nav-item',
        url: '/security',
        icon: 'ant-design'
      }
    ]
  }
];
