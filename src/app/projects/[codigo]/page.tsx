import { ProjectWorkspaceClient } from '@/components/workspace/ProjectWorkspaceClient';

interface ProjectWorkspacePageProps {
  params: Promise<{ codigo: string }>;
}

export default async function ProjectWorkspacePage({
  params,
}: ProjectWorkspacePageProps) {
  const { codigo } = await params;
  return <ProjectWorkspaceClient codigo={codigo} />;
}
