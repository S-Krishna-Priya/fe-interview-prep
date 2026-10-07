import { STEPS, type StepId } from './types.ts'

type StepIndicatorProps = {
  current: StepId
}

const BADGE = {
  done: 'bg-gray-900 text-white',
  current: 'border-2 border-gray-900 text-gray-900',
  upcoming: 'border border-gray-300 text-gray-500',
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === current)

  return (
    <ol aria-label="Progress" className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {STEPS.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'
        return (
          <li
            key={step.id}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${BADGE[state]}`}
            >
              {state === 'done' ? '✓' : index + 1}
            </span>
            <span className="sr-only">
              Step {index + 1}
              {state === 'done' ? ', completed' : ''}:
            </span>
            <span className={state === 'current' ? 'font-medium text-gray-900' : 'text-gray-600'}>
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
