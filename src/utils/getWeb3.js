import { thorify } from 'thorify'
import { extend } from 'thorify/dist/extend'

const Web3 = require('web3')

const getWeb3 = () => {
  let web3js

  if (typeof window.thor !== 'undefined') {
    web3js = new Web3(window.thor)
    extend(web3js)
  } else {
    web3js = thorify(new Web3(), 'http://localhost:8669')
  }

  return web3js
}

export default getWeb3
