import marketABI from '../abi/exchange.json'
import tokenABI from '../abi/token.json'
import factoryABI from '../abi/factory.json'

import { FACTORY_ADDRESS_MAINNET, FACTORY_ADDRESS_TESTNET } from './config'

const getFactoryContract = async web3 => {
  const chainTagHex = await web3.eth.getChainTag()
  const chainTag = parseInt(chainTagHex, 16)
  const factoryAddress =
    chainTag === 74 ? FACTORY_ADDRESS_MAINNET : FACTORY_ADDRESS_TESTNET

  const factoryContract = new web3.eth.Contract(factoryABI, factoryAddress)

  return factoryContract
}

const getAllTokens = async web3 => {
  const factoryContract = await getFactoryContract(web3)
  const tokenCount = parseInt(await factoryContract.methods.tokenCount().call())

  const vexchangeTokensPromises = []

  for (let tokenId = 1; tokenId <= tokenCount; tokenId++) {
    vexchangeTokensPromises.push(
      factoryContract.methods.getTokenWithId(tokenId).call()
    )
  }

  return Promise.all(vexchangeTokensPromises)
}

const getAllMarkets = async ({ tokenAddresses, web3 }) => {
  const factoryContract = await getFactoryContract(web3)
  const vexchangeMarketsPromises = []

  tokenAddresses.forEach(tokenAddress => {
    vexchangeMarketsPromises.push(
      factoryContract.methods.getExchange(tokenAddress).call()
    )
  })

  return Promise.all(vexchangeMarketsPromises)
}

const getTokenDetails = ({ marketAddress, tokenAddress, web3 }) => {
  const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress)

  const tokenBalance = tokenContract.methods.balanceOf(marketAddress).call()
  const decimals = tokenContract.methods.decimals().call()
  const symbol = tokenContract.methods.symbol().call()

  return Promise.all([
    Promise.resolve(tokenAddress),
    tokenBalance,
    decimals,
    symbol,
  ])
}

const fetchExpectedSellPrices = async ({
  factoryContract,
  marketContract,
  tokenDetails,
  web3,
}) => {
  const [tokenAddress, tokenBalance] = tokenDetails

  if (parseInt(tokenBalance) === 0) return Promise.resolve(tokenDetails)

  const marketAddressForToken = await factoryContract.methods
    .getExchange(tokenAddress)
    .call()
  const marketContractForToken = new web3.eth.Contract(
    marketABI,
    marketAddressForToken
  )

  const expectedBoughtEth = await marketContractForToken.methods
    .getTokenToEthInputPrice(tokenBalance)
    .call()

  const minEthBought = 1
  const minTokensBought = 1
  const tenMinutes = 10 * 60
  const deadline = Math.round(Date.now() / 1000) + tenMinutes

  const expectedBoughtTokens = await marketContract.methods
    .token_scrape(tokenAddress, minEthBought, minTokensBought, deadline)
    .call()

  return Promise.resolve([
    ...tokenDetails,
    expectedBoughtEth,
    expectedBoughtTokens,
  ])
}

const getAllScrapableTokens = async ({
  marketAddress,
  tokenAddresses,
  web3,
}) => {
  const factoryContract = await getFactoryContract(web3)

  const marketContract = new web3.eth.Contract(marketABI, marketAddress)
  const tokenAddressForMarket = await factoryContract.methods
    .getToken(marketAddress)
    .call()

  const tokensToBalances = { marketAddress }

  const scrapableTokensPromises = []

  tokenAddresses.forEach(tokenAddress => {
    if (tokenAddress === tokenAddressForMarket) {
      return
    }

    scrapableTokensPromises.push(
      getTokenDetails({ marketAddress, tokenAddress, web3 }).then(
        tokenDetails =>
          fetchExpectedSellPrices({
            factoryContract,
            marketContract,
            tokenDetails,
            web3,
          })
      )
    )
  })

  tokensToBalances.scrapableTokens = await Promise.all(scrapableTokensPromises)

  return tokensToBalances
}

const getAllMarketsAndTokens = async web3 => {
  const tokenAddresses = await getAllTokens(web3)
  const markets = await getAllMarkets({ tokenAddresses, web3 })

  const marketBalancesPromises = []

  markets.forEach(marketAddress => {
    marketBalancesPromises.push(
      getAllScrapableTokens({ marketAddress, tokenAddresses, web3 })
    )
  })

  return Promise.all(marketBalancesPromises)
}

export default getAllMarketsAndTokens
