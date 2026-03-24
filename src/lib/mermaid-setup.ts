import mermaid from 'mermaid'
import zenuml from '@mermaid-js/mermaid-zenuml'
import elkLayouts from '@mermaid-js/layout-elk'

export async function initMermaid() {
  await mermaid.registerExternalDiagrams([zenuml])
  mermaid.registerLayoutLoaders(elkLayouts)
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  })
}
