import './AdminMetricCard.css';

const AdminMetricCard = ({
  label,
  value,
  description,
  icon: Icon,
  tone = 'purple',
  active = false,
  onClick,
}) => {
  const Component = onClick ? 'button' : 'article';

  return (
    <Component
      className={`admin-metric-card admin-metric-card--${tone}${active ? ' admin-metric-card--active' : ''}`}
      type={onClick ? 'button' : undefined}
      aria-pressed={onClick ? active : undefined}
      onClick={onClick}
    >
      <span className="admin-metric-card__top">
        <span className="admin-metric-card__label">{label}</span>
        {Icon && (
          <span className="admin-metric-card__icon" aria-hidden="true">
            <Icon size={16} />
          </span>
        )}
      </span>
      <strong className="admin-metric-card__value">{value}</strong>
      <span className="admin-metric-card__description">{description}</span>
    </Component>
  );
};

export default AdminMetricCard;
