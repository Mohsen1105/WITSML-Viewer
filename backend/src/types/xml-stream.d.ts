declare module 'xml-stream' {
  import { Readable } from 'stream'
  import { EventEmitter } from 'events'

  interface XmlStreamOptions {
    preserveMarkup?: number
    trim?: boolean
    normalize?: boolean
    lowercase?: boolean
  }

  class XmlStream extends EventEmitter {
    constructor(stream: Readable, options?: XmlStreamOptions)
    collect(element: string): void
    on(event: string, callback: (item: any) => void): this
    on(event: 'end', callback: () => void): this
    on(event: 'error', callback: (error: Error) => void): this
  }

  export = XmlStream
}
