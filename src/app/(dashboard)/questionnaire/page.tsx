'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Clock, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/user-store';
import { cn } from '@/lib/utils';
import {
  MEQ_QUESTIONS,
  calculateMEQScore,
  getMEQChronotypeCategory,
} from '@/types/questionnaire';
import { estimateCircadianMarkers } from '@/lib/circadian/dlmo-estimator';
import { getChronotypeDescription } from '@/lib/circadian/chronotype';
import type { MEQResponse } from '@/types/questionnaire';
import type { CircadianProfile, ChronotypeCategory } from '@/types/user';

type QuestionnaireStep = 'intro' | 'questions' | 'sleep_times' | 'results';

interface SleepTimes {
  habitualBedtime: string;
  habitualWakeTime: string;
  workdayBedtime: string;
  workdayWakeTime: string;
  freedayBedtime: string;
  freedayWakeTime: string;
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
        <Clock className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Chronotype Assessment</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Discover your natural circadian rhythm by completing the
        Morningness-Eveningness Questionnaire (MEQ). This scientifically
        validated assessment helps us personalize your jet lag protocols.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-8 text-left">
        <Card>
          <CardContent className="pt-6">
            <Sun className="w-6 h-6 text-amber-500 mb-2" />
            <h3 className="font-medium mb-1">Morning Types</h3>
            <p className="text-sm text-muted-foreground">
              Peak alertness early, prefer earlier bedtimes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Clock className="w-6 h-6 text-blue-500 mb-2" />
            <h3 className="font-medium mb-1">Intermediate</h3>
            <p className="text-sm text-muted-foreground">
              Flexible schedule, moderate preferences
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Moon className="w-6 h-6 text-indigo-500 mb-2" />
            <h3 className="font-medium mb-1">Evening Types</h3>
            <p className="text-sm text-muted-foreground">
              Peak later in day, prefer later bedtimes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mb-8">
        <p className="text-sm text-muted-foreground">
          <strong>Time required:</strong> ~5 minutes
          <br />
          <strong>Questions:</strong> 19 multiple choice
        </p>
      </div>

      <Button size="lg" onClick={onStart}>
        Start Assessment
        <ChevronRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}

