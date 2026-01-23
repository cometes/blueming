"use client"

import { Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { YoutubeNodeView } from "@/components/tiptap-extension/youtube-node-view"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtube: {
      setYoutubeVideo: (options: { src: string; width?: number; height?: number }) => ReturnType
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
        default: 640,
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
        (options: { src: string; width?: number; height?: number }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              width: options.width || 640,
              height: options.height || 480,
            },
          })
        },
    }
  },
})

export default CustomYoutubeNode
