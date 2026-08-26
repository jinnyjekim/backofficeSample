import { ModulePlaceholderPage } from '../common/ModulePlaceholderPage';

interface Props {
  title: string;
  subtitle: string;
}

export function StatsPlaceholderPage({ title, subtitle }: Props) {
  return <ModulePlaceholderPage title={title} subtitle={subtitle} icon="▥" kind="analytics" />;
}
