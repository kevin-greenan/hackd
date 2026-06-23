import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getDownloadableAttachment } from "@/lib/core/challenge-attachments";

function dispositionFileName(fileName: string) {
  return fileName.replaceAll("\"", "");
}

export async function GET(
  _request: Request,
  {
    params
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const user = await requireUser();
  const { id } = await params;
  const attachment = await getDownloadableAttachment({
    attachmentId: id,
    userId: user.id,
    role: user.role
  });

  if (!attachment) {
    notFound();
  }

  return new Response(attachment.bytes, {
    headers: {
      "Content-Disposition": `attachment; filename="${dispositionFileName(attachment.originalName)}"`,
      "Content-Length": String(attachment.sizeBytes),
      "Content-Type": attachment.mimeType,
      "X-Content-Type-Options": "nosniff"
    }
  });
}
