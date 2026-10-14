/* eslint-disable @next/next/no-img-element */
export default function TeamLogo({ name, logoUrl, size = 48 }: { name: string; logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} width={size} height={size} style={{ objectFit: 'contain', borderRadius: 8 }} />;
  }
  return (
    <div
      className="d-flex align-items-center justify-content-center fw-bold rounded flex-shrink-0"
      style={{ width: size, height: size, background: 'var(--lf-green-dark)', fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}