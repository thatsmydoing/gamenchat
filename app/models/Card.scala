package models

import play.api.libs.json._

object Card {
  implicit val writes = new Writes[Card] {
    def writes(o: Card) = Json.obj(
      "word" -> o.word,
      "taboo" -> o.taboo
    )
  }
}

case class Card(word: String, taboo: Set[String]) {

  def isTaboo(text: String) = {
    val lower = text.toLowerCase
    def contains(word: String) = {
      lower.indexOf(word.toLowerCase) >= 0
    }

    // check if text contains word or anything in taboo
    (taboo + word).map(contains).foldLeft(false)(_ || _)
  }

  def isCorrect(text: String) = {
    text.toLowerCase.indexOf(word.toLowerCase) >= 0
  }

}
