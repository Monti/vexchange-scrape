import BigNumber from 'bignumber.js'

import marketABI from '../abi/exchange.json'

BigNumber.config({ DECIMAL_PLACES: 0 })

const TEN_MINUTES = 10 * 60
const ALLOWED_DEVIATION_FACTOR = 0.97

const scrapeToken = ({
  expectedBoughtTokens,
  expectedEthTokens,
  marketAddress,
  sender,
  tokenToScrape,
  web3,
}) => {
  const marketContract = new web3.eth.Contract(marketABI, marketAddress)

  const now = Math.round(Date.now() / 1000)
  const deadline = now + TEN_MINUTES
  const minTokensBought = new BigNumber(expectedBoughtTokens)
    .times(ALLOWED_DEVIATION_FACTOR)
    .toString(10)
  const minEthBought = new BigNumber(expectedEthTokens)
    .times(ALLOWED_DEVIATION_FACTOR)
    .toString(10)

  return marketContract.methods
    .token_scrape(tokenToScrape, minTokensBought, minEthBought, deadline)
    .send({ gas: 250000, gasPriceCoef: 0, from: sender })
}

export default scrapeToken
