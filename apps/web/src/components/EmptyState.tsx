import Link from "next/link";

// Mensaje centrado para "no hay nada", "tenés que ingresar", etc.
export function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {href && action && <Link href={href} className="btn btn-primary mt-3">{action}</Link>}
    </div>
  );
}
