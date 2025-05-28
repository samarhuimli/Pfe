import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { AdminComponent } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestComponent } from './theme/layouts/guest/guest.component';

const routes: Routes = [
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: '',
        redirectTo: '/scripts',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./authentication/login/login.component')
      },
      {
        path: 'register',
        loadComponent: () => import('./authentication/register/register.component')
      }
    ]
  },
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./sideBar/dashboard/dashboard.component').then((c) => c.DashboardComponent)
      },
      {
        path: 'scripts',
        loadComponent: () => import('./script/script/script.component').then((c) => c.ScriptComponent)
      },
      {
        path: 'scripts/create',
        loadComponent: () => import('./script/script-create/script-create.component').then(c => c.ScriptCreateComponent)
      },
      {
        path: 'scripts/view/:id',
        loadComponent: () => import('./script/script-view/script-view.component').then(c => c.ScriptViewComponent)
      },
      {
        path: 'execution-history',
        loadComponent: () => import('./execution-history/execution-history.component').then(c => c.ExecutionHistoryComponent)
      },
      {
        path: 'scripts/edit/:id',
        loadComponent: () => import('./script/script-edit/script-edit.component').then(c => c.ScriptEditComponent)
      },
      {
        path: 'scripts-spaces',
        loadComponent: () => import('./scripts-spaces/scripts-spaces.component').then((c) => c.ScriptsSpacesComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}