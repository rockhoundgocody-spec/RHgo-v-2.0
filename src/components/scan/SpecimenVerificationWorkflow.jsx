import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CheckCircle2,
  AlertCircle,
  Camera,
  FlaskConical,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

/**
 * Specimen Verification Workflow
 * Guides users through multi-step field verification with AI coaching
 */
export default function SpecimenVerificationWorkflow({
  specimenDraft,
  geologicalContext,
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const verificationSteps = [
    {
      id: 'photos',
      title: 'Multi-Angle Photos',
      description: 'Capture frontal, side, and macro close-ups',
      icon: Camera,
      required: true,
      questions: [
        {
          key: 'has_frontal',
          text: 'Do you have a clear frontal view?',
          type: 'choice',
          options: ['Yes', 'No, take one now'],
        },
        {
          key: 'has_macro',
          text: 'Macro close-up of crystal structure?',
          type: 'choice',
          options: ['Yes', 'No, take one now', 'N/A'],
        },
      ],
    },
    {
      id: 'hardness',
      title: 'Hardness Test',
      description: `Moh's hardness: 1=scratch easily, 10=diamond`,
      icon: FlaskConical,
      required: geologicalContext?.verification_tests?.some((t) =>
        t.test.toLowerCase().includes('hardness')
      ),
      questions: [
        {
          key: 'hardness_value',
          text: 'Hardness (1-10)?',
          type: 'number',
          min: 1,
          max: 10,
        },
      ],
    },
    {
      id: 'streak',
      title: 'Streak Test',
      description: 'Scratch on unglazed ceramic plate',
      icon: FlaskConical,
      questions: [
        {
          key: 'streak_color',
          text: 'Streak color?',
          type: 'text',
        },
      ],
    },
    {
      id: 'confidence',
      title: 'Confidence Assessment',
      description: 'You are now confident this is correct?',
      icon: Lightbulb,
      questions: [
        {
          key: 'confident',
          text: 'Are you confident in this ID?',
          type: 'choice',
          options: ['Very confident', 'Somewhat confident', 'Uncertain'],
        },
      ],
    },
  ];

  const step = verificationSteps[currentStep];

  const handleAnswer = useCallback(
    (questionKey, value) => {
      setAnswers((prev) => ({ ...prev, [questionKey]: value }));
    },
    []
  );

  const handleNext = async () => {
    if (currentStep < verificationSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Save verification results
      setLoading(true);

      try {
        // Create IdentificationReasoning entry
        await base44.entities.IdentificationReasoning.create({
          specimen_id: specimenDraft.id,
          reasoning_type: 'field_verification',
          model_or_agent: 'user',
          primary_candidate: specimenDraft.primary_name,
          confidence: specimenDraft.confidence,
          key_evidence: Object.entries(answers).map(([k, v]) => ({
            trait: k.replace(/_/g, ' '),
            observed: String(v),
            expected: 'user confirmed',
            weight: 1,
          })),
          uncertainty_factors: [],
          next_verification_steps: [],
        });

        // Update specimen
        await base44.entities.Specimen.update(specimenDraft.id, {
          verified: true,
          verification_count: (specimenDraft.verification_count || 0) + 1,
          notes: Object.entries(answers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n'),
        });

        onComplete?.();
      } catch (error) {
        console.error('Verification save failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const Step = step.icon;
  const progress = ((currentStep + 1) / verificationSteps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50 uppercase tracking-wide">
            Step {currentStep + 1} of {verificationSteps.length}
          </span>
          <span className="text-xs text-amethyst-glow font-mono">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-amethyst-glow transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <GlassPanel className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-amethyst/20 border border-amethyst/40 flex items-center justify-center shrink-0">
            <Step size={24} className="text-amethyst-glow" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{step.title}</h2>
            <p className="text-white/60 text-sm mt-1">{step.description}</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {step.questions.map((question) => (
            <div key={question.key}>
              <label className="block text-sm font-medium text-white mb-2">
                {question.text}
              </label>

              {question.type === 'choice' && (
                <div className="grid grid-cols-1 gap-2">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(question.key, option)}
                      className={`p-3 rounded-lg border text-left transition ${
                        answers[question.key] === option
                          ? 'border-amethyst bg-amethyst/20 text-white'
                          : 'border-white/20 text-white/70 hover:border-white/40'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'text' && (
                <input
                  type="text"
                  value={answers[question.key] || ''}
                  onChange={(e) => handleAnswer(question.key, e.target.value)}
                  placeholder="Your answer…"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amethyst"
                />
              )}

              {question.type === 'number' && (
                <input
                  type="number"
                  min={question.min}
                  max={question.max}
                  value={answers[question.key] || ''}
                  onChange={(e) => handleAnswer(question.key, e.target.value)}
                  placeholder="Enter value…"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amethyst"
                />
              )}
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Tips */}
      <GlassPanel variant="hud" className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-hud-cyan mt-0.5 shrink-0" />
          <div className="text-sm text-white/70">
            <strong className="text-hud-cyan">Tip:</strong>{' '}
            {step.id === 'photos' &&
              'Good lighting and multiple angles help the AI and future experts verify your ID.'}
            {step.id === 'hardness' &&
              'Test on the specimen, not a polished surface. Mohs scale: fingernail=2.5, penny=3, nail=4-5, glass=5.5, steel=6.5'}
            {step.id === 'streak' &&
              'Scratch the back or rough edge. The powder color matters more than the mineral color!'}
            {step.id === 'confidence' &&
              'Be honest. Uncertain IDs help the community learn. No shame in "maybe."'}
          </div>
        </div>
      </GlassPanel>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
          disabled={currentStep === 0}
          className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white disabled:opacity-30 hover:bg-white/5 transition"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst text-white font-semibold disabled:opacity-50 transition"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : currentStep === verificationSteps.length - 1 ? (
            <>
              <CheckCircle2 size={18} /> Complete
            </>
          ) : (
            <>
              Next <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}