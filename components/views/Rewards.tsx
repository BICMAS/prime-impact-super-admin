import React, { useEffect, useRef, useState } from "react";
import {
  Award,
  Coins,
  Edit3,
  Save,
  Printer,
  RefreshCw,
  Trophy,
  Loader2,
  ImagePlus,
} from "lucide-react";
import {
  assignCertificateTemplateToHr,
  createCertificateTemplate,
  type CertificateTheme,
} from "@/api/certificates";
import { getUsers } from "@/api/users";
import {
  getEconomyRules,
  updateEconomyRules,
  type LeaderboardEntry,
} from "@/api/economy";
import { printCertificatePreview } from "@/utils/printCertificatePreview";

const THEME_OPTIONS: Array<{
  id: CertificateTheme;
  label: string;
  description: string;
}> = [
  {
    id: "classic",
    label: "Classic",
    description: "Ornate borders, warm parchment tones, serif typography",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Clean layout with brand accent bar and bold sans-serif type",
  },
  {
    id: "tech",
    label: "Tech",
    description: "Structured header band, monospace accents, minimal geometry",
  },
];

const Rewards: React.FC = () => {
  const [activeTab, setActiveTab] =
    useState<"CERTIFICATE" | "COINS">("CERTIFICATE");

  /* =====================
     Certificate State
  ===================== */

  const [certConfig, setCertConfig] = useState<{
    theme: CertificateTheme;
    title: string;
    signatory: string;
    signatoryRole: string;
    showDate: boolean;
  }>({
    theme: "classic",
    title: "Certificate of Completion",
    signatory: "Dr. John Smith",
    signatoryRole: "Director of Education",
    showDate: true,
  });

  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  const [templateDescription, setTemplateDescription] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const [templateId, setTemplateId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [hrManagerId, setHrManagerId] = useState("");
  const [hrManagers, setHrManagers] = useState<
    Array<{ id: string; name: string; email: string; orgId?: string }>
  >([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const activeLogoUrl = logoPreviewUrl || savedLogoUrl;

  /* =====================
     Coins State (unchanged)
  ===================== */

  const [coinRules, setCoinRules] = useState({
    courseCompletion: 50,
    moduleCompletion: 10,
    perfectQuiz: 25,
    dailyStreak: 5,
    enableLeaderboard: true,
  });
  const [totalCirculating, setTotalCirculating] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [economyLoading, setEconomyLoading] = useState(false);
  const [economySaving, setEconomySaving] = useState(false);
  const [economyError, setEconomyError] = useState<string | null>(null);
  const [economySuccess, setEconomySuccess] = useState<string | null>(null);

  /* =====================
     Certificate Actions
  ===================== */

  useEffect(() => {
    const loadHrManagers = async () => {
      try {
        const users = await getUsers();

        const managers = users
          .filter((u: any) => u.userRole === "HR_MANAGER" || u.role === "HR_MANAGER")
          .map((u: any) => ({
            id: u.id,
            name: u.fullName || u.name || "Unknown",
            email: u.email || "",
            orgId: u.orgId || u.organizationId || u.organization?.id || "",
          }));
        setHrManagers(managers);
      } catch {
        setHrManagers([]);
      }
    };

    loadHrManagers();
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logoFile]);

  useEffect(() => {
    const loadEconomy = async () => {
      setEconomyLoading(true);
      setEconomyError(null);
      try {
        const data = await getEconomyRules();
        setCoinRules(data.rules);
        setTotalCirculating(data.totalCirculating);
        setLeaderboard(data.leaderboard);
      } catch (error) {
        setEconomyError(
          error instanceof Error ? error.message : "Failed to load economy rules",
        );
      } finally {
        setEconomyLoading(false);
      }
    };

    loadEconomy();
  }, []);

  const handleUpdateEconomy = async () => {
    setEconomySaving(true);
    setEconomyError(null);
    setEconomySuccess(null);

    try {
      const data = await updateEconomyRules(coinRules);
      setCoinRules(data.rules);
      setTotalCirculating(data.totalCirculating);
      setLeaderboard(data.leaderboard);
      setEconomySuccess("Economy rules updated successfully.");
    } catch (error) {
      setEconomyError(
        error instanceof Error ? error.message : "Failed to update economy rules",
      );
    } finally {
      setEconomySaving(false);
    }
  };

  const handleSaveCertificate = async () => {
    setCertLoading(true);
    setCertError(null);
    setAssignSuccess(null);

    try {
      if (!logoFile) {
        throw new Error("Please upload an organization logo first");
      }

      const json = await createCertificateTemplate(
        logoFile,
        certConfig,
        templateDescription || undefined,
      );
      setSavedLogoUrl(json.url);
      setTemplateId(json.id);
    } catch (err) {
      console.error(err);
      setCertError(
        err instanceof Error ? err.message : "Failed to generate certificate"
      );
    } finally {
      setCertLoading(false);
    }
  };

  const handleAssignTemplate = async () => {
    setAssignLoading(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      if (!templateId.trim()) {
        throw new Error("Template ID is required");
      }
      if (!hrManagerId.trim()) {
        throw new Error("Please select an HR manager");
      }
      if (!orgId.trim()) {
        throw new Error("Selected HR manager has no organization id");
      }

      const response = await assignCertificateTemplateToHr({
        templateId: templateId.trim(),
        orgId: orgId.trim(),
        hrManagerId: hrManagerId.trim(),
      });

      const reissueNote =
        typeof response.reissuedCount === "number" && response.reissuedCount > 0
          ? ` ${response.reissuedCount} existing certificate(s) were updated.`
          : "";

      setAssignSuccess(`${response.message}${reissueNote}`);
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Failed to assign template"
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePrintCertificate = async () => {
    if (!previewRef.current) {
      setCertError("Certificate preview is not ready to print.");
      return;
    }

    try {
      setCertError(null);
      await printCertificatePreview(previewRef.current);
    } catch (error) {
      setCertError(
        error instanceof Error
          ? error.message
          : "Unable to open the certificate print dialog.",
      );
    }
  };

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    setCertError(null);
  };

  const renderCertificatePreview = () => {
    const isClassic = certConfig.theme === "classic";
    const isModern = certConfig.theme === "modern";
    const isTech = certConfig.theme === "tech";

    return (
      <div
        ref={previewRef}
        id="certificate-preview"
        className={`bg-white w-[760px] min-h-[540px] shrink-0 shadow-2xl relative flex flex-col items-center text-center px-12 py-10 transition-all duration-300 ${
          isClassic
            ? "font-serif border-14 border-double border-amber-700/30"
            : isModern
              ? "font-sans border border-slate-200 border-t-18 border-t-brand-primary"
              : "font-mono border border-slate-900 bg-slate-50"
        }`}
        style={{
          backgroundImage: isClassic
            ? "radial-gradient(circle at top, #fff9eb 0%, #ffffff 68%)"
            : isTech
              ? "linear-gradient(180deg, #f8fafc 0%, #ffffff 42%)"
              : undefined,
        }}
      >
        {isClassic && (
          <>
            <div className="absolute top-5 left-5 right-5 bottom-5 border border-amber-800/25 pointer-events-none" />
            <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-amber-700/40" />
            <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-amber-700/40" />
            <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-amber-700/40" />
            <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-amber-700/40" />
          </>
        )}

        {isTech && (
          <>
            <div className="absolute top-0 left-0 right-0 h-14 bg-slate-900" />
            <div className="absolute top-14 right-0 w-28 h-28 bg-slate-200/70" />
          </>
        )}

        {isModern && (
          <div className="absolute left-0 top-[18px] bottom-0 w-2 bg-brand-accent" />
        )}

        <div className={`mb-8 mt-4 relative z-10 ${isTech ? "pt-10" : ""}`}>
          {activeLogoUrl ? (
            <img
              src={activeLogoUrl}
              alt="Certificate logo"
              className="mx-auto max-h-20 max-w-[220px] object-contain mb-5"
            />
          ) : (
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-white/80 text-gray-400">
              <ImagePlus size={28} />
            </div>
          )}

          <div
            className={`text-[11px] uppercase tracking-[0.35em] mb-4 ${
              isTech ? "text-slate-500" : "text-gray-400"
            }`}
          >
            Prime Impact
          </div>

          <h1
            className={`font-bold leading-tight ${
              isClassic
                ? "text-4xl text-gray-800 italic"
                : isTech
                  ? "text-3xl text-slate-900 uppercase tracking-tight"
                  : "text-4xl text-brand-primary tracking-tight"
            }`}
          >
            {certConfig.title}
          </h1>
        </div>

        <div className="flex-1 w-full space-y-5 relative z-10">
          <p className={`text-lg ${isTech ? "text-slate-600" : "text-gray-500"}`}>
            This certifies that
          </p>
          <div
            className={`text-3xl font-semibold w-2/3 mx-auto pb-2 ${
              isClassic
                ? "border-b-2 border-amber-700/30 text-gray-800"
                : isTech
                  ? "border-b border-slate-900 text-slate-900"
                  : "border-b-2 border-brand-primary/30 text-gray-800"
            }`}
          >
            Jane Doe
          </div>
          <p className={`${isTech ? "text-slate-600" : "text-gray-500"}`}>
            has successfully completed the course requirements for
          </p>
          <p
            className={`text-xl font-semibold ${
              isClassic
                ? "text-brand-primary"
                : isTech
                  ? "text-slate-900 uppercase tracking-wide"
                  : "text-brand-primary-dark"
            }`}
          >
            Advanced Leadership Program
          </p>
          {certConfig.showDate && (
            <p className={`font-medium ${isTech ? "text-slate-700" : "text-gray-700"}`}>
              {new Date().toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        <div className="w-full flex justify-between items-end mt-8 px-4 relative z-10">
          <div className="text-center">
            <div
              className={`text-xl mb-1 ${
                isClassic
                  ? "text-brand-primary italic"
                  : isTech
                    ? "font-bold text-slate-900"
                    : "font-bold text-gray-800"
              }`}
              style={isClassic ? { fontFamily: "cursive" } : undefined}
            >
              {certConfig.signatory}
            </div>
            <div
              className={`w-52 mx-auto border-t ${
                isClassic ? "border-amber-700/40" : "border-gray-400"
              }`}
            />
            <p className="text-xs text-gray-400 mt-2 uppercase tracking-[0.2em]">
              {certConfig.signatoryRole}
            </p>
          </div>

          <div className="opacity-90">
            <Award
              size={72}
              className={
                isClassic
                  ? "text-amber-600"
                  : isTech
                    ? "text-slate-800"
                    : "text-brand-primary"
              }
            />
          </div>
        </div>
      </div>
    );
  };

  /* =====================
     Render
  ===================== */

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Rewards & Recognition
          </h2>
          <p className="text-gray-500">
            Design certificates and manage Impact Coin economy
          </p>
        </div>

        <div className="bg-white rounded-lg p-1 border flex gap-1 shadow-sm">
          <button
            onClick={() => setActiveTab("CERTIFICATE")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "CERTIFICATE"
                ? "bg-brand-primary text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Award size={16} /> Certificate Designer
          </button>

          <button
            onClick={() => setActiveTab("COINS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "COINS"
                ? "bg-brand-primary-dark text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Coins size={16} /> Impact Coins
          </button>
        </div>
      </div>

      {/* =====================
          CERTIFICATE TAB
      ===================== */}

      {activeTab === "CERTIFICATE" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit3 size={18} className="text-brand-primary" /> Template Configuration
            </h3>

            <div className="space-y-4">
              {/* Theme */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Theme Style
                </label>
                <div className="space-y-2">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() =>
                        setCertConfig({ ...certConfig, theme: theme.id })
                      }
                      className={`w-full text-left px-3 py-3 border rounded-lg transition-colors ${
                        certConfig.theme === theme.id
                          ? "border-brand-primary bg-brand-primary/10"
                          : "border-gray-200 hover:border-brand-primary/40"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold capitalize ${
                          certConfig.theme === theme.id
                            ? "text-brand-primary"
                            : "text-gray-800"
                        }`}
                      >
                        {theme.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {theme.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              {(
                [
                  ["Headline Text", "title"],
                  ["Signatory Name", "signatory"],
                  ["Signatory Role", "signatoryRole"],
                ] as const
              ).map(([label, key]) => (
                <div key={key}>
                  <label className="text-sm font-medium mb-1 block">
                    {label}
                  </label>
                  <input
                    value={certConfig[key]}
                    onChange={(e) =>
                      setCertConfig({
                        ...certConfig,
                        [key]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Organization Logo
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
                  onChange={(e) =>
                    handleLogoChange(e.target.files?.[0] ?? null)
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
                {logoFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {logoFile.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, or WEBP. The logo appears at the top of every issued
                  issued certificate.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Template Description (optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Internal note for this certificate template"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Template ID</label>
                <input
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Auto-filled after upload, or paste manually"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  HR Manager
                </label>
                <select
                  value={hrManagerId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHrManagerId(value);
                    const selected = hrManagers.find((hr) => hr.id === value);
                    if (selected?.orgId) {
                      setOrgId(selected.orgId);
                    } else {
                      setOrgId("");
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">Select HR manager</option>
                  {hrManagers.map((hr) => (
                    <option key={hr.id} value={hr.id}>
                      {hr.name} ({hr.email || hr.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Organization ID (auto from HR Manager)
                </label>
                <input
                  readOnly
                  value={orgId}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-700"
                  placeholder="Select HR manager first"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is filled automatically based on selected HR manager.
                </p>
              </div>

              {/* Checkbox */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={certConfig.showDate}
                  onChange={(e) =>
                    setCertConfig({
                      ...certConfig,
                      showDate: e.target.checked,
                    })
                  }
                />
                Include Issue Date
              </label>

              {/* Error */}
              {certError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {certError}
                </div>
              )}

              {assignError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {assignError}
                </div>
              )}

              {assignSuccess && (
                <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                  {assignSuccess}
                </div>
              )}

              {/* Save */}
              <button
                onClick={handleSaveCertificate}
                disabled={certLoading}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {certLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {certLoading ? "Saving…" : "Save Template"}
              </button>

              <button
                onClick={handleAssignTemplate}
                disabled={assignLoading}
                className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {assignLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {assignLoading ? "Assigning…" : "Assign To HR Manager"}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="font-bold text-gray-600 text-sm">
                Live Certificate Preview
              </h3>
              <button
                type="button"
                onClick={handlePrintCertificate}
                className="text-brand-primary text-xs flex items-center gap-1 hover:text-brand-primary-dark"
              >
                <Printer size={12} /> Test Print
              </button>
            </div>

            <div className="bg-slate-800 p-8 rounded-xl shadow-inner flex justify-center items-center overflow-x-auto">
              {renderCertificatePreview()}
            </div>

            {savedLogoUrl && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                Certificate template saved. Logo and theme settings will be used
                when HR managers issue certificates.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================
          COINS TAB
          (UNCHANGED)
      ===================== */}
        {activeTab === 'COINS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Coins size={18} className="text-yellow-500" /> Economy Rules
            </h3>

            {economyError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {economyError}
              </div>
            )}
            {economySuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {economySuccess}
              </div>
            )}
            
            <div className={`space-y-6 ${economyLoading ? "opacity-60 pointer-events-none" : ""}`}>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">Course Completion</h4>
                  <p className="text-sm text-gray-500">Reward for finishing a full course</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={coinRules.courseCompletion}
                    onChange={(e) => setCoinRules({...coinRules, courseCompletion: parseInt(e.target.value)})}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-mono font-medium"
                  />
                  <span className="text-sm text-yellow-600 font-bold">B$</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">Module Completion</h4>
                  <p className="text-sm text-gray-500">Reward for individual modules</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={coinRules.moduleCompletion}
                    onChange={(e) => setCoinRules({...coinRules, moduleCompletion: parseInt(e.target.value)})}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-mono font-medium"
                  />
                  <span className="text-sm text-yellow-600 font-bold">B$</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">Perfect Quiz Score</h4>
                  <p className="text-sm text-gray-500">Bonus for 100% on assessments</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={coinRules.perfectQuiz}
                    onChange={(e) => setCoinRules({...coinRules, perfectQuiz: parseInt(e.target.value)})}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-mono font-medium"
                  />
                  <span className="text-sm text-yellow-600 font-bold">B$</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <h4 className="font-medium text-gray-800">Daily Login Streak</h4>
                  <p className="text-sm text-gray-500">Reward for 7-day streaks</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={coinRules.dailyStreak}
                    onChange={(e) => setCoinRules({...coinRules, dailyStreak: parseInt(e.target.value)})}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-mono font-medium"
                  />
                  <span className="text-sm text-yellow-600 font-bold">B$</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUpdateEconomy}
              disabled={economySaving || economyLoading}
              className="w-full mt-6 bg-brand-primary hover:bg-brand-primary-dark disabled:opacity-60 text-white py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {economySaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {economySaving ? "Updating..." : "Update Economy"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-linear-to-br from-brand-primary to-brand-primary-dark rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
               <h3 className="text-xl font-bold mb-1">Impact Coin (B$)</h3>
               <p className="text-yellow-100 text-sm mb-6">
                 Total Circulating Supply: {totalCirculating.toLocaleString()} B$
               </p>
               
               <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-yellow-300 rounded-full border-4 border-yellow-200 shadow-inner flex items-center justify-center text-yellow-700 font-bold text-3xl shrink-0">
                   B$
                 </div>
                 <div>
                    <div className="text-sm font-medium text-yellow-100 uppercase tracking-wider">Exchange Rate</div>
                    <div className="font-bold text-2xl">100 B$ = 1 HR Leave</div>
                    <p className="text-xs text-yellow-100 opacity-80 mt-1">*Configurable in HR Portal</p>
                 </div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Trophy size={18} className="text-purple-500" /> Global Leaderboard
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={coinRules.enableLeaderboard} 
                    onChange={(e) => setCoinRules({...coinRules, enableLeaderboard: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className={`space-y-3 ${!coinRules.enableLeaderboard ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                 {(leaderboard.length > 0 ? leaderboard : []).map((user) => (
                   <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                         <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                           user.rank === 1 ? 'bg-yellow-400' : user.rank === 2 ? 'bg-gray-400' : 'bg-orange-400'
                         }`}>
                           {user.rank}
                         </div>
                         <span className="font-medium text-gray-700">{user.name}</span>
                      </div>
                      <span className="font-bold text-gray-800">{user.coins} B$</span>
                   </div>
                 ))}
                 {leaderboard.length === 0 && (
                   <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                     No learners with Impact Coins yet.
                   </div>
                 )}
                 <div className="text-center text-xs text-gray-400 pt-2">
                    Top 3 Earners this Month
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
