export default function Card({ title, subtitle, children, className = '' }) {
  return (
    <div className={`card ${className}`.trim()}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
