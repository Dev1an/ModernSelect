if (window.hasOwnProperty('Meteor')) var Input = require('growing-input').Input
else var Input = customElements.get('growing-input')

class Select extends HTMLElement {
    constructor() {
        super()

        this.options = []
        this.selectedOptions = []
        this._completionHighlightIndex = 0
        this.highlightedCompletionNode = null

        const styleElement = document.createElement('style')
        styleElement.innerHTML = style

        const inputContainer = document.createElement('div')
        inputContainer.className = 'inputContainer'

        const selectedOptionsContainer = this._selectedOptionsContainer = document.createElement('div')
        selectedOptionsContainer.className = "selectedOptionsContainer"

        const completionsContainer = document.createElement('div')
        completionsContainer.className = 'completionsContainer'

        const input = this._input = new Input
        input.tabIndex = 1
        input.addEventListener('input', event => this.filterCompletions(event))
        input.addEventListener('keydown', event => this.inputKeyDownHandler(event))

        this.addEventListener('focus', event => input.tabIndex = 2)
        this.addEventListener('blur',  event => input.tabIndex = 1)

        const completionsSlot = this._completionsSlot = document.createElement('slot')
        completionsSlot.addEventListener('slotchange', event => this.updateOptions(event))

        const shadow = this.attachShadow({mode: 'open', delegatesFocus: true})
        inputContainer.appendChild(selectedOptionsContainer)
        inputContainer.appendChild(input)
        shadow.appendChild(inputContainer)
        completionsContainer.appendChild(completionsSlot)
        shadow.appendChild(completionsContainer)
        shadow.appendChild(styleElement)
    }

    updateOptions(event) {
        for (const option of this.options) {
            option.completionNode.removeEventListener('click', option.addSelectedOption)
        }
        this.options = this._completionsSlot.assignedNodes().map(completionNode => {
            const option = {completionNode}
            completionNode.addEventListener('click', event => this.addSelectedOption(event, option))
            completionNode.addEventListener('mousedown', event =>
                this.completionHighlightIndex = Array.prototype.indexOf.call(this.completionNodes, completionNode)
            )
            return option
        })

        this.completionHighlightIndex = 0
        this.filterCompletions()
        this._selectedOptionsContainer.innerHTML = ''
        // TODO: handle error when a selected option disappears from the options list
    }

    filterCompletions() {
        const input = this._input
        const filter = new RegExp(input.value.split('').join('.*'), 'i')
        for (const option of this.options) {
            if (filter.test(option.completionNode.innerText)) {
                option.completionNode.classList.remove('hidden')
            } else {
                option.completionNode.classList.add('hidden')
            }
        }
        this.completionHighlightIndex = this.completionHighlightIndex
    }

    get completionNodes() {
        return this.querySelectorAll('div:not(.selected):not(.hidden)')
    }

    get completionHighlightIndex() {
        return this._completionHighlightIndex
    }
    set completionHighlightIndex(newIndex) {
        if (this.highlightedCompletionNode instanceof HTMLElement)
            this.highlightedCompletionNode.classList.remove('highlighted')

        const completionNodes = this.completionNodes
        if (newIndex<completionNodes.length) {
            const newNode = completionNodes[newIndex]
            newNode.classList.add('highlighted')
            this.highlightedCompletionNode = newNode
            this._completionHighlightIndex = newIndex
        } else if (completionNodes.length > 0) {
            if (newIndex > 0) {
                this.completionHighlightIndex = completionNodes.length-1
            } else {
                this.completionHighlightIndex = 0
            }
        } else {
            this.highlightedCompletionNode = null
        }
    }

