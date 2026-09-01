import { TemplateEditorPage } from "~/features/form-template-editor/components/template-editor-page";

type Props = {
  params: Promise<{ templateId: string }>;
};

export const metadata = {
  title: "Editor de Formulário | Care Copilot",
};

export default async function TemplateEditorRoute({ params }: Props) {
  const { templateId } = await params;
  return <TemplateEditorPage templateId={templateId} />;
}
