import logo from "@/assets/logo-inptic.jpg";

export const AppHeader = () => {
  return (
    <header className="bg-gradient-header text-primary-foreground shadow-elegant">
      <div className="container mx-auto px-4 py-5 flex items-center gap-4">
        <div className="bg-white rounded-full p-1.5 shadow-card-soft shrink-0">
          <img src={logo} alt="Logo INPTIC" className="h-14 w-14 rounded-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight">
            INPTIC Grade Manager
          </h1>
          <p className="text-sm opacity-90">
            Direction des Études et de la Pédagogie · Promotion <span className="font-semibold">LP ASUR 2025/2026</span>
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs opacity-80">Année universitaire</p>
          <p className="text-xl font-bold font-serif">2025 / 2026</p>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-success via-warning to-primary-light" />
    </header>
  );
};
