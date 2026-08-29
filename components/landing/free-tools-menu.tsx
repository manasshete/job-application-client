'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FREE_TOOLS } from '@/lib/tools'
import { ToolIcon } from '@/components/tools/tool-icon'

/**
 * FreeToolsMenu — the "Free Tools" nav dropdown.
 * Lists every tool from the registry so nav + pages never drift.
 */
export function FreeToolsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm text-[#9aa0ac] outline-none transition-colors hover:text-white data-[state=open]:text-white">
        Free tools
        <ChevronDown className="h-3.5 w-3.5 transition-transform data-[state=open]:rotate-180" style={{ color: 'oklch(0.78 0.14 250)' }} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80 rounded-2xl border-white/10 p-2 text-[#f3f4f6] backdrop-blur-xl"
        style={{ background: 'rgba(14,16,21,.97)', boxShadow: '0 34px 70px -30px rgba(0,0,0,.9)' }}
      >
        <DropdownMenuLabel className="px-3 py-2 font-mono text-[10.5px] font-normal uppercase tracking-[0.06em] text-[#767d8b]">
          Free · No sign-up needed
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {FREE_TOOLS.map((tool) => (
          <DropdownMenuItem key={tool.slug} asChild className="rounded-xl p-0 focus:bg-white/10">
            <Link href={`/tools/${tool.slug}`} className="flex items-start gap-3 px-3 py-2.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'oklch(0.72 0.16 250 / .14)', color: 'oklch(0.86 0.1 250)' }}>
                <ToolIcon name={tool.icon} className="h-4.5 w-4.5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[13.5px] font-semibold text-[#f3f4f6]">{tool.title}</span>
                <span className="text-xs leading-snug text-[#767d8b]">{tool.description}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem asChild className="rounded-xl focus:bg-white/10">
          <Link href="/tools" className="px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: 'oklch(0.78 0.14 250)' }}>
            All free tools →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
