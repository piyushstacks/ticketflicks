import React, { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Film,
  Hash,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ChevronDown,
  Zap,
  Filter,
  X,
  Info,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

/* ─── Constants ─────────────────────────────────────────────────────────── */
const REPORT_MODULES = [
  { id: "bookings", label: "Bookings",  desc: "Reservation breakdown and funnel metrics",        color: "from-orange-500/20 to-orange-900/20", border: "border-orange-500/40", icon: "🎟️" },
  { id: "payments", label: "Payments",  desc: "Revenue, success rates and transaction analysis", color: "from-green-500/20 to-green-900/20",  border: "border-green-500/40",  icon: "💳" },
  { id: "movies",   label: "Movies",    desc: "Catalogue analytics and rating distribution",     color: "from-purple-500/20 to-purple-900/20", border: "border-purple-500/40", icon: "🎬" },
  { id: "shows",    label: "Shows",     desc: "Scheduling insights and time-slot analysis",      color: "from-blue-500/20 to-blue-900/20",   border: "border-blue-500/40",   icon: "📅" },
  { id: "theatres", label: "Theatres",  desc: "Partner network and geographic data",             color: "from-pink-500/20 to-pink-900/20",   border: "border-pink-500/40",   icon: "🏛️" },
  { id: "users",    label: "Users",     desc: "Customer acquisition and role distribution",      color: "from-indigo-500/20 to-indigo-900/20", border: "border-indigo-500/40", icon: "👥" },
];

const SORT_BY_OPTIONS = [
  { value: "date",    label: "Date",         icon: Calendar   },
  { value: "revenue", label: "Revenue",      icon: TrendingUp },
  { value: "tickets", label: "Tickets Sold", icon: Hash       },
];

const PRESET_RANGES = [
  { label: "Last 7 Days",   days: 7  },
  { label: "Last 30 Days",  days: 30 },
  { label: "Last 90 Days",  days: 90 },
  { label: "Last 6 Months", days: 180 },
  { label: "Last Year",     days: 365 },
];

/* ─── Helper ─────────────────────────────────────────────────────────────── */
const toDateStr = (d) => d.toISOString().split("T")[0];
const today = () => toDateStr(new Date());
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const AdminReports = () => {
  const { axios, getAuthHeaders } = useAppContext();

  /* ── Selection state ── */
  const [selectedModules, setSelectedModules] = useState(REPORT_MODULES.map((m) => m.id));

  /* ── Filter state ── */
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [sortBy,      setSortBy]      = useState("date");
  const [sortOrder,   setSortOrder]   = useState("desc");
  const [topN,        setTopN]        = useState("0");
  const [movieFilter, setMovieFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  /* ── Download state ── */
  const [downloading, setDownloading] = useState(false);

  /* ── Summary of active filters ── */
  const activeFilters = [
    startDate && `From ${startDate}`,
    endDate   && `To ${endDate}`,
    sortBy !== "date" && `Sort: ${SORT_BY_OPTIONS.find((o) => o.value === sortBy)?.label}`,
    `Order: ${sortOrder === "desc" ? "Highest first" : "Lowest first"}`,
    topN && topN !== "0" && `Top ${topN}`,
    movieFilter && `Movie: "${movieFilter}"`,
  ].filter(Boolean);

  /* ── Module toggle ── */
  const toggleModule = (id) =>
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  /* ── Apply preset range ── */
  const applyPreset = (days) => {
    setStartDate(daysAgo(days));
    setEndDate(today());
  };

  /* ── Clear filters ── */
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSortBy("date");
    setSortOrder("desc");
    setTopN("0");
    setMovieFilter("");
  };

  /* ── Download handler ── */
  const handleDownload = async () => {
    if (selectedModules.length === 0) {
      toast.error("Please select at least one report module.");
      return;
    }

    setDownloading(true);
    const isZip = selectedModules.length > 1;
    const toastId = toast.loading(
      isZip ? "Generating ZIP archive — this may take a minute…" : "Generating PDF report…"
    );

    try {
      const params = new URLSearchParams({
        types:       selectedModules.join(","),
        startDate,
        endDate,
        sortBy,
        sortOrder,
        movieFilter,
      });
      if (topN && topN !== "0") params.set("topN", topN);

      const response = await axios.get(
        `/api/admin/analytics/download-targeted?${params.toString()}`,
        { headers: getAuthHeaders(), responseType: "blob", timeout: 300000 }
      );

      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || "Report generation failed");
      }

      if (!response.data || response.data.size === 0) {
        throw new Error("Empty report received from server");
      }

      const blobType = isZip ? "application/zip" : "application/pdf";
      const dateStr  = new Date().toISOString().split("T")[0];
      const fileName = isZip
        ? `ticketflicks_reports_${dateStr}.zip`
        : `ticketflicks_${selectedModules[0]}_report_${dateStr}.pdf`;

      const url  = window.URL.createObjectURL(new Blob([response.data], { type: blobType }));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("Report downloaded successfully!");
    } catch (err) {
      toast.dismiss(toastId);
      const msg =
        err.code === "ECONNABORTED"
          ? "Request timed out — the report is very large. Please try again."
          : err.message || "Failed to download report.";
      toast.error(msg, { duration: 6000 });
    } finally {
      setDownloading(false);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
              <BarChart3 className="w-6 h-6 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold">Advanced Reports</h1>
          </div>
          <p className="text-[var(--text-muted)] ml-[52px]">
            Generate targeted PDF/ZIP reports with advanced filters — by time period, ranking, and more.
          </p>
        </div>

        {/* Active filter pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center mt-2">
            {activeFilters.map((f, i) => (
              <span
                key={i}
                className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full font-medium"
              >
                {f}
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-[var(--text-muted)] hover:text-red-400 flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* LEFT: Filters panel */}
        <div className="xl:col-span-2 space-y-5">

          {/* Filter header */}
          <div
            className="flex items-center justify-between bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 cursor-pointer hover:border-[var(--border-hover)] transition"
            onClick={() => setShowFilters((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-red-500" />
              <span className="font-semibold">Report Filters</span>
              {activeFilters.length > 0 && (
                <span className="text-[10px] bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">
                  {activeFilters.length} active
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </div>

          {showFilters && (
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-5 space-y-6">

              {/* ── Date Range ── */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Time Period
                </label>

                {/* Presets */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_RANGES.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p.days)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-red-500/50 hover:bg-red-500/5 text-[var(--text-muted)] hover:text-red-400 transition"
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-gray-500/50 text-[var(--text-muted)] transition"
                  >
                    All Time
                  </button>
                </div>

                {/* Custom range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] mb-1 block">Start Date</span>
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || today()}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500/50 transition"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] mb-1 block">End Date</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      max={today()}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500/50 transition"
                    />
                  </div>
                </div>
              </div>

              {/* ── Sort / Ranking ── */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Sort & Ranking
                </label>

                {/* Sort By */}
                <div className="mb-3">
                  <span className="text-[11px] text-[var(--text-muted)] mb-2 block">Sort By</span>
                  <div className="grid grid-cols-3 gap-2">
                    {SORT_BY_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSortBy(value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition ${
                          sortBy === value
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : "border-[var(--border)] text-[var(--text-muted)] hover:border-gray-500/60"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Order */}
                <div className="mb-3">
                  <span className="text-[11px] text-[var(--text-muted)] mb-2 block">Sort Order</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "desc", label: "Highest First", icon: TrendingDown },
                      { value: "asc",  label: "Lowest First",  icon: TrendingUp  },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSortOrder(value)}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                          sortOrder === value
                            ? "border-red-500 bg-red-500/10 text-red-400"
                            : "border-[var(--border)] text-[var(--text-muted)] hover:border-gray-500/60"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top N */}
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] mb-2 block">
                    Top / Bottom N Records{" "}
                    <span className="text-[10px] opacity-60">(0 = all)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={topN}
                      onChange={(e) => setTopN(e.target.value)}
                      placeholder="0 = all records"
                      className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500/50 transition"
                    />
                    <div className="flex gap-1">
                      {[10, 25, 50, 100].map((n) => (
                        <button
                          key={n}
                          onClick={() => setTopN(String(n))}
                          className={`text-xs px-2.5 py-2 rounded-lg border transition font-medium ${
                            topN === String(n)
                              ? "border-red-500 bg-red-500/10 text-red-400"
                              : "border-[var(--border)] text-[var(--text-muted)] hover:border-gray-500/60"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Movie Filter ── */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Film className="w-3.5 h-3.5" /> Movie Filter
                </label>
                <div className="relative">
                  <Film className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={movieFilter}
                    onChange={(e) => setMovieFilter(e.target.value)}
                    placeholder="e.g. Avengers, Pathaan…"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-red-500/50 transition"
                  />
                  {movieFilter && (
                    <button
                      onClick={() => setMovieFilter("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-red-400 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  Active for Bookings &amp; Payments reports. Other modules use all data.
                </p>
              </div>

              {/* ── Reset ── */}
              <button
                onClick={clearFilters}
                className="w-full text-sm text-[var(--text-muted)] hover:text-red-400 flex items-center justify-center gap-2 py-2 border border-dashed border-[var(--border)] rounded-xl hover:border-red-500/40 transition"
              >
                <Filter className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Module selector + download */}
        <div className="xl:col-span-3 space-y-5">

          {/* Module Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Select Report Modules
            </h2>
            <button
              onClick={() =>
                setSelectedModules(
                  selectedModules.length === REPORT_MODULES.length
                    ? []
                    : REPORT_MODULES.map((m) => m.id)
                )
              }
              className="text-sm font-medium text-red-500 hover:text-red-400 transition underline underline-offset-2"
            >
              {selectedModules.length === REPORT_MODULES.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REPORT_MODULES.map((mod) => {
              const checked = selectedModules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`text-left p-4 rounded-xl border transition-all group relative overflow-hidden ${
                    checked
                      ? `bg-gradient-to-br ${mod.color} ${mod.border} shadow-sm`
                      : "border-[var(--border)] bg-[var(--bg-elevated)]/30 hover:border-gray-500/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mod.icon}</span>
                      <div>
                        <p className={`font-semibold text-sm ${checked ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
                          {mod.label}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{mod.desc}</p>
                      </div>
                    </div>
                    <div className={`shrink-0 mt-0.5 ${checked ? "text-red-500" : "text-[var(--text-muted)]/40"}`}>
                      {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary card */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Report Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: "Modules",    value: `${selectedModules.length} / ${REPORT_MODULES.length}` },
                { label: "Output",     value: selectedModules.length > 1 ? "ZIP Archive" : "Single PDF" },
                { label: "Time Range", value: startDate && endDate ? `${startDate} → ${endDate}` : "All time" },
                { label: "Sort By",    value: SORT_BY_OPTIONS.find((o) => o.value === sortBy)?.label || "—" },
                { label: "Order",      value: sortOrder === "desc" ? "↓ Highest first" : "↑ Lowest first" },
                { label: "Top N",      value: topN && topN !== "0" ? topN : "All records" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2">
                  <p className="text-[10px] text-[var(--text-muted)] mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Download CTA */}
            <button
              id="download-report-btn"
              onClick={handleDownload}
              disabled={downloading || selectedModules.length === 0}
              className="w-full flex items-center justify-center gap-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl transition-all font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {downloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    Generating {selectedModules.length > 1 ? "ZIP" : "PDF"}…
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>
                    Download Report
                    {selectedModules.length > 0 && (
                      <span className="ml-1.5 font-normal opacity-80">
                        ({selectedModules.length} module{selectedModules.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  <Zap className="w-4 h-4 opacity-70" />
                </>
              )}
            </button>

            <p className="text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-1.5 mt-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              Reports generated live from the current database.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminReports;
