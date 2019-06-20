import React, { Component } from 'react'

import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Loader from 'react-loader-spinner'
import Row from 'react-bootstrap/Row'

import DismissableAlert from './ui/DismissableAlert'
import MarketDropdown from './marketDropdown/MarketDropdown'

import getWeb3 from './utils/getWeb3'
import getAllMarketsAndTokens from './utils/getAllMarketsAndTokens'
import scrapeToken from './utils/scrapeToken'

import './App.css'

class App extends Component {
  state = {
    alertMessage: '',
    allMarkets: [{ marketAddress: 'Loading markets...' }],
    isLoading: true,
    isShowingAlert: false,
    isWaitingForTransaction: false,
    selectedMarket: null,
    selectedToken: null,
    scrapableTokens: null,
    web3: null,
  }

  constructor(props, context) {
    super(props, context)

    this._loadMarkets = this._loadMarkets.bind(this)
    this._setMarket = this._setMarket.bind(this)
    this._setToken = this._setToken.bind(this)
    this._hideAlert = this._hideAlert.bind(this)
    this._scrapeToken = this._scrapeToken.bind(this)
    this._onHideEmptyBalancesCheckboxClick = this._onHideEmptyBalancesCheckboxClick.bind(
      this
    )
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3()
      const chainTagHex = await web3.eth.getChainTag()
      const chainTag = parseInt(chainTagHex, 16)

      if (chainTag !== 74 && chainTag !== 39)
        throw Error('Please change to mainnet or testnet in Comet!')

      const allMarkets = await getAllMarketsAndTokens(web3)

      this.setState({
        allMarkets,
        web3,
        isLoading: false,
        isMainnet: chainTag === 74,
      })
    } catch (error) {
      alert(`Failed to load web3 or markets. Check console for details.`)
      console.error(error)
    }
  }

  render() {
    return (
      <div className="App">
        <Container>
          {this.state.isShowingAlert && (
            <DismissableAlert
              message={this.state.alertMessage}
              onClose={this._hideAlert}
              type={
                Array.isArray(this.state.alertMessage) ? 'danger' : 'success'
              }
            />
          )}
          <Row className="top-buffer">
            <Col>
              <h3> Market Addresses </h3>
              <MarketDropdown
                menuItems={this.state.allMarkets.map(
                  balance => balance.marketAddress
                )}
                onClick={this._setMarket}
                activeElement={this.state.selectedMarket}
              />
            </Col>
          </Row>
          <Row className="top-buffer">
            <Col>
              {this.state.scrapableTokens && (
                <div>
                  <h3> Available Tokens </h3>
                  <MarketDropdown
                    menuItems={this.state.scrapableTokens.displayValues}
                    onClick={this._setToken}
                    values={this.state.scrapableTokens.values}
                    activeElement={this.state.selectedToken}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Hide empty balances"
                    onClick={this._onHideEmptyBalancesCheckboxClick}
                  />
                </div>
              )}
            </Col>
          </Row>
          {this.state.selectedToken && (
            <Row className="top-buffer">
              <Col>
                <div>
                  <h3> Scrape Token </h3>
                  <Button variant="primary" onClick={this._scrapeToken}>
                    Scrape tokens
                  </Button>
                </div>
              </Col>
            </Row>
          )}
          {this.state.isWaitingForTransaction && (
            <Row className="top-buffer">
              <Col>
                <Loader type="Oval" color="#013ea0" height={80} width={80} />
              </Col>
            </Row>
          )}
        </Container>
      </div>
    )
  }

  _hideAlert() {
    this.setState({ isShowingAlert: false })
  }

  async _scrapeToken() {
    const {
      allMarkets,
      isMainnet,
      selectedMarket,
      selectedToken,
      web3,
    } = this.state

    const marketAddress = selectedMarket
    const { scrapableTokens } = allMarkets.filter(
      market => market.marketAddress === marketAddress
    )[0]

    const emptyTokens = []
    scrapableTokens.forEach(([address, balance]) => {
      if (balance === '0') emptyTokens.push(address)
    })

    if (emptyTokens.includes(selectedToken)) {
      this.setState({
        isShowingAlert: true,
        alertMessage: 'Token balance is empty!',
      })
      return
    }

    this.setState({ isWaitingForTransaction: true })

    const [cometAccount] = await window.thor.enable()

    try {
      const result = await scrapeToken({
        web3,
        sender: cometAccount,
        tokenToScrape: selectedToken,
        expectedEthTokens: scrapableTokens[0][4],
        expectedBoughtTokens: scrapableTokens[0][5],
        marketAddress,
      })

      console.log({ result })

      this.setState({
        allMarkets: [{ marketAddress: 'Refreshing markets...' }],
        isShowingAlert: true,
        isLoading: true,
        isWaitingForTransaction: false,
        alertMessage:
          result.status === '0x0' ? (
            'Token balance is too low!'
          ) : (
            <span>
              Token scrape was successful, see{' '}
              <a
                href={`https://${
                  isMainnet ? '' : 'testnet.'
                }veforge.com/transactions/${result.transactionHash}`}
              >
                Veforge
              </a>{' '}
              for more details.
            </span>
          ),
      })

      setTimeout(this._loadMarkets, 50000)
    } catch (error) {
      console.log({ error })
      this.setState({ isWaitingForTransaction: false })
    }
  }

  async _loadMarkets() {
    const allMarkets = await getAllMarketsAndTokens(this.state.web3)
    this.setState({ allMarkets, isLoading: false })
  }

  _setMarket(selectedMarket) {
    if (!this.state.isLoading)
      this.setState({
        selectedMarket,
        scrapableTokens: this._getSelectedMarketTokens(
          selectedMarket,
          this.state.isHidingEmptyBalances
        ),
        selectedToken: null,
      })
  }

  _setToken(selectedToken) {
    this.setState({ selectedToken })
  }

  _onHideEmptyBalancesCheckboxClick(e) {
    const isHidingEmptyBalances = e.target.checked

    this.setState({
      isHidingEmptyBalances,
      scrapableTokens: this.state.selectedMarket
        ? this._getSelectedMarketTokens(
            this.state.selectedMarket,
            isHidingEmptyBalances
          )
        : [],
    })
  }

  _getFormattedNumber(floatBalance, decimals) {
    if (floatBalance === 0) {
      return 0
    } else if (floatBalance < 1) {
      const decimalDigits = floatBalance.toFixed(decimals).slice(2)
      const leadingZeros = decimalDigits.search(/[1-9]/)
      const firstTwoDigits = decimalDigits.slice(leadingZeros, leadingZeros + 2)

      return `0.${'0'.repeat(leadingZeros)}${firstTwoDigits}`
    } else if (floatBalance < 10) return Math.round(floatBalance * 10) / 10

    return Math.round(floatBalance)
  }

  _getSelectedMarketTokens(selectedMarket, isHidingEmptyBalances) {
    let { scrapableTokens } = this.state.allMarkets.filter(
      market => market.marketAddress === selectedMarket
    )[0]

    if (isHidingEmptyBalances)
      scrapableTokens = scrapableTokens.filter(([, balance]) => balance > 0)

    scrapableTokens.sort((a, b) => a[1] > b[1])

    const emptyTokens = []
    scrapableTokens.forEach(([address, balance]) => {
      if (balance === '0') emptyTokens.push(address)
    })

    return {
      displayValues: scrapableTokens.map(
        ([address, balance, decimals, symbol]) => {
          const floatBalance = balance / Math.pow(10, decimals)
          const displayNumber = this._getFormattedNumber(floatBalance, decimals)

          return `${displayNumber} ${symbol} (${address})`
        }
      ),
      values: scrapableTokens.map(([address]) => address),
    }
  }
}

export default App
