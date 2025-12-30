"use client"

import { Image } from "@tiptap/extension-image"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageNodeView } from "@/components/tiptap-extension/image-node-view"

export const CustomImage = Image.extend({
  name: "image",

  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      'data-align': {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align') || 'left',
        renderHTML: attributes => {
          return {
            'data-align': attributes['data-align'],
          }
        },
      },
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('width')
          return width ? parseInt(width, 10) : null
        },
        renderHTML: attributes => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: String(attributes.width),
          }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})

export default CustomImage
