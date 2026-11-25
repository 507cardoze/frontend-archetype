import { useHealth } from '@/api/health';
import { Alert } from '@/components/atoms/alert';
import { QueryState } from '@/components/organisms/query-state';
import { PageLayout } from '@/components/templates/page-layout';

// Starting point: proves the app reaches the BFF. Replace it with the project's first page.
const HomePage = () => (
  <PageLayout title="Inicio">
    <QueryState query={useHealth()}>
      {() => (
        <Alert role="status" tone="success">
          La aplicación está conectada al BFF.
        </Alert>
      )}
    </QueryState>
  </PageLayout>
);

export default HomePage;
