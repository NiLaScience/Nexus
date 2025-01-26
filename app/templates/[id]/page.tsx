import { EditTemplateClient } from './edit-template-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTemplatePage({
  params,
}: PageProps) {
  const { id } = await params;
  return <EditTemplateClient id={id} />;
} 