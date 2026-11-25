import { TextLink } from '@/components/atoms/link';
import { PageLayout } from '@/components/templates/page-layout';

const NotFoundPage = () => (
  <PageLayout title="Página no encontrada">
    <TextLink to="/" trackId="not-found.home">
      Volver al inicio
    </TextLink>
  </PageLayout>
);

export default NotFoundPage;
