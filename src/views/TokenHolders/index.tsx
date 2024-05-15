import { useCallback, useEffect, useState } from "react";
import TokenUtils from "../../modules/tokenUtils";
import { GridLoader } from "react-spinners";
import { Link } from "react-router-dom";
import { Holder, MarketingInfo, TokenInfo } from "../../types";
import { useSearchParams } from 'react-router-dom';
import ConnectKeplr from "../../components/App/ConnectKeplr";
import { useSelector } from "react-redux";
import IPFSImage from "../../components/App/IpfsImage";
import { WALLET_LABELS } from "../../constants/walletLabels";
import TokenSelect from "../../components/Inputs/TokenSelect";
import { TOKENS } from "../../constants/contractAddresses";


const TokenHolders = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const currentNetwork = useSelector(state => state.network.currentNetwork);
    const networkConfig = useSelector(state => state.network.networks[currentNetwork]);

    const [contractAddress, setContractAddress] = useState(
        searchParams.get("address") ?? TOKENS[0]
    );


    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
    const [pairMarketing, setPairMarketing] = useState<MarketingInfo | null>(null);

    const [holders, setHolders] = useState<Holder[]>([]);

    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState("");
    const [error, setError] = useState(null)

    const [lastLoadedAddress, setLastLoadedAddress] = useState("")

    const setAddress = useCallback(() => {
        setSearchParams({
            address: contractAddress.value
        })
    }, [setSearchParams, contractAddress])

    useEffect(() => {
        setLastLoadedAddress("")
    }, [networkConfig])

    const getTokenHolders = useCallback((address: string) => {
        const module = new TokenUtils(networkConfig)
        setError(null)
        setTokenInfo(null)
        setPairMarketing(null)
        setLoading(true);
        setProgress("")
        setHolders([]);

        if (
            address.includes("factory") ||
            address.includes("peggy") ||
            address.includes("ibc")
        ) {
            module
                .getDenomMetadata(address)
                .then((r) => {
                    setTokenInfo(r);
                })
                .catch((e: unknown) => {
                    console.log(e);
                    setLoading(false);
                    if (e && e.message) {
                        setError(e.message)
                    }
                });
        } else {
            module
                .getTokenInfo(address)
                .then((r) => {
                    setTokenInfo({
                        ...r,
                        denom: address
                    });
                })
                .catch((e: unknown) => {
                    console.log(e);
                    setLoading(false);
                    if (e && e.message) {
                        setError(e.message)
                    }
                });
            module.getTokenMarketing(address).then(r => {
                setPairMarketing(r)
            }).catch(e => {
                console.log(e)
                setLoading(false);
                if (e && e.message) {
                    setError(e.message)
                }
            })
        }

        if (
            address.includes("factory") ||
            address.includes("peggy") ||
            address.includes("ibc")
        ) {
            module.getTokenFactoryTokenHolders(address, setProgress).then(r => {
                if (r) setHolders(r);
                setLoading(false);
            }).catch(e => {
                console.log(e)
                setLoading(false);
                if (e && e.message) {
                    setError(e.message)
                }
            })
        }
        else {
            console.log("get holders")
            module
                .getCW20TokenHolders(address, setProgress)
                .then((r: Holder[]) => {
                    setHolders(r);
                    setLoading(false);
                })
                .catch((e: unknown) => {
                    console.log(e);
                    setLoading(false);
                    if (e && e.message) {
                        setError(e.message)
                    }
                });

        }
        setLastLoadedAddress(address)

    }, [networkConfig]);

    useEffect(() => {
        const address = searchParams.get("address")
        if (address && address !== lastLoadedAddress) {
            getTokenHolders(address)
            setContractAddress(address => TOKENS.find(v => v.value == address) ?? address)
        }
    }, [searchParams, lastLoadedAddress, getTokenHolders])

    return (
        <div className="flex flex-col min-h-screen pb-10">
            <header className="flex flex-row bg-gray-800 text-white shadow-md fixed top-0 left-0 right-0 z-10">
                <div className="container mx-auto flex items-center p-2 text-sm md:text-sm">
                    <Link to="/" className="font-bold hover:underline mx-5">
                        home
                    </Link>

                    <Link
                        to="/token-liquidity?address=inj1m35kyjuegq7ruwgx787xm53e5wfwu6n5uadurl"
                        className="font-bold hover:underline mr-5"
                    >
                        liquidity tool
                    </Link>
                    <Link
                        to="/manage-tokens"
                        className="font-bold hover:underline "
                    >
                        manage tokens
                    </Link>
                </div>
                <div className="m-2">
                    <ConnectKeplr />
                </div>
            </header>

            <div className="pt-14 flex-grow mx-2 pb-20">
                <div className="flex justify-center items-center min-h-full">
                    <div className="w-full max-w-screen-lg px-2 py-10">
                        <div className="text-center text-white">
                            <div className="text-xl">
                                Get cw20 / token factory token holders
                            </div>
                            <div className="text-xs">on Injective main net</div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <label
                                htmlFor="token-address"
                                className="block text-white"
                            >
                                Token address
                            </label>
                            <TokenSelect
                                options={TOKENS}
                                selectedOption={contractAddress}
                                setSelectedOption={setContractAddress}
                            />
                        </div>

                        <button
                            disabled={loading}
                            onClick={setAddress}
                            className="mt-5 bg-gray-800 rounded-lg p-2 w-full text-white border border-slate-800 shadow-lg font-bold"
                        >
                            Get token holders
                        </button>
                        {error && <div className="text-red-500 mt-2">
                            {error}
                        </div>
                        }

                        <div className="flex flex-col md:flex-row justify-between text-sm">
                            {tokenInfo && (
                                <div className="mt-5 text-white">
                                    <div className="font-bold">denom: {tokenInfo.denom}</div>
                                    <div>name: {tokenInfo.name}</div>
                                    <div>symbol: {tokenInfo.symbol}</div>
                                    <div>decimals: {tokenInfo.decimals}</div>
                                    {tokenInfo.description && <div>description: {tokenInfo.description}</div>}
                                    {tokenInfo.total_supply && (
                                        <div>
                                            total supply:{" "}
                                            {tokenInfo.total_supply /
                                                Math.pow(10, tokenInfo.decimals)}
                                        </div>
                                    )}
                                </div>
                            )}
                            {!pairMarketing && tokenInfo && tokenInfo.logo && (
                                <div className="mt-5 text-sm text-white">
                                    <IPFSImage
                                        width={100}
                                        className={'mb-2 rounded-lg'}
                                        ipfsPath={tokenInfo.logo}
                                    />
                                    <a href={`https://${currentNetwork == 'testnet' ? 'testnet.' : ''}explorer.injective.network/account/${tokenInfo.admin}`}>
                                        admin: {tokenInfo.admin.slice(0, 5) + '...' + tokenInfo.admin.slice(-5)}
                                        {
                                            WALLET_LABELS[tokenInfo.admin] ? (
                                                <span className={`${WALLET_LABELS[tokenInfo.admin].bgColor} ${WALLET_LABELS[tokenInfo.admin].textColor} ml-2`}>
                                                    {WALLET_LABELS[tokenInfo.admin].label}
                                                </span>
                                            ) : null
                                        }
                                    </a>
                                </div>
                            )}
                            {pairMarketing && pairMarketing.logo && (
                                <div className="mt-5 text-sm text-white">
                                    <img
                                        src={pairMarketing.logo.url}
                                        style={{ width: 50, height: 50 }}
                                        className="mb-2"
                                        alt="logo"
                                    />
                                    <div>project: {pairMarketing.project}</div>
                                    <div>description: {pairMarketing.description}</div>
                                    <div>
                                        marketing: {pairMarketing.marketing}
                                        {
                                            WALLET_LABELS[pairMarketing.marketing] ? (
                                                <span className={`${WALLET_LABELS[pairMarketing.marketing].bgColor} ${WALLET_LABELS[pairMarketing.marketing].textColor} ml-2`}>
                                                    {WALLET_LABELS[pairMarketing.marketing].label}
                                                </span>
                                            ) : null
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        {loading && (
                            <div className="flex flex-col items-center justify-center pt-5">
                                <GridLoader color="#36d7b7" />
                                {progress.length > 0 &&
                                    <div className="mt-2">
                                        {progress}
                                    </div>
                                }
                            </div>
                        )}

                        {holders.length > 0 && (
                            <div className="mt-5 text-sm">
                                <div>Total token holders: {holders.length}</div>
                                <div className="overflow-x-auto mt-2">
                                    <table className="table-auto w-full">
                                        <thead className="text-white">
                                            <tr>
                                                <th className="px-4 py-2">
                                                    Address
                                                </th>
                                                <th className="px-4 py-2">
                                                    Balance
                                                </th>
                                                <th className="px-4 py-2">
                                                    Percentage
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {holders
                                                .filter(
                                                    (holder) =>
                                                        Number(
                                                            holder.balance
                                                        ) !== 0
                                                )
                                                .map((holder, index) => (
                                                    <tr
                                                        key={index}
                                                        className="text-white border-b"
                                                    >
                                                        <td className="px-6 py-1 whitespace-nowrap">
                                                            <a
                                                                className="hover:text-indigo-900"
                                                                href={`https://explorer.injective.network/account/${holder.address}`}
                                                            >
                                                                {holder.address}
                                                            </a>

                                                            {
                                                                WALLET_LABELS[holder.address] ? (
                                                                    <span className={`${WALLET_LABELS[holder.address].bgColor} ${WALLET_LABELS[holder.address].textColor} ml-2`}>
                                                                        {WALLET_LABELS[holder.address].label}
                                                                    </span>
                                                                ) : null
                                                            }
                                                            {holder.address ==
                                                                lastLoadedAddress && (
                                                                    <span className="text-red-500 ml-2">
                                                                        {" "}
                                                                        token contract 🔥
                                                                    </span>
                                                                )}
                                                        </td>
                                                        <td className="px-6 py-1">
                                                            {holder.balance}{" "}
                                                            {tokenInfo?.symbol}
                                                        </td>
                                                        <td className="px-6 py-1">
                                                            {
                                                                holder.percentageHeld.toFixed(2)
                                                            }
                                                            %
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="bg-gray-800 text-white text-xs p-4 fixed bottom-0 left-0 right-0">
                buy me a coffee: inj1q2m26a7jdzjyfdn545vqsude3zwwtfrdap5jgz
            </footer>
        </div>
    );
};

export default TokenHolders;
