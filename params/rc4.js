/* eslint-disable */
export class RC4 {
      constructor() {
      }
      rc4(key, str) {
        let s = [], i = 0, j = 0, x, res = '';
        for (i = 0; i < 256; i++) {
          s[i] = i;
        }
        for (i = 0; i < 255; i++) {
          j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
          x = s[i];
          s[i] = s[j];
          s[j] = x;
        }
        i = 0;
        j = 0;
        for (let y = 0; y < str.length; y++) {
          i = (i + 1) % 256;
          j = (j + s[i]) % 256;
          x = s[i];
          s[i] = s[j];
          s[j] = x;
          res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j] % 256) % 256]);
        }
        return res;
      }
      string2Bytes(str) {
        let bytes = new Array();
        let len, c;
        len = str.length;
        for (let i = 0; i < len; i++) {
          c = str.charCodeAt(i);
          if (c >= 0x010000 && c <= 0x10FFFF) {
            bytes.push(((c >> 18) & 0x07) | 0xF0);
            bytes.push(((c >> 12) & 0x3F) | 0x80);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
          } else if (c >= 0x000800 && c <= 0x00FFFF) {
            bytes.push(((c >> 12) & 0x0F) | 0xE0);
            bytes.push(((c >> 6) & 0x3F) | 0x80);
            bytes.push((c & 0x3F) | 0x80);
          } else if (c >= 0x000080 && c <= 0x0007FF) {
            bytes.push(((c >> 6) & 0x1F) | 0xC0);
            bytes.push((c & 0x3F) | 0x80);
          } else {
            bytes.push(c & 0xFF);
          }
        }
        return bytes;
      }
      bytes2String(arr) {
        if (typeof arr === 'string') {
          return arr;
        }
        let str = '', _arr = arr;
        for (let i = 0; i < _arr.length; i++) {
          let one = _arr[i].toString(2),
              v = one.match(/^1+?(?=0)/);
          if (v && one.length == 8) {
            let bytesLength = v[0].length;
            let store = _arr[i].toString(2).slice(7 - bytesLength);
            for (let st = 1; st < bytesLength; st++) {
              store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
          } else {
            str += String.fromCharCode(_arr[i]);
          }
        }
        return str;
      }
      bytes2HexString(bytes) {
        let str = '';
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
          hex = bytes[i].toString(16);
          if (hex.length == 1) {
            hex = '0' + hex;
          }
          str += hex.toUpperCase();
        }
        return str;
      }
      hexString2Bytes(str) {
        let len = str.length / 2;
        let bytes = [];
        for (let i = 0; i < len; i++) {
          bytes[i] = parseInt(str.substring(i * 2, i * 2 + 2), 16);
        }
        return bytes;
      }
      fixedFromCharCode(codePt) {
        if (codePt > 0xFFFF) {
          codePt -= 0x10000;
          return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
        }
        else {
          return String.fromCharCode(codePt);
        }
      }
      encrypt(key, str) {
        return this.bytes2HexString(this.string2Bytes(this.rc4(key, str)));
      }
      decrypt(key, str) {
        return this.rc4(key, this.bytes2String(this.hexString2Bytes(str)));
      }
    }