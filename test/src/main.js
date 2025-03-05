import './style.css'
import {userInfo} from 'fingerprint-oss'

const info = await userInfo()
console.log(info)
document.querySelector('#app').innerHTML = `
  <div>
  </div>
`

setupCounter(document.querySelector('#counter'))
