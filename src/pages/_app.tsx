import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { NextUIProvider } from '@nextui-org/react';
import { SSRProvider } from "@react-aria/ssr";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SSRProvider>
      <NextUIProvider>
        <Component {...pageProps} />
      </NextUIProvider>  
    </SSRProvider>
  )
}
