const request = require('request')

let EtherscanService = {}

const API_KEY = process.env.ETHERSCAN_API_KEY
let TX_STATUS_URL = ''
TX_STATUS_URL += 'https://api.etherscan.io/api'
TX_STATUS_URL += '?module=transaction'
TX_STATUS_URL += '&action=gettxreceiptstatus'
TX_STATUS_URL += '&txhash=%'
TX_STATUS_URL += '&apikey=' + API_KEY

EtherscanService.txList = []
EtherscanService.polling = false
EtherscanService.pollingInterval = null
EtherscanService.currentPollIndex = 0

EtherscanService.pollStatus = (txHash, _callback) => {
  EtherscanService.txList.push({ txHash, awaitingResponse: false, _callback })
  if (!EtherscanService.polling) EtherscanService.startPolling()
}

EtherscanService.startPolling = () => {
  EtherscanService.polling = true
  EtherscanService.currentPollIndex = 0
  EtherscanService.pollingInterval = setInterval(() => {
    EtherscanService.tick()
  }, 1000)
  EtherscanService.tick()
}

EtherscanService.tick = () => {
  let tx = EtherscanService.txList[EtherscanService.currentPollIndex]
  if (!tx.awaitingResponse) {
    tx.awaitingResponse = true
    let url = TX_STATUS_URL.replace('%', tx.txHash)
    EtherscanService.doRequest(url, tx, EtherscanService.currentPollIndex)
  }
  EtherscanService.currentPollIndex++
  if (EtherscanService.currentPollIndex === EtherscanService.txList.length) {
    EtherscanService.currentPollIndex = 0
  }
}

EtherscanService.doRequest = (url, tx, index) => {
  request(url, (e, res, body) => {
    EtherscanService.txList.splice(index, 1)
    if (EtherscanService.txList.length === 0) EtherscanService.stopPolling()
    if (e) return tx._callback(e)
    let result = JSON.parse(body)
    let txSuccess = Number(result.result.status) === 1
    tx._callback(null, txSuccess)
  })
}

EtherscanService.stopPolling = () => {
  clearInterval(EtherscanService.pollingInterval, () => {
    EtherscanService.polling = false
  })
}

module.exports = EtherscanService