function QuestionScreen({
  question,
  questionNumber,
  totalQuestions,
  selectedValue,
  onSelect,
  onNext,
  onPrevious,
}: {
  question: (typeof MEQ_QUESTIONS)[0];
  questionNumber: number;
  totalQuestions: number;
  selectedValue: number | null;
  onSelect: (value: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const progress = ((questionNumber) / totalQuestions) * 100;

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {question.text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={cn(
                'w-full text-left p-4 rounded-lg border transition-all',
                selectedValue === option.value
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    selectedValue === option.value
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}
                >
                  {selectedValue === option.value && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={questionNumber === 1}
        >
          <ChevronLeft className="mr-2 w-4 h-4" />
          Previous
        </Button>
        <Button onClick={onNext} disabled={selectedValue === null}>
          {questionNumber === totalQuestions ? 'Continue' : 'Next'}
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function SleepTimesScreen({
  sleepTimes,
  onChange,
  onNext,
  onPrevious,
}: {
  sleepTimes: SleepTimes;
  onChange: (field: keyof SleepTimes, value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Sleep Schedule</span>
          <span>Almost done!</span>
        </div>
        <Progress value={90} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Sleep Schedule</CardTitle>
          <CardDescription>
            Tell us about your typical sleep times. This helps us estimate your
            circadian markers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Habitual Sleep */}
          <div>
            <h3 className="font-medium mb-3">Habitual Sleep (Average)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  Bedtime
                </label>
                <input
                  type="time"
                  value={sleepTimes.habitualBedtime}
                  onChange={(e) => onChange('habitualBedtime', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  Wake Time
                </label>
                <input
                  type="time"
                  value={sleepTimes.habitualWakeTime}
                  onChange={(e) => onChange('habitualWakeTime', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                />
              </div>
            </div>
          </div>

          {/* Work Days */}
          <div>
            <h3 className="font-medium mb-3">Work/School Days</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  Bedtime
                </label>
                <input
                  type="time"
                  value={sleepTimes.workdayBedtime}
                  onChange={(e) => onChange('workdayBedtime', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  Wake Time
                </label>
                <input
                  type="time"
                  value={sleepTimes.workdayWakeTime}
                  onChange={(e) => onChange('workdayWakeTime', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                />
              </div>
            </div>
          </div>

          {/* Free Days */}
          <div>
            <h3 className="font-medium mb-3">Free Days (Weekends)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  Bedtime
                </label>
                <input
                  type="time"
                  value={sleepTimes.freedayBedtime}
                  onChange={(e) => onChange('freedayBedtime', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  Wake Time
                </label>
                <input
                  type="time"
                  value={sleepTimes.freedayWakeTime}
                  onChange={(e) => onChange('freedayWakeTime', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onPrevious}>
          <ChevronLeft className="mr-2 w-4 h-4" />
          Previous
        </Button>
        <Button onClick={onNext}>
          See Results
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function ResultsScreen({
  meqScore,
  chronotype,
  dlmo,
  cbtmin,
  onSave,
}: {
  meqScore: number;
  chronotype: ChronotypeCategory;
  dlmo: string;
  cbtmin: string;
  onSave: () => void;
}) {
  const chronotypeInfo: Record<
    ChronotypeCategory,
    { icon: React.ElementType; color: string; advice: string }
  > = {
    definite_morning: {
      icon: Sun,
      color: 'text-amber-500 bg-amber-500/10',
      advice:
        'You adapt more easily to eastward travel. Start light exposure early for best results.',
    },
    moderate_morning: {
      icon: Sun,
      color: 'text-orange-500 bg-orange-500/10',
      advice:
        'You have a slight preference for mornings. Early light exposure will help your adjustment.',
    },
    intermediate: {
      icon: Clock,
      color: 'text-blue-500 bg-blue-500/10',
      advice:
        'You are flexible and can adapt in either direction. Follow the protocol timing closely.',
    },
    moderate_evening: {
      icon: Moon,
      color: 'text-indigo-500 bg-indigo-500/10',
      advice:
        'You have a slight preference for evenings. Westward travel may feel easier for you.',
    },
    definite_evening: {
      icon: Moon,
      color: 'text-purple-500 bg-purple-500/10',
      advice:
        'You adapt more easily to westward travel. Evening light exposure works best for you.',
    },
  };

  const info = chronotypeInfo[chronotype];
  const Icon = info.icon;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <div
          className={cn(
            'inline-flex items-center justify-center w-20 h-20 rounded-full mb-4',
            info.color
          )}
        >
          <Icon className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Your Results</h1>
        <p className="text-lg text-muted-foreground">
          {getChronotypeDescription(chronotype)}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{meqScore}</p>
            <p className="text-sm text-muted-foreground">MEQ Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-purple-500">{dlmo}</p>
            <p className="text-sm text-muted-foreground">Estimated DLMO</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-500">{cbtmin}</p>
            <p className="text-sm text-muted-foreground">Estimated CBTmin</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What This Means</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{info.advice}</p>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Key Circadian Markers</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <strong>DLMO (Dim Light Melatonin Onset):</strong> When your
                body starts producing melatonin, typically 2-3 hours before
                sleep.
              </li>
              <li>
                <strong>CBTmin (Core Body Temperature minimum):</strong> The
                lowest point of your body temperature cycle, usually during
                sleep.
              </li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">
            We use these markers to time your light exposure, melatonin, and
            other interventions for maximum effectiveness.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" onClick={onSave}>
          <Check className="mr-2 w-4 h-4" />
          Save & Continue
        </Button>
      </div>
    </div>
  );
}

export default function QuestionnairePage() {
  const router = useRouter();
  const { updateCircadianProfile } = useUserStore();

  const [step, setStep] = useState<QuestionnaireStep>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<MEQResponse[]>([]);
  const [sleepTimes, setSleepTimes] = useState<SleepTimes>({
    habitualBedtime: '23:00',
    habitualWakeTime: '07:00',
    workdayBedtime: '23:00',
    workdayWakeTime: '07:00',
    freedayBedtime: '00:00',
    freedayWakeTime: '09:00',
  });

  // Calculate results
  const meqScore =
    responses.length === 19 ? calculateMEQScore(responses) : null;
  const chronotype = meqScore ? getMEQChronotypeCategory(meqScore) : null;
  const markers =
    meqScore && sleepTimes.habitualBedtime
      ? estimateCircadianMarkers({
          meqScore,
          habitualBedtime: sleepTimes.habitualBedtime,
          habitualWakeTime: sleepTimes.habitualWakeTime,
        })
      : null;

  const handleSelectOption = (value: number) => {
    const existingIndex = responses.findIndex(
      (r) => r.questionId === MEQ_QUESTIONS[currentQuestion].id
    );

    const newResponse: MEQResponse = {
      questionId: MEQ_QUESTIONS[currentQuestion].id,
      selectedValue: value,
      answeredAt: new Date(),
    };

    if (existingIndex >= 0) {
      const newResponses = [...responses];
      newResponses[existingIndex] = newResponse;
      setResponses(newResponses);
    } else {
      setResponses([...responses, newResponse]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < MEQ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep('sleep_times');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      setStep('intro');
    }
  };

  const handleSleepTimeChange = (field: keyof SleepTimes, value: string) => {
    setSleepTimes({ ...sleepTimes, [field]: value });
  };

  const handleSaveProfile = () => {
    if (!meqScore || !chronotype || !markers) return;

    // Calculate sleep duration
    const [bedH, bedM] = sleepTimes.habitualBedtime.split(':').map(Number);
    const [wakeH, wakeM] = sleepTimes.habitualWakeTime.split(':').map(Number);
    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;
    if (wakeMinutes < bedMinutes) wakeMinutes += 24 * 60;
    const sleepDuration = wakeMinutes - bedMinutes;

    const profile: CircadianProfile = {
      meqScore,
      mctqMSFsc: null,
      chronotypeCategory: chronotype,
      estimatedDLMO: markers.dlmo,
      estimatedCBTmin: markers.cbtMin,
      habitualBedtime: sleepTimes.habitualBedtime,
      habitualWakeTime: sleepTimes.habitualWakeTime,
      averageSleepDuration: sleepDuration,
      workdayBedtime: sleepTimes.workdayBedtime,
      workdayWakeTime: sleepTimes.workdayWakeTime,
      freedayBedtime: sleepTimes.freedayBedtime,
      freedayWakeTime: sleepTimes.freedayWakeTime,
      usesAlarmOnFreedays: false,
      lastAssessmentDate: new Date(),
      assessmentMethod: 'MEQ',
    };

    updateCircadianProfile(profile);
    router.push('/dashboard');
  };

  const getCurrentResponse = () => {
    const response = responses.find(
      (r) => r.questionId === MEQ_QUESTIONS[currentQuestion].id
    );
    return response?.selectedValue ?? null;
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {step === 'intro' && <IntroScreen onStart={() => setStep('questions')} />}

      {step === 'questions' && (
        <QuestionScreen
          question={MEQ_QUESTIONS[currentQuestion]}
          questionNumber={currentQuestion + 1}
          totalQuestions={MEQ_QUESTIONS.length}
          selectedValue={getCurrentResponse()}
          onSelect={handleSelectOption}
          onNext={handleNextQuestion}
          onPrevious={handlePreviousQuestion}
        />
      )}

      {step === 'sleep_times' && (
        <SleepTimesScreen
          sleepTimes={sleepTimes}
          onChange={handleSleepTimeChange}
          onNext={() => setStep('results')}
          onPrevious={() => {
            setStep('questions');
            setCurrentQuestion(MEQ_QUESTIONS.length - 1);
          }}
        />
      )}

      {step === 'results' && meqScore && chronotype && markers && (
        <ResultsScreen
          meqScore={meqScore}
          chronotype={chronotype}
          dlmo={markers.dlmo}
          cbtmin={markers.cbtMin}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
