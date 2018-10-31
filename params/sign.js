/* eslint-disable */
import { hxMd5 } from './md5'
import { base64 } from './base64'
import { des } from './des'
import { RC4 } from './rc4'
import { RC4CODE, DESCODE } from './encodeKey'
const encodeType = {
    rc4: false,
    des: false,
    base64: true
}
export const encrypt = {
     getSign: function(obj) { //生成签名
         if (obj.sign) delete obj.sign;
         var a = [];

         for (var name in obj) {
             a.push(name + '=' + (encrypt.isBaseParams(name) ? obj[name] : encodeURI(obj[name])))
         }
         var seq = a.join('&').replace(/~/g, "%7E");

         var arr = seq.split("&");

         var keyString = arr.sort().join("&");


         if(keyString.indexOf(":") != -1){
            keyString = keyString.replace(/:/g, "%3A");
         }

         if(keyString.indexOf("@") != -1){
            keyString = keyString.replace(/@/g, "%40");
         }
         if(keyString.indexOf(",") != -1){
            keyString = keyString.replace(/,/g, "%2C");
         }

         var md5key = hxMd5(keyString).toUpperCase();

         return this.encryptSign(md5key);
     },
     encryptSign: function(md5key) { //加密
         var chars = ["a", "b", "c", "d", "e", "f", "g", "h",
             "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
             "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5",
             "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H",
             "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
             "U", "V", "W", "X", "Y", "Z"
         ];

         var sTempSubString = md5key.substring(0, 8);

         var lHexLong = 0x3FFFFFFF & parseInt(sTempSubString, 16);

         var outChars = "";

         for (var j = 0; j < 6; j++) {
             var index = 0x0000003D & lHexLong;
             outChars += chars[parseInt(index)];
             lHexLong = lHexLong >> 5;
         }

         return outChars;
     },
     getParams: function(data) {
        let params = JSON.parse(JSON.stringify(data))
        if (params) {
            params.appkey = "IX8pBy";
            params.appsecret = "u9KMNq";
            params.appversion = "3.0.6";
            params.channel = "app_web";
            params.market = "AppStore";
            params.sign = encrypt.getSign(params);
        }
        if (params && encodeType.des) {
            let Des = new des()
             for (var key in params) {
                if (!encrypt.isBaseParams(key)) {
                    params[key] = Des.strEnc(params[key], ...DESCODE)
                }
             }
        }
        if (params && encodeType.rc4) {
            let rc4 = new RC4()
             for (var key in params) {
                if (!encrypt.isBaseParams(key)) {
                    params[key] = rc4.encrypt(RC4CODE, params[key])
                }
             }
        }
        if (params && encodeType.base64) {
            for (var key in params) {
               if (!encrypt.isBaseParams(key)) {
                    params[key] = base64.encode(params[key])
               }
            }
        }

        return params;
     },
     isBaseParams (key) {
        return (key === 'appkey' || key === 'appsecret' || key === 'appversion' || key === 'channel' || key === 'market' || key === 'sign')
     }
 };
