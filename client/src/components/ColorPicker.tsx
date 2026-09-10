const PRESETS = [
  '#0071e3',
  '#34c759',
  '#ff9500',
  '#af52de',
  '#ff2d55',
  '#00c7be',
  '#ffcc00',
  '#8e8e93',
  '#5856d6',
  '#ff6b22',
]

interface Props {
  value: string
  onChange: (c: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full transition ${
            value.toLowerCase() === c ? 'ring-2 ring-offset-2 dark:ring-offset-[#2c2c2e] ring-[#0071e3]' : ''
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <label
        className="relative w-7 h-7 rounded-full cursor-pointer ring-1 ring-black/10 dark:ring-white/10"
        style={{
          background:
            'conic-gradient(#ff2d55,#ff9500,#ffcc00,#34c759,#00c7be,#0071e3,#af52de,#ff2d55)',
        }}
        title="自定义颜色"
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  )
}
