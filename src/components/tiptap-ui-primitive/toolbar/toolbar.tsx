"use client"

import * as React from "react"
import { Separator } from "@/components/tiptap-ui-primitive/separator"
import "@/components/tiptap-ui-primitive/toolbar/toolbar.scss"

type BaseProps = React.HTMLAttributes<HTMLDivElement>

interface ToolbarProps extends BaseProps {
  variant?: "floating" | "fixed"
}

const mergeRefs = <T,>(
  refs: Array<React.RefObject<T> | React.Ref<T> | null | undefined>
): React.RefCallback<T> => {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.MutableRefObject<T | null>).current = value
      }
    })
  }
}

const useToolbarKeyboardNav = (
  toolbarRef: React.RefObject<HTMLDivElement | null>
): void => {
  React.useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return

    const getFocusableElements = () =>
      Array.from(
        toolbar.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [role="button"]:not([disabled]), [tabindex="0"]:not([disabled])'
        )
      )

    const navigateToIndex = (
      e: KeyboardEvent,
      targetIndex: number,
      elements: HTMLElement[]
    ) => {
      e.preventDefault()
      let nextIndex = targetIndex

      if (nextIndex >= elements.length) {
        nextIndex = 0
      } else if (nextIndex < 0) {
        nextIndex = elements.length - 1
      }

      elements[nextIndex]?.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = getFocusableElements()
      if (!focusableElements.length) return

      const currentElement = document.activeElement as HTMLElement
      const currentIndex = focusableElements.indexOf(currentElement)

      if (!toolbar.contains(currentElement)) return

      const keyActions: Record<string, () => void> = {
        ArrowRight: () =>
          navigateToIndex(e, currentIndex + 1, focusableElements),
        ArrowDown: () =>
          navigateToIndex(e, currentIndex + 1, focusableElements),
        ArrowLeft: () =>
          navigateToIndex(e, currentIndex - 1, focusableElements),
        ArrowUp: () => navigateToIndex(e, currentIndex - 1, focusableElements),
        Home: () => navigateToIndex(e, 0, focusableElements),
        End: () =>
          navigateToIndex(e, focusableElements.length - 1, focusableElements),
      }

      const action = keyActions[e.key]
      if (action) {
        action()
      }
    }

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target)) {
        target.setAttribute("data-focus-visible", "true")
      }
    }

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (toolbar.contains(target)) {
        target.removeAttribute("data-focus-visible")
      }
    }

    toolbar.addEventListener("keydown", handleKeyDown)
    toolbar.addEventListener("focus", handleFocus, true)
    toolbar.addEventListener("blur", handleBlur, true)

    const focusableElements = getFocusableElements()
    focusableElements.forEach((element) => {
      element.addEventListener("focus", handleFocus)
      element.addEventListener("blur", handleBlur)
    })

    return () => {
      toolbar.removeEventListener("keydown", handleKeyDown)
      toolbar.removeEventListener("focus", handleFocus, true)
      toolbar.removeEventListener("blur", handleBlur, true)

      const focusableElements = getFocusableElements()
      focusableElements.forEach((element) => {
        element.removeEventListener("focus", handleFocus)
        element.removeEventListener("blur", handleBlur)
      })
    }
  }, [toolbarRef])
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, variant = "fixed", ...props }, ref) => {
    const toolbarRef = React.useRef<HTMLDivElement>(null)
    useToolbarKeyboardNav(toolbarRef)

    return (
      <div
        ref={mergeRefs([toolbarRef, ref])}
        role="toolbar"
        aria-label="툴바"
        data-variant={variant}
        className={`tiptap-toolbar ${className || ""}`}
        onWheel={(event) => {
          if (!toolbarRef.current) return
          const el = toolbarRef.current
          if (el.scrollWidth <= el.clientWidth) return
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            el.scrollLeft += event.deltaY
            event.preventDefault()
          }
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Toolbar.displayName = "Toolbar"

export const ToolbarGroup = React.forwardRef<HTMLDivElement, BaseProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={`tiptap-toolbar-group ${className || ""}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ToolbarGroup.displayName = "ToolbarGroup"

export const ToolbarSeparator = React.forwardRef<HTMLDivElement, BaseProps>(
  ({ ...props }, ref) => {
    return (
      <Separator
        ref={ref}
        orientation="vertical"
        decorative
        {...props}
      />
    )
  }
)

ToolbarSeparator.displayName = "ToolbarSeparator"
