import marketABI from '../abi/exchange.json'

const TEN_MINUTES = 10 * 60
const ALLOWED_DEVIATION_FACTOR = 0.97

export default function({
  expectedBoughtTokens,
  expectedEthTokens,
  marketAddress,
  sender,
  tokenToScrape,
  web3,
}) {
  const marketContract = new web3.eth.Contract(marketABI, marketAddress)

  const now = Math.round(Date.now() / 1000)
  const deadline = now + TEN_MINUTES
  const minTokensBought = Math.round(
    parseInt(expectedBoughtTokens) * ALLOWED_DEVIATION_FACTOR
  ).toString()
  const minEthBought = Math.round(
    parseInt(expectedEthTokens) * ALLOWED_DEVIATION_FACTOR
  ).toString()

  console.log({ tokenToScrape, minTokensBought, minEthBought, deadline })

  return marketContract.methods
    .token_scrape(tokenToScrape, minTokensBought, minEthBought, deadline)
    .send({ gas: 250000, gasPriceCoef: 0, from: sender })
}
