var h = require('cyclejs').h;

module.exports = function() {

return (
h("div", [
  h("div.jumbotron", [
    h("h1", [ "Game n' Chat" ]),
    h("p", [
      "Play games in a chatroom like it's the 2000s! Bringing IRC gaming to ",
      "Web 2.0!"
    ])
  ]),
  h("div.row", [
    h("div.col-md-8", [
      h("h2", [ "Taboo" ]),
      h("p", [
        "Taboo is a party game for around 4 to 10 people split into 2 teams. Each ",
        "round, a player from a team becomes the ", h("em", [ "giver" ]), " and the rest of the ",
        "team become ", h("em", [ "guessers" ]), ". The opposing team act as ", h("em", [ "monitors" ]), "."
      ]),
      h("p", [
        "The ", h("em", [ "giver" ]), " is given a card containing a word and 5 taboo words. The ",
        "giver must somehow tell the ", h("em", [ "guessers" ]), " about the word without mentioning ",
        "the word itself or any of the 5 taboo words. The ", h("em", [ "monitors" ]), " act as ",
        "judges to see if any of the words said are not allowed."
      ]),
      h("p", [
        "If a guesser gets the word right, the team earns a point. If the giver says ",
        "any taboo word, the team loses a point. The giver may also choose to pass ",
        "and the team also loses a point. The giver is then given another card and ",
        "this continues until the round time runs out."
      ]),
      h("h3", [ "Additional notes" ]),
      h("p", [
        "When there are enough players, the giver is announced and he can start the ",
        "game by pressing the Start button. Normally, taboo rounds are 1 minute long, ",
        "but we extend it to 2 minutes because of the time it takes to type things."
      ]),
      h("p", [
        "The system can rudimentarily act as a monitor itself. If the giver types out ",
        "any of the taboo words verbatim, the system immediately calls taboo on those. ",
        "It can also check if the word was guessed correctly assuming it was spelled ",
        "correctly. For all other cases, we will rely on the monitors and the giver ",
        "to act in good faith."
      ]),
      h("p", [
        "To facilitate faster playing, there are some command you can just type in:"
      ]),
      h("ul", [
        h("li", [ h("code", [ "/s" ]), " - Start the round" ]),
        h("li", [ h("code", [ "/p" ]), " - Pass" ]),
        h("li", [ h("code", [ "/c" ]), " - Correct (someone got the word)" ]),
        h("li", [ h("code", [ "/t" ]), " - Taboo" ])
      ])
    ]),
    h("div#main.col-md-4.sidebar", [
      h("h2", [ "What is this?" ]),
      h("p", [
        "Hi! This is just a side project I made where you can play Taboo online. ",
        "I liked playing it with my friends during our Christmas party and I wanted ",
        "to play a bit more."
      ]),
      h("p", [
        "Feature-wise, it's a bit sparse. There's no score tracking beyond a single ",
        "round, but it should at least have the core game mechanics ok. UI/UX could ",
        "also use a lot of work. I'm also leaving the prospect of adding more games ",
        "open. Like maybe Pinoy Henyo or whatever."
      ]),
      h("p", [
        "Also, while the website is responsive now, you still can't play on mobile ",
        "because I don't know how to layout the game such that it works."
      ]),
      h("p", [
        "There aren't that many words yet, and I'd greatly appreciate contributing ",
        "some for the game. There's also an API for accessing the word list in case ",
        "you want to build your own Taboo-like thing. ", h("code", [ "GET /cards" ]), " should ",
        "give you the entire card list, while ", h("code", [ "GET /cards/random" ]), " will ",
        "give you a random card each time."
      ]),
      h("p", [
        "Obligatory note, I do not own the rights to the Taboo board game. The card ",
        "data was made by me and any contributors. I did not use any of the Taboo cards ",
        "as a source for them."
      ])
    ])
  ])
])
);
}