    inputKeyDownHandler(event) {
        const input = this._input
        const selectionStart = input.selectionStart

        if (event.keyCode == 37) {
            // Left Arrow (<)
            if (this.selectedOptions.length >0 && input.selectionStart == input.selectionEnd && input.selectionStart == 0) {
                this.selectedOptions[this.selectedOptions.length-1].selectionIndicatorNode.focus()
            }
        } else if (event.keyCode == 38 && this.completionHighlightIndex > 0) {
            // Up arrow (^)
            this.completionHighlightIndex = this.completionHighlightIndex-1
        } else if (event.keyCode == 40) {
            // Down arrow (v)
            this.completionHighlightIndex = this.completionHighlightIndex+1
        } else if (event.keyCode == 8 && selectionStart == input.selectionEnd && selectionStart == 0 && this.selectedOptions.length>0) {
            // Backspace (<-)
            this.selectedOptions[this.selectedOptions.length-1].selectionIndicatorNode.focus()
        } else if (event.keyCode == 13 && this.highlightedCompletionNode instanceof HTMLElement) {
            // Return (<-')
            const highlightedOption = this.options.find(option => option.completionNode == this.highlightedCompletionNode)
            this.addSelectedOption(event, highlightedOption)
        } else if (event.keyCode == 27) {
            input.blur()
        }
    }

    addSelectedOption(event, option) {
        this.selectedOptions.push(option)

        const selectionIndicatorNode = document.createElement('a')
        selectionIndicatorNode.innerText = option.completionNode.innerText
        selectionIndicatorNode.tabIndex = 2
        selectionIndicatorNode.addEventListener('keydown', event => {
            // Arrow navigation
            const index = this.selectedOptions.indexOf(option)
            if (event.keyCode == 37 && index > 0) {
                // Left arrow (<)
                this.selectedOptions[index-1].selectionIndicatorNode.focus()
            } else if (event.keyCode == 39) {
                // Right arrow (>)
                if (index < this.selectedOptions.length-1) {
                    this.selectedOptions[index+1].selectionIndicatorNode.focus()
                } else {
                    this._input.focus()
                }
            } else if (event.keyCode == 8 || event.keyCode == 46) {
                // Backspace or delete
                this.removeSelectedOption(event, option)
            }
        })

        option.selectionIndicatorNode = selectionIndicatorNode
        option.completionNode.classList.add('selected')

        this._selectedOptionsContainer.appendChild(selectionIndicatorNode)

        this._input.value = ""
        this.filterCompletions()

        this._input.focus()
    }

    removeSelectedOption(event, option) {
        option.selectionIndicatorNode.parentNode.removeChild(option.selectionIndicatorNode)
        delete option.selectionIndicatorNode
        option.completionNode.classList.remove('selected')

        const selectedOptionIndex = this.selectedOptions.indexOf(option)

        if (event.keyCode == 8) {
            if (selectedOptionIndex > 0) {
                this.selectedOptions[selectedOptionIndex-1].selectionIndicatorNode.focus()
            } else {
                this._input.focus()
            }
        } else if (event.keyCode == 46) {
            if (selectedOptionIndex < this.selectedOptions.length-1) {
                this.selectedOptions[selectedOptionIndex+1].selectionIndicatorNode.focus()
            } else {
                this._input.focus()
            }
        }

        this.selectedOptions.splice(selectedOptionIndex, 1)
        this.completionHighlightIndex = this.completionHighlightIndex
    }

}

window.customElements.define('modern-select', Select)

const style =
    "* { font: 11px helvetica }" +
    "input { border: none; outline: none; width: 1em}" +
    ".inputContainer { border: 1px solid #dfdfdf; padding-left: 0.5em; border-radius: 3px}" +
    ":host(:focus) .inputContainer {border-color: #6d9aff}" +
    ":host(:focus) {outline: none}" +
    ":host(:not(:focus)) .completionsContainer {display: none}" +
    ".completionsContainer { border: 1px solid rgba(0,0,0,0.2); box-shadow: 0px 7px 18px rgba(0,0,0,0.1); border-radius: 5px; margin-top: 1px; overflow: hidden}" +
    "::slotted(div) { padding: 0 5px; }" +
    "::slotted(div.highlighted) { background: #0f66da; color: #ffffff }" +
    "::slotted(.selected), ::slotted(.hidden) {display: none}" +
    ".selectedOptionsContainer {display: inline}" +
    ".selectedOptionsContainer a { margin-right: 0.3em }"

Object.defineProperty(exports, "__esModule", {
    value: true
})

exports["default"] = Select