
import { useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';
import { IconSearch } from '@tabler/icons-react';

export default function Topbar() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get('q') || '';

      if (inputValue.trim() !== currentQ) {
        const newParams = new URLSearchParams(searchParams);

        if (inputValue.trim()) {
          newParams.set('q', inputValue.trim());
        } else {
          newParams.delete('q');
        }

        setSearchParams(newParams, { replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  return (
    <header className="h-14 bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-white/10 flex items-center px-5 gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-navy-700 rounded-full px-4 py-2 flex-1 max-w-sm">
        <IconSearch size={15} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="bg-transparent outline-none text-[12.5px] text-gray-700 dark:text-white placeholder:text-gray-400 w-full"
        />
      </div>
    </header>
  );
}