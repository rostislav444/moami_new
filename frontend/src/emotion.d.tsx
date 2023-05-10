import '@emotion/react'

declare module '@emotion/react' {
  export interface Theme {
    colors: {
        background: string
    }
    color: {
      primary: string
      grey: string
      positive: string
      negative: string
    }
  }
}

