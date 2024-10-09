import { Fade, ThemeProvider, styled } from '@mui/material';
import { Layout } from 'components/layout/Layout';
import { useAppSlice } from 'hooks/selector';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import { MaterialDesignContent, SnackbarProvider } from 'notistack';
import { ReactElement, ReactNode, useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { store } from 'redux/store';
import 'styles/globals.css';
import { theme } from 'styles/material-ui-theme';
import { SnackbarUtilsConfigurator } from 'utils/snackbarUtils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CaipNetwork, createAppKit } from '@reown/appkit/react';

import { WagmiProvider } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const resizeListener = () => {
    // 1rem:100px
    let designSize = 1280;
    let html = document.documentElement;
    let clientW = html.clientWidth;
    let htmlRem = (clientW * 100) / designSize;
    html.style.fontSize = Math.min(htmlRem, 100) + 'px';
  };

  useEffect(() => {
    window.addEventListener('resize', resizeListener);
    resizeListener();

    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  return (
    <Provider store={store}>
      <MyAppWrapper Component={Component} pageProps={pageProps} />
    </Provider>
  );
}

export default MyApp;

const queryClient = new QueryClient();

// 1. Get projectId from https://cloud.reown.com
const projectId = '773e240347e5c760d1cc49e512d0d86c';

// 2. Create a metadata object - optional
const metadata = {
  name: 'Vouch',
  description: 'Vouch Validator App',
  url: 'https://val.vouch.run', // origin must match your domain & subdomain
  icons: ['https://val.vouch.run/_next/static/media/appIconDark.3c9ae27e.svg'],
};

const networks = [
  {
    id: 'eip155:943',
    chainId: 943,
    chainNamespace: 'eip155',
    name: 'Pulsechain Testnet V4',
    currency: 'tPLS',
    explorerUrl: 'https://scan.v4.testnet.pulsechain.com',
    rpcUrl: 'https://rpc.v4.testnet.pulsechain.com',
    network: 'testnet',
    imageUrl: 'https://avatars.githubusercontent.com/u/179229932',
  } as unknown as CaipNetwork,
];

// 3. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  networks,
  projectId,
});

// 4. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  metadata,
  projectId,
  featuredWalletIds: [
    'd69877e50c4aa2360d723065716609f1e2698e45fc210438da8c325b65922735',
  ],
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: false, // default to true
    socials: [],
    emailShowWallets: false, // default to true
    swaps: false,
    onramp: false,
  },
});

const MyAppWrapper = ({ Component, pageProps }: any) => {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page: any) => page);

  const { darkMode } = useAppSlice();

  const StyledMaterialDesignContent = useMemo(() => {
    const successBg = darkMode ? '#5A5DE0' : '#E8EFFD';
    const successTextColor = darkMode ? '#E8EFFD' : '#1B1B1F';

    return styled(MaterialDesignContent)(() => ({
      '&.notistack-MuiContent-success': {
        backgroundColor: successBg,
        color: successTextColor,
        fontSize: '.16rem',
      },
      '&.notistack-MuiContent-error': {
        backgroundColor: 'rgba(255,82,196, 0.9) !important',
        color: '#ffffff',
        fontSize: '.16rem',
      },
      '&.notistack-MuiContent-warning': {
        backgroundColor: 'rgba(255, 204, 0, 0.9) !important',
        color: '#ffffff',
        fontSize: '.16rem',
      },
    }));
  }, [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider
        maxSnack={1}
        autoHideDuration={3000}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        TransitionComponent={Fade as React.ComponentType}
        Components={{
          success: StyledMaterialDesignContent,
          error: StyledMaterialDesignContent,
          warning: StyledMaterialDesignContent,
        }}
      >
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <SnackbarUtilsConfigurator />
            <Layout>{getLayout(<Component {...pageProps} />)}</Layout>
          </QueryClientProvider>
        </WagmiProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};
