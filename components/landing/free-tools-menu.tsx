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
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-slate-600 outline-none transition-colors hover:text-slate-900 data-[state=open]:text-slate-900">
        Free Tools
        <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 rounded-xl p-2">
        <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Free · No sign-up needed
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {FREE_TOOLS.map((tool) => (
          <DropdownMenuItem key={tool.slug} asChild className="rounded-lg p-0">
            <Link href={`/tools/${tool.slug}`} className="flex items-start gap-3 px-3 py-2.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ToolIcon name={tool.icon} className="h-4.5 w-4.5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-slate-900">{tool.title}</span>
                <span className="text-xs leading-snug text-slate-500">{tool.description}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-lg">
          <Link href="/tools" className="px-3 py-2 text-sm font-medium text-blue-600">
            View all free tools
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
