import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, mainnet, WagmiConfig } from "wagmi";

import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { bsc, bscTestnet, goerli } from 'wagmi/chains'

export const { chains, provider } = configureChains(
	[goerli, bscTestnet, mainnet, bsc],
	[
		alchemyProvider({ alchemyId: process.env.REACT_APP_ALCHEMY_API_KEY }),
		publicProvider(),
	]
);

const { connectors } = getDefaultWallets({
	appName: "Auto Payments",
	chains,
});

export const wagmiClient = createClient({
	autoConnect: true,
	connectors,
	provider,
});

export { WagmiConfig, RainbowKitProvider };