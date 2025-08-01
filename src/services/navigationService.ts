import { NavigationItem } from '../types';

export class NavigationService {
  async getNavigationItems(): Promise<NavigationItem[]> {
    return [
      {
        id: 'analytics',
        name: 'Analytics',
        icon: 'bar-chart',
        path: '/analytics'
      },
      {
        id: 'business',
        name: 'Business',
        icon: 'briefcase',
        path: '/business'
      },
      {
        id: 'project',
        name: 'Project',
        icon: 'clipboard',
        path: '/project'
      },
      {
        id: 'hrm',
        name: 'HRM',
        icon: 'users',
        path: '/hrm'
      },
      {
        id: 'mobile-app',
        name: 'Mobile App',
        icon: 'smartphone',
        path: '/mobile-app'
      },
      {
        id: 'landingpage',
        name: 'Landingpage',
        icon: 'rocket',
        path: '/landingpage'
      },
      {
        id: 'components',
        name: 'Components',
        icon: 'puzzle',
        isExpanded: false,
        children: []
      },
      {
        id: 'pages',
        name: 'Pages',
        icon: 'file-text',
        isExpanded: false,
        children: []
      },
      {
        id: 'apps',
        name: 'Apps',
        icon: 'grid',
        isExpanded: true,
        children: [
          {
            id: 'calendar',
            name: 'Calendar',
            icon: 'calendar',
            path: '/apps/calendar'
          },
          {
            id: 'email',
            name: 'Email',
            icon: 'mail',
            path: '/apps/email'
          },
          {
            id: 'invoice',
            name: 'Invoice',
            icon: 'receipt',
            path: '/apps/invoice'
          },
          {
            id: 'charts',
            name: 'Charts',
            icon: 'trending-up',
            path: '/apps/charts'
          },
          {
            id: 'widgets',
            name: 'Widgets',
            icon: 'box',
            path: '/apps/widgets'
          }
        ]
      },
      {
        id: 'content',
        name: 'Content',
        icon: 'file-text',
        isExpanded: false,
        children: []
      },
      {
        id: 'users',
        name: 'Users',
        icon: 'user',
        isExpanded: false,
        children: []
      },
      {
        id: 'documentation',
        name: 'Documentation',
        icon: 'book',
        isExpanded: false,
        children: []
      }
    ];
  }

  async getUpgradeInfo(): Promise<{
    title: string;
    description: string;
    buttonText: string;
    buttonIcon: string;
  }> {
    return {
      title: 'Upgrade to Pro',
      description: 'Are you looking for more features? Check out our Pro version.',
      buttonText: 'Upgrade Now',
      buttonIcon: 'arrow-right'
    };
  }
} 