import { createFileRoute } from "@tanstack/react-router";
import { ApplicantScreeningPage } from "@hr/presentation/ApplicantScreeningPage";

export const Route = createFileRoute("/screening/$applicantId")({ component: Page });

// Ruta PÚBLICA (sin auth): portal de screening del candidato (documentos + exámenes).
function Page() {
  const { applicantId } = Route.useParams();
  return <ApplicantScreeningPage applicantId={applicantId} />;
}
