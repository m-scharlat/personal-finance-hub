interface Props {
  text: string
  align?: 'left' | 'right'  // which side of the icon the tooltip appears on
}

export default function InfoTooltip({ text, align = 'left' }: Props) {
  return (
    <span
      className="relative inline-flex items-center group/tip"
      onClick={e => e.stopPropagation()}
    >
      <span className="text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors cursor-default">
        <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      </span>
      <span className={`
        pointer-events-none absolute z-50 top-5 w-52
        ${align === 'left' ? 'right-0' : 'left-0'}
        rounded-lg border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900 shadow-lg
        px-3 py-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap
        opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150
      `}>
        {text}
      </span>
    </span>
  )
}
