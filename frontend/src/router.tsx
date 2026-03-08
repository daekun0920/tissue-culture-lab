import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import Dashboard from '@/pages/dashboard';
import ContainersPage from '@/pages/containers-page';
import ContainerDetailPage from '@/pages/container-detail-page';
import ContainerTypesPage from '@/pages/container-types-page';
import ScannerPage from '@/pages/scanner-page';
import MediaRecipesPage from '@/pages/media-recipes-page';
import MediaBatchesPage from '@/pages/media-batches-page';
import CultureTypesPage from '@/pages/culture-types-page';
import EmployeesPage from '@/pages/employees-page';
import QrGeneratorPage from '@/pages/qr-generator-page';
import ReportsPage from '@/pages/reports-page';
import ExperimentsPage from '@/pages/experiments-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'containers', element: <ContainersPage /> },
      { path: 'containers/:qr', element: <ContainerDetailPage /> },
      { path: 'operations', element: <ScannerPage /> },
      { path: 'container-types', element: <ContainerTypesPage /> },
      { path: 'media-recipes', element: <MediaRecipesPage /> },
      { path: 'media-batches', element: <MediaBatchesPage /> },
      { path: 'culture-types', element: <CultureTypesPage /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'qr-generator', element: <QrGeneratorPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'experiments', element: <ExperimentsPage /> },
      { path: 'experiments/:id', element: <ExperimentsPage /> },
      { path: 'c/:qr', element: <ContainerDetailPage /> },
    ],
  },
]);
