import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import PickListPage from '@/pages/pick-list-page';
import LibraryPage from '@/pages/library-page';
import ZoneDetailPage from '@/pages/zone-detail-page';
import RackDetailPage from '@/pages/rack-detail-page';
import ShelfDetailPage from '@/pages/shelf-detail-page';
import ScanPage from '@/pages/scan-page';
import LogsPage from '@/pages/logs-page';
import ReportsPage from '@/pages/reports-page';
import QrManagerPage from '@/pages/qr-manager-page';
import ContainerDetailPage from '@/pages/container-detail-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/pick-list" replace /> },
      { path: 'pick-list', element: <PickListPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'library/zones/:zoneId', element: <ZoneDetailPage /> },
      { path: 'library/racks/:rackId', element: <RackDetailPage /> },
      { path: 'library/shelves/:shelfId', element: <ShelfDetailPage /> },
      { path: 'scan', element: <ScanPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'qr-manager', element: <QrManagerPage /> },
      { path: 'containers/:qr', element: <ContainerDetailPage /> },
      { path: 'c/:qr', element: <ContainerDetailPage /> },
      {
        path: '*',
        element: (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-500">The page you're looking for doesn't exist.</p>
          </div>
        ),
      },
    ],
  },
]);
