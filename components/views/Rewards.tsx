import React, { useEffect, useState } from "react";
import {
  Award,
  Coins,
  Edit3,
  Save,
  Printer,
  RefreshCw,
  Trophy,
  Loader2,
} from "lucide-react";
import {
  assignCertificateTemplateToHr,
  createCertificateTemplate,
} from "@/api/certificates";
import { getUsers } from "@/api/users";

const Rewards: React.FC = () => {
  const [activeTab, setActiveTab] =
    useState<"CERTIFICATE" | "COINS">("CERTIFICATE");

  /* =====================
     Certificate State
  ===================== */

  const [certConfig, setCertConfig] = useState({
    theme: "classic",
    title: "Certificate of Completion",
    signatory: "Dr. John Smith",
    signatoryRole: "Director of Education",
    showDate: true,
  });

  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [hrManagerId, setHrManagerId] = useState("");
  const [hrManagers, setHrManagers] = useState<
    Array<{ id: string; name: string; email: string; orgId?: string }>
  >([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [showUploadedPdfPreview, setShowUploadedPdfPreview] = useState(false);

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

  const handleSaveCertificate = async () => {
    setCertLoading(true);
    setCertError(null);
    setAssignSuccess(null);

    try {
      if (!templateFile) {
        throw new Error("Please upload a PDF template first");
      }

      const json = await createCertificateTemplate(
        templateFile,
        templateDescription || undefined
      );
      setCertificateUrl(json.url);
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

      setAssignSuccess(response.message);
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Failed to assign template"
      );
    } finally {
      setAssignLoading(false);
    }
  };

  const handlePrintCertificate = () => {
    if (!certificateUrl) return;
    window.open(certificateUrl, "_blank");
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
            Design certificates and manage BICMAS Coin economy
          </p>
        </div>

        <div className="bg-white rounded-lg p-1 border flex gap-1 shadow-sm">
          <button
            onClick={() => setActiveTab("CERTIFICATE")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "CERTIFICATE"
                ? "bg-[#008080] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Award size={16} /> Certificate Designer
          </button>

          <button
            onClick={() => setActiveTab("COINS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "COINS"
                ? "bg-[#004c4c] text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Coins size={16} /> BICMAS Coins
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
              <Edit3 size={18} className="text-blue-500" /> Template Configuration
            </h3>

            <div className="space-y-4">
              {/* Theme */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Theme Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["classic", "modern", "tech"].map((theme) => (
                    <button
                      key={theme}
                      onClick={() =>
                        setCertConfig({ ...certConfig, theme })
                      }
                      className={`py-2 text-xs font-medium border rounded-lg capitalize ${
                        certConfig.theme === theme
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              {[
                ["Headline Text", "title"],
                ["Signatory Name", "signatory"],
                ["Signatory Role", "signatoryRole"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="text-sm font-medium mb-1 block">
                    {label}
                  </label>
                  <input
                    value={(certConfig as any)[key]}
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
                  Template PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) =>
                    setTemplateFile(e.target.files?.[0] ?? null)
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                />
                {templateFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {templateFile.name}
                  </p>
                )}
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
                className="w-full bg-[#008080] hover:bg-[#004c4c] text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {certLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {certLoading ? "Generating…" : "Save Template"}
              </button>

              <button
                onClick={handleAssignTemplate}
                disabled={assignLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-60"
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
                Designer Preview (uses your inputs)
              </h3>
              <button
                onClick={handlePrintCertificate}
                disabled={!certificateUrl}
                className="text-blue-600 text-xs flex items-center gap-1 disabled:opacity-40"
              >
                <Printer size={12} /> Test Print
              </button>
            </div>

            {/* PREVIEW UI UNCHANGED */}
            <div className="bg-slate-800 p-8 rounded-xl shadow-inner flex justify-center items-center overflow-x-auto">
              <div 
                className={`bg-white w-[700px] h-[500px] shrink-0 shadow-2xl relative flex flex-col items-center text-center p-12 transition-all duration-300 ${
                  certConfig.theme === 'classic' ? 'font-serif border-[12px] border-double border-gray-300' :
                  certConfig.theme === 'modern' ? 'font-sans border-t-8 border-blue-600' :
                  'font-mono border border-slate-900 bg-slate-50'
                }`}
                style={{
                  backgroundImage: certConfig.theme === 'classic' ? 'radial-gradient(circle, #fffaeb 0%, #fff 100%)' : 'none'
                }}
              >
                {/* Decor */}
                {certConfig.theme === 'classic' && (
                  <div className="absolute top-4 left-4 right-4 bottom-4 border border-gray-400 pointer-events-none"></div>
                )}
                {certConfig.theme === 'tech' && (
                   <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/50 clip-path-polygon"></div>
                )}

                {/* Header */}
                <div className="mb-12 mt-8">
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-4">BICMAS Academy</div>
                  <h1 className={`text-4xl font-bold ${
                    certConfig.theme === 'classic' ? 'text-gray-800 italic' :
                    certConfig.theme === 'tech' ? 'text-slate-900 uppercase tracking-tighter' :
                    'text-blue-600'
                  }`}>
                    {certConfig.title}
                  </h1>
                </div>

                {/* Content */}
                <div className="flex-1 w-full space-y-6">
                  <p className="text-gray-500 text-lg">This certifies that</p>
                  <div className="text-3xl font-medium border-b border-gray-300 w-2/3 mx-auto pb-2 text-gray-800">
                    Jane Doe
                  </div>
                  <p className="text-gray-500">
                    has successfully completed the course requirements on
                  </p>
                  {certConfig.showDate && (
                    <p className="font-medium text-gray-700">{new Date().toLocaleDateString()}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="w-full flex justify-between items-end mt-12 px-8">
                  <div className="text-center">
                    <div className={`text-xl mb-1 ${certConfig.theme === 'classic' ? 'font-cursive text-blue-900' : 'font-bold'}`} style={{fontFamily: 'cursive'}}>
                      {certConfig.signatory}
                    </div>
                    <div className="w-48 border-t border-gray-400"></div>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{certConfig.signatoryRole}</p>
                  </div>
                  <div className="opacity-80">
                     <Award size={64} className={
                       certConfig.theme === 'classic' ? 'text-yellow-500' :
                       certConfig.theme === 'tech' ? 'text-slate-800' :
                       'text-blue-500'
                     }/>
                  </div>
                </div>
              </div>
            </div>

            {certificateUrl && (
              <div className="bg-white rounded-xl border shadow-sm p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Uploaded PDF Preview (original template file)
                  </p>
                  <button
                    onClick={() => setShowUploadedPdfPreview((prev) => !prev)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {showUploadedPdfPreview ? "Hide" : "Show"}
                  </button>
                </div>

                {showUploadedPdfPreview && (
                  <iframe
                    title="Certificate template preview"
                    src={certificateUrl}
                    className="w-full h-[420px] rounded border"
                  />
                )}
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
            
            <div className="space-y-6">
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

            <button className="w-full mt-6 bg-[#008080] hover:bg-[#004c4c] text-white py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2">
               <RefreshCw size={16} /> Update Economy
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#008080] to-[#004c4c] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
               <h3 className="text-xl font-bold mb-1">BICMAS Coin (B$)</h3>
               <p className="text-yellow-100 text-sm mb-6">Total Circulating Supply: 1,240,500 B$</p>
               
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
                 {[
                   { name: 'Sarah Connor', coins: 1250, rank: 1 },
                   { name: 'Mike Smith', coins: 980, rank: 2 },
                   { name: 'John Doe', coins: 850, rank: 3 },
                 ].map((user) => (
                   <div key={user.rank} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
