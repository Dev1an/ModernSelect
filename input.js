if (window.hasOwnProperty('Meteor')) require('document-register-element')

const mirror = document.createElement('div')
hideMirror()

document.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(mirror);
}, false);

class Input extends HTMLInputElement {
    constructor() {
        super()

        this.addEventListener('input', () => {
            mirror.innerText = this.value
            mirror.style.cssText = getComputedStyle(this).cssText
            hideMirror()
            this.style.width = `calc(1em + ${mirror.clientWidth}px)`
        })
    }
}
window.customElements.define('growing-input', Input, {extends: 'input'})

function hideMirror() {
    mirror.style.visibility = 'hidden'
    mirror.style.position = 'absolute'
    mirror.style.whiteSpace = 'pre'
    mirror.style.left = '0'
    mirror.style.width = ''
}

if (typeof exports != "undefined") {
    Object.defineProperty(exports, "__esModule", {
        value: true
    })

    exports["default"] = Input
    exports["Input"] = Input
}