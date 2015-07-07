var h = require('cyclejs').h;

module.exports = function() {
  var submitting = false;
  var exists = false;
  var thanks = false;
  return (
h("div", [
  h("div.page-header", [
    h("h1", [ "Contribute" ])
  ]),
  h("div.row", [
    h("div#main.col-md-8", [
      h("h3", [ "Add a card" ]),
      h("p", [
        "Help make the game! Contribute words and make the game better. Also, please ",
        "original work only. Don't just blindly copy a card from any of the Taboo games."
      ]),
      h("form#cardForm", {
          "role": "form",
          "ng-submit": "submit()"
      }, [
        h("div.form-group", [
          h("label", {
              "for": "inputWord"
          }, [ "Word" ]),
          h("input#inputWord.form-control", {
              "type": "text",
              "ng-model": "card.word",
              "placeholder": "Word",
              "ng-change": "check()",
              "required": ""
          }),
          exists ? h("span", [ "We already have this word" ]) : null
        ]),
        h("div.form-group", [
          h("label", [ "Taboo Words" ]),
          h("input.form-control", {
              "type": "text",
              "ng-model": "card.taboos[0]",
              "placeholder": "Taboo Word",
              "required": ""
          }),
          h("input.form-control", {
              "type": "text",
              "ng-model": "card.taboos[1]",
              "placeholder": "Taboo Word",
              "required": ""
          }),
          h("input.form-control", {
              "type": "text",
              "ng-model": "card.taboos[2]",
              "placeholder": "Taboo Word",
              "required": ""
          }),
          h("input.form-control", {
              "type": "text",
              "ng-model": "card.taboos[3]",
              "placeholder": "Taboo Word",
              "required": ""
          }),
          h("input.form-control", {
              "type": "text",
              "ng-model": "card.taboos[4]",
              "placeholder": "Taboo Word",
              "required": ""
          })
        ]),
        h("input.btn.btn-primary", {
            "disabled": submitting,
            "type": "submit",
            "value": submitting ? 'Submitting...' : 'Submit'
        }),
        thanks ? h("span", [ "Thank you!" ]) : null
      ])
    ]),
    h("div.col-md-4.sidebar", [
      h("h3", [ "Help code" ]),
      h("p", [
        "Want to help code instead? Fork the ", h("a", {
            "href": "https://github.com/thatsmydoing/gamenchat"
        }, [ "repo" ]), " or submit ",
        "an ", h("a", {
            "href": "https://github.com/thatsmydoing/gamenchat/issues"
        }, [ "issue" ]), "."
      ]),
      h("h3", [ "Help design" ]),
      h("p", [
        "Yes, it's bootstrap. Not even custom colors. If you like it, maybe you can make it look nicer."
      ])
    ])
  ])
])
  )
}

