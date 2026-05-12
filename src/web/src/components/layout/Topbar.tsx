import { IconBell, IconSun, IconMoon, IconSearch } from '@tabler/icons-react'
import { useThemeStore } from '../../store/useThemeStore'
import { useAuthStore } from '../../store/useAuthStore'

export default function Topbar() {
  const { isDark, toggle } = useThemeStore()
  const { user } = useAuthStore()

  return (
    <header className="h-14 bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-white/10 flex items-center px-5 gap-4 flex-shrink-0">
      
      
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-navy-700 rounded-full px-4 py-2 flex-1 max-w-sm">
        <IconSearch size={15} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none text-[12.5px] text-gray-700 dark:text-white placeholder:text-gray-400 w-full"
        />
      </div>

      
      <div className="ml-auto flex items-center gap-4">

        
        <button
          className="relative text-gray-500 dark:text-white/70 hover:text-gray-800 dark:hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <IconBell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00aaff] rounded-full text-[9px] text-white font-bold flex items-center justify-center">
            3
          </span>
        </button>

        
        <button
          onClick={toggle}
          className="text-gray-500 dark:text-white/70 hover:text-gray-800 dark:hover:text-white transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </button>

      </div>
    </header>
  )
}