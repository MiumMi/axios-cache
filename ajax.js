/* eslint-disable */
// import axios from 'axios'
import { encrypt } from './params/sign.js'
import ajaxCahche from './ajaxCache.js'
import cacheConFig from './config.js'

import { des } from './params/des'
import { RC4 } from './params/rc4'
import { RC4CODE, DESCODE } from './params/encodeKey'

const decodeType = {
    rc4: false,
    base64: true
}
const qs = require('qs')
const timeout = 1000 * 30

let instance = axios.create({
  baseURL: window.location.protocol + '//' + window.location.href.split('/')[2] + '/',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'Accept': 'application/json'
  },
  transformRequest: [function (data) {
    if (window.sessionStorage.getItem('getReqType') === '1' ) {
      return data
    } else {
      return qs.stringify(data)
    }
  }],
  timeout
})

instance.interceptors.request.use(config => {
  // const method = config.method.toLowerCase()
  // if (method === 'post' || method === 'put') {
  //   config.data = encrypt.getParams(config.data || {})
  // } else if (method === 'get'|| method == 'delete') {
  //   config.params = encrypt.getParams(config.params || {})
  // }
  return config
}, (error) => {
  return Promise.reject(error)
})

instance.interceptors.response.use((res) => {
  if (decodeType.rc4) {
    let rc4 = new RC4()
    res.data = rc4.decrypt(RC4CODE, res.data)
  }
  return res
}, (error) => {
  const status = error.response ? error.response.status : 600
  switch (status) {
    case 404:
      console.log('接口不存在')
      break
    case 500:
      console.log('服务器错误')
      break
    default:
      console.log('未知错误')
  }
  return Promise.reject(error)
})

instance = new ajaxCahche(instance, {
  cacheTime: 1000 * 60 * 5,
  cacheConFig: cacheConFig
})

export default instance
