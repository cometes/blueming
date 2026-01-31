"use client"

import { Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { YoutubeNodeView } from "@/components/tiptap-extension/youtube-node-view"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtube: {
      setYoutubeVideo: (options: { src: string; width?: number | string; height?: number }) => ReturnType
    }
  }
}

export const CustomYoutubeNode = Node.create({
  name: "youtube",
  group: "block",
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: "100%",
        parseHTML: element => {
          const width = element.getAttribute("width")
          if (!width) return null
          if (width.trim().endsWith("%")) return width.trim()
          const parsed = parseInt(width, 10)
          return Number.isNaN(parsed) ? null : parsed
        },
        renderHTML: attributes => {
          if (!attributes.width) return {}
          return { width: String(attributes.width) }
        },
      },
      height: {
        default: 480,
      },
      'data-align': {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align') || 'left',
        renderHTML: attributes => {
          return {
            'data-align': attributes['data-align'],
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video]',
      },
      {
        tag: 'img[data-youtube-thumbnail]',
        priority: 100,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-youtube-video": "true", ...HTMLAttributes },
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeNodeView)
  },

  addCommands() {
    return {
      setYoutubeVideo:
        (options: { src: string; width?: number | string; height?: number }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              width: options.width || "100%",
              height: options.height || 480,
            },
          })
        },
    }
  },
})

export default CustomYoutubeNode
