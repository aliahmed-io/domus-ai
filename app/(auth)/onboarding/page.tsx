"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Layers,
  Scan,
  Palette,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Building,
  Wand2,
  Users,
  Compass,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { kvSet } from "@/lib/puter";

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // User onboarding answers
  const [role, setRole] = useState<string>("Architect");
  const [template, setTemplate] = useState<string>("floor-plan");
  const [notifications, setNotifications] = useState<boolean>(true);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const nextStep = () => {
    if (step < 5) {
      setStep((step + 1) as Step);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  // Complete onboarding
  const handleComplete = async () => {
    setIsFinishing(true);
    try {
      // Save user onboarding details to Puter cloud KV storage
      await kvSet("domus:user-onboarding", {
        role,
        template,
        notifications,
        completedAt: new Date().toISOString(),
      });
      router.push("/editor");
    } catch (err) {
      console.error("Failed to save onboarding settings:", err);
      router.push("/editor");
    } finally {
      setIsFinishing(false);
    }
  };

  // Animation variants
  const slideVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
  };

  return (
    <div className="w-full bg-white border border-hairline rounded-2xl p-8 md:p-10 shadow-hero flex flex-col min-h-[460px] relative overflow-hidden">
      {/* ── TOP STEPS INDICATOR ────────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between gap-1 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step >= i ? "bg-indigo" : "bg-indigo-light"
            }`}
          />
        ))}
      </div>

      {/* ── MAIN STEPS ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center gap-4"
            >
              <Logo size="md" showWordmark={true} />
              <h2 className="font-jakarta text-heading-md font-800 text-charcoal tracking-tight mt-3">
                Welcome to Domus
              </h2>
              <p className="font-body text-xs text-stone leading-relaxed max-w-sm">
                Domus is the unified spatial intelligence ecosystem that merges AI layout calculations, BIM models, and WebXR scanning.
              </p>
              <div className="w-24 h-24 rounded-2xl bg-indigo-light flex items-center justify-center text-indigo mt-4 animate-bounce">
                <Compass size={40} />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-4"
            >
              <div>
                <h3 className="font-jakarta text-heading-sm font-700 text-charcoal">
                  Select your role
                </h3>
                <p className="font-body text-xs text-stone mt-0.5">
                  Let us tailor the workspace defaults to match your profession.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { id: "Architect", icon: Building, desc: "BIM structures & IFCs" },
                  { id: "Interior Designer", icon: Wand2, desc: "Materials & models" },
                  { id: "3D Developer", icon: Brain, desc: "R3F & WebXR engines" },
                  { id: "Researcher", icon: Users, desc: "GNNs & data scans" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setRole(item.id)}
                    className={`flex flex-col gap-2.5 p-4 rounded-xl text-left border transition-all duration-200 ${
                      role === item.id
                        ? "bg-indigo-light border-indigo text-charcoal shadow-sm"
                        : "bg-white border-hairline text-stone hover:bg-gray-50 hover:text-charcoal"
                    }`}
                  >
                    <item.icon size={20} className={role === item.id ? "text-indigo" : "text-stone"} />
                    <div>
                      <h4 className="font-jakarta text-xs font-bold">{item.id}</h4>
                      <p className="font-body text-[10px] opacity-80 mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-4"
            >
              <div>
                <h3 className="font-jakarta text-heading-sm font-700 text-charcoal">
                  Choose starting tool
                </h3>
                <p className="font-body text-xs text-stone mt-0.5">
                  Choose a space template to load into the Editor.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { id: "floor-plan", label: "Floor Plan", icon: Brain, desc: "AI GNN layouts" },
                  { id: "bim-model", label: "BIM Lift", icon: Layers, desc: "Blueprints to 3D" },
                  { id: "ar-scan", label: "AR Scanner", icon: Scan, desc: "WebXR depth map" },
                  { id: "material-lab", label: "Material reskin", icon: Palette, desc: "TRELLIS textures" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTemplate(item.id)}
                    className={`flex flex-col gap-2.5 p-4 rounded-xl text-left border transition-all duration-200 ${
                      template === item.id
                        ? "bg-indigo-light border-indigo text-charcoal shadow-sm"
                        : "bg-white border-hairline text-stone hover:bg-gray-50 hover:text-charcoal"
                    }`}
                  >
                    <item.icon size={20} className={template === item.id ? "text-indigo" : "text-stone"} />
                    <div>
                      <h4 className="font-jakarta text-xs font-bold">{item.label}</h4>
                      <p className="font-body text-[10px] opacity-80 mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-4"
            >
              <div>
                <h3 className="font-jakarta text-heading-sm font-700 text-charcoal">
                  Platform settings
                </h3>
                <p className="font-body text-xs text-stone mt-0.5">
                  Configure default spatial sync rules.
                </p>
              </div>

              <div className="flex flex-col gap-4 mt-3">
                <div className="flex items-center justify-between p-4 bg-alabaster border border-hairline rounded-xl">
                  <div className="flex flex-col gap-0.5 max-w-[220px]">
                    <span className="font-jakarta text-xs font-bold text-charcoal">
                      Enable Cloud Sync
                    </span>
                    <span className="font-body text-[10px] text-stone">
                      Sync spatial metadata back to Puter KV store automatically.
                    </span>
                  </div>
                  <div className="w-10 h-6 bg-indigo rounded-full flex items-center justify-end p-0.5 cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-alabaster border border-hairline rounded-xl">
                  <div className="flex flex-col gap-0.5 max-w-[220px]">
                    <span className="font-jakarta text-xs font-bold text-charcoal">
                      Push Notifications
                    </span>
                    <span className="font-body text-[10px] text-stone">
                      Get notified when complex BIM analysis or texture gens finish.
                    </span>
                  </div>
                  <div
                    onClick={() => setNotifications(!notifications)}
                    className={`w-10 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-all ${
                      notifications ? "bg-indigo justify-end" : "bg-gray-200 justify-start"
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-successLight text-success flex items-center justify-center border border-success/10 shadow-inner">
                <CheckCircle size={28} />
              </div>
              <h3 className="font-jakarta text-heading-md font-800 text-charcoal tracking-tight mt-3">
                All Systems Ready!
              </h3>
              <p className="font-body text-xs text-stone leading-relaxed max-w-sm">
                Onboarding complete! Your personalized workspace configuration is synchronized, and the 3D WebGL engine is primed.
              </p>
              <div className="text-stone font-body text-[11px] mt-2">
                Workspace Role: <strong className="text-indigo font-bold">{role}</strong>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BUTTON CONTROLS ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-10 gap-3 border-t border-hairline pt-6">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone hover:text-charcoal px-4 py-2 border border-hairline hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 bg-indigo hover:bg-indigoDark text-white rounded-lg shadow-button transition-colors"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isFinishing}
              className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 bg-indigo hover:bg-indigoDark text-white rounded-lg shadow-button transition-colors disabled:opacity-50"
            >
              <span>{isFinishing ? "Syncing..." : "Launch Space"}</span>
              <Sparkles size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
