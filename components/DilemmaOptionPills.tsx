interface Props {
  optionA: string
  optionB: string
}

function shortOption(text: string): string {
  return text.split('.')[0]
}

export default function DilemmaOptionPills({ optionA, optionB }: Props) {
  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
      <span
        className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-3 py-1"
        title={optionA}
      >
        {shortOption(optionA)}
      </span>
      <span
        className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1"
        title={optionB}
      >
        {shortOption(optionB)}
      </span>
    </div>
  )
}
