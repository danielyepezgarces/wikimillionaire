"use client"

import type React from "react"
import type { ReactNode } from "react"

interface SafeLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function SafeLink({ href, children, className, onClick }: SafeLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Prevenir el comportamiento predeterminado
    e.preventDefault()

    // Ejecutar onClick si existe
    if (onClick) {
      onClick()
    }

    // Usar window.location para navegación directa
    window.location.href = href
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  )
}
