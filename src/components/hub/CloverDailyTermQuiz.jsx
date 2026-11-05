import React, { useState, useMemo } from 'react';
import { BookOpen, CheckCircle2, XCircle, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { getDailyTerminologyQuiz } from '@/lib/mindatApi';
import { recordMasteredTerm, getTerminologyMastery } from '@/lib/cloverMemory';

/**
 * CloverDailyTermQuiz — Quick-tap daily terminology & field slang quiz inside
 * the Clover voice panel. Every answer teaches both the hunter and Clover's
 * cognitive memory bank, with Clover speaking the explanation aloud.
 */
export default function CloverDailyTermQuiz({ onSpeak, onClose }) {
  const dateKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [roundOffset, setRoundOffset] = useState(0);
  const [step, setStep] = useState(0);
  const [pickedTerm, setPickedTerm] = useState(null);
  const [score, setScore] = useState(0);
  const [mastery, setMastery] = useState(() => getTerminologyMastery());

  const questions = useMemo(
    () => getDailyTerminologyQuiz(dateKey, roundOffset),
    [dateKey, roundOffset]
  );

  const current = questions[step];
  const finishedRound = step >= questions.length;

  const handlePick = (option) => {
    if (pickedTerm) return;
    setPickedTerm(option.term);
    const nextScore = option.isCorrect ? score + 1 : score;
    if (option.isCorrect) setScore(nextScore);

    const isLastStep = step + 1 >= questions.length;
    const updatedMastery = recordMasteredTerm(current.term, isLastStep);
    setMastery(updatedMastery);

    const spokenFeedback = option.isCorrect
      ? `Spot on! ${current.voiceLine}`
      : `Close, hound — that one is ${current.term}. ${current.prompt}`;
    onSpeak?.(spokenFeedback);
  };

  const handleNext = () => {
    setPickedTerm(null);
    setStep((s) => s + 1);
  };

  const handlePracticeMore = () => {
    setRoundOffset((r) => r + 1);
    setStep(0);
    setPickedTerm(null);
    setScore(0);
  };

  return (
    <div
      className="rounded-xl p-2.5 space-y-2 text-[11px]"
      style={{
        background: 'linear-gradient(155deg, hsla(220,45%,15%,0.92), hsla(255,35%,13%,0.95))',
        border: '1px solid hsla(175,80%,60%,0.38)',
        boxShadow: 'inset 0 1px 0 hsla(175,90%,85%,0.15)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-hud">
          <BookOpen size={12} />
          <span>Daily Hound Lingo Quiz</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold"
            style={{ background: 'hsla(165,80%,40%,0.2)', color: '#9FE8D0' }}
            title="Terms stored in Clover's memory bank"
          >
            {mastery.masteredCount} learned
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[9px] text-white/45 hover:text-white/80 px-1 rounded"
            >
              Hide
            </button>
          )}
        </div>
      </div>

      {!finishedRound && current ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono text-white/50">
            <span className="uppercase tracking-wider text-amber-300/90">{current.category}</span>
            <span>Term {step + 1} / {questions.length}</span>
          </div>

          <p className="text-[10.5px] text-white/90 leading-snug font-medium">
            “{current.prompt}”
          </p>

          <div className="grid grid-cols-1 gap-1.5 pt-0.5" role="group" aria-label="Quiz answer choices">
            {current.options.map((opt) => {
              const isSelected = pickedTerm === opt.term;
              const revealCorrect = pickedTerm && opt.isCorrect;
              const revealWrong = isSelected && !opt.isCorrect;

              let btnStyle = {
                background: 'hsla(245,25%,20%,0.75)',
                border: '1px solid hsla(255,30%,50%,0.28)',
                color: 'rgba(255,255,255,0.88)',
              };
              if (revealCorrect) {
                btnStyle = {
                  background: 'hsla(160,75%,32%,0.35)',
                  border: '1px solid #9FE8D0',
                  color: '#9FE8D0',
                };
              } else if (revealWrong) {
                btnStyle = {
                  background: 'hsla(350,70%,35%,0.32)',
                  border: '1px solid hsla(350,80%,65%,0.6)',
                  color: 'hsl(350,90%,85%)',
                };
              }

              return (
                <button
                  key={opt.term}
                  type="button"
                  disabled={!!pickedTerm}
                  onClick={() => handlePick(opt)}
                  style={btnStyle}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[10.5px] font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/60"
                >
                  <span>{opt.term}</span>
                  {revealCorrect && <CheckCircle2 size={12} className="shrink-0 text-[#9FE8D0]" />}
                  {revealWrong && <XCircle size={12} className="shrink-0 text-rose-300" />}
                </button>
              );
            })}
          </div>

          {pickedTerm && (
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-[9.5px] text-white/65">
                {pickedTerm === current.term ? '✓ Added to Clover memory' : `Answer: ${current.term}`}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-[#0a0a14] transition active:scale-95"
                style={{ background: '#9FE8D0' }}
              >
                <span>{step + 1 < questions.length ? 'Next Term' : 'Finish'}</span>
                <ArrowRight size={10} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 py-1 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: 'hsla(160,75%,35%,0.25)', color: '#9FE8D0', border: '1px solid hsla(160,80%,65%,0.4)' }}>
            <Sparkles size={11} />
            <span>Round Complete · {score}/{questions.length} Correct</span>
          </div>
          <p className="text-[10px] text-white/70 leading-snug">
            Clover now holds <span className="text-[#9FE8D0] font-semibold">{mastery.masteredCount} rockhounding terms</span> in her field memory{mastery.quizStreak > 0 ? ` (${mastery.quizStreak}d streak)` : ''}.
          </p>
          <button
            type="button"
            onClick={handlePracticeMore}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-hud transition active:scale-95"
            style={{ background: 'hsla(195,85%,45%,0.18)', border: '1px solid hsla(190,90%,65%,0.38)' }}
          >
            <RotateCcw size={11} />
            <span>Quiz 3 More Terms</span>
          </button>
        </div>
      )}
    </div>
  );
}