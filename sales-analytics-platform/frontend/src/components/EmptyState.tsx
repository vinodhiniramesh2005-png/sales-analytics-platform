import Link from "next/link";
import { UploadCloud } from "lucide-react";

export default function EmptyState({
  title = "No dataset yet",
  description = "Upload a spreadsheet to unlock this view.",
  actionLabel = "Upload a file",
  actionHref = "/upload",
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
        <UploadCloud size={26} />
      </div>
      <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted dark:text-muted-dark max-w-sm mb-5">{description}</p>
      <Link href={actionHref} className="btn-primary text-sm">
        {actionLabel}
      </Link>
    </div>
  );
}
