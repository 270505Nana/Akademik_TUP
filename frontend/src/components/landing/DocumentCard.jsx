const DocumentCard = ({ title, description, link = "#", icon, accent = "red", linkLabel = "Lihat Panduan (PDF)" }) => {
  const href = link || "#";
  const isPlaceholder = href === "#";

  return (
    <article className="lp-doc-card">
      <div className={`lp-doc-icon lp-doc-icon--${accent}`}>{icon}</div>
      <div className="lp-doc-body">
        <h3 className="lp-doc-title">{title}</h3>
        <p className="lp-doc-desc">{description}</p>
        <a
          className="lp-doc-link"
          href={href}
          {...(isPlaceholder
            ? { onClick: (e) => e.preventDefault(), "aria-disabled": true }
            : { target: "_blank", rel: "noopener noreferrer" })}
        >
          {linkLabel}
        </a>
      </div>
    </article>
  );
};

export default DocumentCard;
