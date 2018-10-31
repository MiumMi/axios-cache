export default class AjaxCache {
  constructor (instance, options) {
    const config = options ? JSON.parse(JSON.stringify(options)) : {}
    this.instance = instance
    this.cacheMethods = ['post', 'get']
    // 缓存时间
    this.cacheTime = config.cacheTime || 1000 * 60 * 5
    // 缓存接口数量
    this.cacheNum = config.cacheNum || 50
    // 需要缓存的key值，有两种
    // 一种为正则匹配（cacheReg）
    // 一种为url全等匹配（cacheConFig），优先用这种
    this.cacheReg = {}
    this.cacheConFig = {}
    // 需要缓存的config配置
    this.caches = {}
    // 缓存的结果项
    this.cacheRes = new Map()
    // get/post等被重写的方法的原始方法
    this.originalMethods = {}
    this.url = {}
    // 判断方法
    this.__handleJudge = config.handleJudge || this.__handleJudgeDefault
    if (config.cacheConFig) {
      this.__initConfig(config.cacheConFig)
    }
    this.__init()
  }

  // 初始化缓存区的url
  __initConfig (config) {
    const configKeys = Object.keys(config)
    configKeys.forEach((val) => {
      let configVal = config[val]
      let cacheOption = 'cacheConFig'
      let key = configVal
      // 为字符串默认不缓存
      // 为对象时，只有cache为ture/字符串/数组时才写入需要缓存区的数组
      if (this.__getType(configVal) === 'object') {
        key = configVal['url']
        if (configVal.reg) {
          cacheOption = 'cacheReg'
        }
        // 格式化配置项
        configVal = this.__formatConfig(configVal, val)
        const cache = configVal.cache
        let cachekey = ''
        cache.forEach((cacheItem) => {
          cachekey = `${cacheItem}:${key}`
          this[cacheOption][cachekey] = Object.assign({
            url: '',
            cache: [],
            reg: false,
            key: val
          }, configVal)
        })
        if (cache.length > 0) {
          this.caches[val] = {...this[cacheOption][cachekey]}
        }
      }
      this.url[val] = key
    })
  }

  __formatConfig (config, key) {
    // 格式化缓存，若没有给默认值
    if (config.cache) {
      if (this.__getType(config.cache) === 'boolean') {
        config.cache = [...this.cacheMethods]
      } else if (this.__getType(config.cache) === 'string') {
        config.cache = [config.cache]
      } else if (this.__getType(config.related) !== 'array') {
        console.error(`是否缓存配置格式错误，只支持数组、字符串、布尔格式，请检查${key}的cache配置`)
        config.cache = []
      }
    } else {
      config.cache = []
    }
    // 格式化相关依赖，无须给默认值
    if (config.related) {
      if (this.__getType(config.related) === 'string') {
        config.related = [config.related]
      } else if (this.__getType(config.related) !== 'array') {
        console.error(`相关依赖接口配置格式错误，只支持数组或字符串格式，请检查${key}的related配置`)
        config.related = []
      }
    }
    return config
  }

  // 初始化缓存方法
  __init () {
    const methods = Object.keys(this.instance)
    methods.forEach((key) => {
      this[key] = this.instance[key]
      if (this.cacheMethods.includes(key)) {
        // 将原始方法保存下来，再重写该方法
        this.originalMethods[key] = this.instance[key]
        this[key] = (...arg) => {
          const url = arg[0]
          const params = arg[1]
          // 先判断是否需要缓存项里面是否有该url的缓存配置，有则取出来
          const cacheOpt = this.__checkCache(`${key}:${url}`)
          if (cacheOpt.cache.length === 0) {
            return this.__native(key, arg)
          } else {
            // 检查缓存的结果项里面是否有这次请求的url，如果有直接取值
            const cacheKey = params ? `${key}:${url}${JSON.stringify(params)}` : url
            if (this.__checkCacheRes(cacheKey) && this.__checkCacheStatus(cacheKey)) {
              return Promise.resolve(this.__getCacheRes(cacheKey).res)
            } else {
              return this.__native(key, arg, true, cacheOpt)
            }
          }
        }
      }
    })
  }

  // 检查当前key值对应的缓存状态是否过期
  __checkCacheStatus (key) {
    const cacheRes = this.__getCacheRes(key)
    const timeStamp = cacheRes.timeStamp
    const nowtime = new Date().getTime()
    if (nowtime - timeStamp > this.cacheTime) {
      return false
    }
    return true
  }

  // 删除相关依赖缓存
  __removeRelated (cacheOpt, relatedArr) {
    if (!cacheOpt || !cacheOpt.related) {
      return false
    }
    let related = cacheOpt.related
    let relatedOpt = {}
    for (let val of related) {
      relatedOpt = this.__getCacheConfig(val)
      if (relatedArr.includes(relatedOpt.key)) {
        continue
      }
      this.__removeCache(relatedOpt.url, true)
      relatedArr.push(relatedOpt.key)
      this.__removeRelated(relatedOpt, relatedArr)
    }
  }

  // 找到key值对应的缓存配置
  __getCacheConfig (key) {
    const cacheConKeys = Object.keys(this.caches)
    if (cacheConKeys.includes(key)) {
      return this.caches[key]
    }
    return {}
  }

  // 移除缓存
  __removeCache (url, reg = false) {
    if (!reg && this.__checkCacheRes(url)) {
      this.cacheRes.delete(url)
      return false
    }
    if (reg) {
      // 正则匹配的话可能会有多个匹配情况，要全部删除
      let caches = []
      const reg = new RegExp(`^(get:|post:)${url}{.*}$`)
      for (let cacheKey of this.cacheRes.keys()) {
        if (cacheKey.match(reg)) {
          caches.push(cacheKey)
        }
      }
      if (caches.length > 0) {
        caches.forEach(val => {
          this.cacheRes.delete(val)
        })
      }
    }
  }

  // 获取缓存
  __getCacheRes (key) {
    return this.cacheRes.get(key)
  }

  // 检查是否有缓存
  __checkCacheRes (key) {
    return this.cacheRes.has(key)
  }

  // 判断是否在缓存区的url中
  __checkCache (url) {
    // 首先判断url是否在不需要正则匹配的缓存区中
    const cacheConKeys = Object.keys(this.cacheConFig)
    if (cacheConKeys.includes(url)) {
      return this.cacheConFig[url]
    }
    // 否则去找需要正则匹配的缓存区
    const cacheRegKeys = Object.keys(this.cacheReg)
    const findVal = cacheRegKeys.find((val) => {
      const reg = new RegExp(`^${val}(/.*)?$`)
      return url.match(reg)
    })
    if (findVal) {
      return this.cacheReg[findVal]
    }
    return {}
  }

  // 检查是否超出缓存限制
  __checkMaxSize () {
    const length = this.cacheRes.size
    if (length >= this.cacheNum) {
      let earlyTime = new Date().getTime()
      let earlyKey = ''
      for (let [key, value] of this.cacheRes.entries()) {
        const timeStamp = value.timeStamp
        if (earlyTime > timeStamp) {
          earlyTime = timeStamp
          earlyKey = key
        }
      }
      if (earlyKey) {
        this.__removeCache(earlyKey)
      }
    }
  }

  // 设置缓存
  __setCache (type, res) {
    const url = arguments[2] || ''
    const params = arguments[3] || ''
    const cacheOpt = arguments[4] || {}
    if (url) {
      const cacheKey = params ? `${type}:${url}${JSON.stringify(params)}` : url
      this.__checkMaxSize()
      this.cacheRes.set(cacheKey, {
        res: res || {},
        timeStamp: new Date().getTime()
      })
      if (cacheOpt.related) {
        this.__removeRelated(cacheOpt, [cacheOpt.key])
      }
    }
  }

  // 原本的请求方法
  async __native (type, arg, cache = false, cacheOpt = {}) {
    try {
      const res = await this.originalMethods[type](...arg)
      let { data } = res
      if (typeof data === 'string') {
        data = JSON.parse(data)
      }
      this.__handleJudge(data, () => {
        if (cache) {
          this.__setCache(type, res, ...arg, cacheOpt)
        }
      })
      return res
    } catch (e) {
      console.log(e)
    }
  }

  __handleJudgeDefault (data, cb) {
    if (data.retcode === '0000' || data.code === '0000') {
      cb && cb()
    }
  }

  // 获取当前类型
  __getType (key) {
    return Object.prototype.toString.call(key).replace(/(\[object|\]|\s)/g, '').toLowerCase()
  }
}
