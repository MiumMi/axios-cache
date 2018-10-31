export default {
  getFund: {
    url: '/dlmiddleware/config-service/6.0/deploy/fundallocation/findFund',
    cache: true,
    reg: true
  },
  findFunddetail: {
    url: '/dlmiddleware/config-service/6.0/deploy/fundallocation/findFunddetail',
    cache: true,
    reg: true,
    related: ['getFund', 'resources']
  },
  resources: {
    url: '/dlmiddleware/config-service/resources',
    cache: true,
    reg: true
  }
}
