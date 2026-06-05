const KbsLoader = ({ label = "Chargement..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="relative grid h-28 w-28 place-items-center">
        <span className="absolute inset-0 rounded-full border-4 border-secondary/20" />
        <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-secondary border-r-secondary animate-spin" />
        <img
          src="/kbs-logo.png"
          alt="KBS Building"
          className="h-20 w-20 rounded-full object-contain p-1 shadow-card"
        />
      </div>
      <p className="text-label-md font-semibold text-on-surface-variant">{label}</p>
    </div>
  );
};

export default KbsLoader;
