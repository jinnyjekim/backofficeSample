import { ModulePlaceholderPage } from '../common/ModulePlaceholderPage';

interface Props {
  title: string;
  subtitle: string;
}

export function ShippingPolicyPlaceholderPage({ title, subtitle }: Props) {
  return <ModulePlaceholderPage title={title} subtitle={subtitle} icon="◧" />;
}
