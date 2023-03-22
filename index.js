'use strict';
(function () {

  window.addEventListener('load', init);
  
  var edit_card = null; // card the right bar is editing
  const element_names = {
    'h1': "Header", 'h2': "Header", 'h3': "Header", 'h4': "Header", 'h5': "Header", 'h6': "Header",

    'p': "Paragraph",
    'a': "Hyperlink",
    'b': "Bold Text",
    'u': "Underlined Text",
    'i': "Italicised Text",

    'li': "List Item",
    'img': "Image",
    // 'br': "Line Break",
    // 'hr': "Horizontal Rule",
  };
  const container_names = {
    'div': "Division",
    'section': "Section",
    'span': "Span",
    'ol': "Ordered List",
    'ul': "Unordered List",
  };
  const all_names = Object.assign({}, element_names, container_names);
  const supported_elements = Object.keys(element_names);
  const supported_containers = Object.keys(container_names);

  function init() {
    const left_bar = document.getElementById('left-bar');
    const left_width = Math.min(350, window.innerWidth * 0.35);
    left_bar.style.setProperty('--width', left_width);

    const right_bar = document.getElementById('right-bar');
    const right_width = Math.min(250, window.innerWidth * 0.25);
    right_bar.style.setProperty('--width', right_width);

    // RIGHT BAR LISTENERS
    const tag_edit = document.getElementById('tag-prop');
    tag_edit.addEventListener('input', function() {
      const is_container = edit_card.classList.contains('container');

      if (is_container && supported_containers.includes(tag_edit.value)) {
        updateCardLabel(edit_card, tag_edit.value);
      } else if (supported_elements.includes(tag_edit.value)) {
        updateCardLabel(edit_card, tag_edit.value);
      }
    });

    updatePreview();

    // ALL DONE
    const loader = document.getElementById('loader');
    loader.classList.add('loaded');
  }

  /** Event listeners aren't duplicated since we pass functions. */
  function setListeners() {
    // SET BUTTON LISTENERS
    const edit_buttons = document.querySelectorAll('.edit-card');
    addEventListeners(edit_buttons, 'click', populateRightBar);

    const add_buttons = document.querySelectorAll('.add-card');
    addEventListeners(add_buttons, 'click', addEmptyElement);

    const delete_buttons = document.querySelectorAll('.delete-card');
    addEventListeners(delete_buttons, 'click', removeCardElement);

    // SET CHANGE LISTENERS
    const inputs = document.querySelectorAll('.item-input');
    addEventListeners(inputs, 'change', updatePreview);
  }

  function updatePreview() {
    const preview = document.getElementById('preview');
    const left_bar = document.getElementById('left-bar');
    const cards = left_bar.querySelectorAll('.card');

    console.log(cards);
    preview.innerHTML = '';
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      if (!card.classList.contains('ignore')) {
        console.log(card);
        const label = getCardLabel(card);
        const tag = labelToTag(label);
        const element = document.createElement(tag);

        if (tag === 'p') {
          card.querySelector('textarea.item-input').classList.remove('hidden');
          card.querySelector('input.item-input').classList.add('hidden');
        } else if (supported_elements.includes(tag)) { // so, not a container
          card.querySelector('input.item-input').classList.remove('hidden');
          card.querySelector('textarea.item-input').classList.add('hidden');
        }
        if (!supported_containers.includes(tag)) {
          const add_button = card.querySelector('.add-card');
          if (add_button) {
            add_button.classList.add('hidden');
          }
          card.classList.remove('container');
          card.classList.add('element');
        }

        const content = getCardContent(card);
        if (content !== null) {
          if (tag === 'img') {
            element.src = content
            element.style.maxWidth = "100%";
          } else { // tag in ['p', 'h1', 'h2'...]
            element.innerText = content;
          }
        }

        preview.appendChild(element);
      }
    }

    setListeners();
  }

  function addEmptyElement() {
    const template = document.getElementById('template');
    const element = template.cloneNode(true);
    element.classList.remove('hidden');
    element.classList.remove('ignore');
    element.id = '';

    // this.parentNode is the card-row, this.parentNode.parentNode is the card
    this.parentNode.parentNode.insertBefore(element, this.parentNode);
    updatePreview();
  }

  function removeCardElement() {
    const card = this.parentNode.parentNode.parentNode;
    // TODO: add some kind of 'are you sure?'
    card.remove();
    updatePreview();
  }

  function populateRightBar() {
    const right_bar = document.getElementById('right-bar');
    right_bar.classList.remove('hidden');

    edit_card = this.parentNode.parentNode.parentNode;
    const label = getCardLabel(edit_card);
    const header = document.getElementById('prop-header');

    // PROP INPUTS
    const tag_edit = document.getElementById('tag-prop');
    const content_edit = document.getElementById('content-prop');
    content_edit.parentNode.classList.add('disabled');
    content_edit.value = "";
    const css_edit = document.getElementById('css-prop');
    css_edit.parentNode.classList.remove('disabled');

    if (label === "Body") {
      header.innerText = `Edit Body Properties`;

      tag_edit.parentNode.classList.add('disabled');
    } else {
      const tag = labelToTag(label);
      header.innerText = `Edit Properties (${tag})`;
      
      // All elements have a tag
      tag_edit.parentNode.classList.remove('disabled');
      tag_edit.value = tag;

      // Give the content prop a proper label
      const edit_label = (tag === 'img') ? '"src"' : '"text"';
      content_edit.parentNode.style.setProperty('--label', edit_label);

      // If the card has content, show it
      const content = getCardContent(edit_card);
      if (content) {
        content_edit.value = content;
        content_edit.parentNode.classList.remove('disabled');
      }
    }
  }

  /* === HELPER FUNCTIONS === */

  /**
   * @param {Element[]} elements Elements that should have listeners attached
   * @param {string} event Event type to attach, e.g. 'click' or 'change'
   * @param {Function} action Function to be triggered by listeners
   */
  function addEventListeners(elements, event, action) {
    for (let i = 0; i < elements.length; i++) {
      elements[i].addEventListener(event, action);
    }
  }

  /** Takes a string of the form "READABLE_NAME (TAG)" and spits out the tag */
  function labelToTag(label) {
    const regex = /\(([^)]+)\)/;
    return label.match(regex)[1];
  }

  function getCardContent(card) {
    // Only element cards have content
    if (card.classList.contains('container')) {
      return null;
    }

    return card.querySelector('.item-input:not(.hidden)').value;
  }

  function setCardContent(card, value) {
    if (card.classList.contains('container')) {
      return;
    }

    card.querySelector('.item-input:not(.hidden)').value = value;
  }

  function getCardLabel(card) {
    return card.querySelector('p').innerText;
  }

  function updateCardLabel(card, tag) {
    card.querySelector('p').innerText = `${all_names[tag]} (${tag})`;
    updatePreview();
  }

  /**
   * Converts a hexadecimal color to its red green blue components.
   * @param {string} hexColor hexadecimal string to be converted
   * @return {number[]} array of length three of the form [red, green, blue]
   */
  function convertToRBG(hexColor) {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    return [r, g, b];
  }

  /**
   * Converts red green blue components to a hexadecimal color string.
   * @param {number} red red component of the color
   * @param {number} green green component of the color
   * @param {number} blue blue component of the color
   * @return {string} hexadecimal color string corresponding to the components
   */
  function convertToHex(red, green, blue) {
    return "#" + colorToHex(red) + colorToHex(green) + colorToHex(blue);
  }

  /**
   * Do not call. Helper function for convertToHex that converts a single color component
   * to a 2 digit hexadecimal string.
   * @param {number} color single rbg component
   * @return {string} 2 digit hexadecimal color string equivalent
   */
  function colorToHex(color) {
    let hex = color.toString(16).substr(0, 2);
    return hex.length === 1 ? "0" + hex : hex;
  }

  /**
   * Returns a random, valid, hexadecimal color string.
   * @return {string} a hex color
   */
  function getRandomColor() {
    let hex = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += hex[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /**
   * Determines whether a color is light or dark. This function is here courtesy of
   * Andreas Wik, see https://awik.io/determine-color-bright-dark-using-javascript/
   * @param color a hex or rgb color string
   * @return {boolean} true if the color is light, false otherwise
   */
  function isLightColor(color) {
    // Variables for red, green, blue values
    var r, g, b, hsp;

    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
      // If RGB --> store the red, green, blue values in separate variables
      color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

      r = color[1];
      g = color[2];
      b = color[3];
    }
    else {
      // If hex --> Convert it to RGB: http://gist.github.com/983661
      color = +("0x" + color.slice(1).replace(
        color.length < 5 && /./g, '$&$&'));

      r = color >> 16;
      g = color >> 8 & 255;
      b = color & 255;
    }

    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );

    // Using the HSP value, determine whether the color is light or dark
    return hsp > 127.5;
  }

})();
