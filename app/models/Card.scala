package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.libs.json._
import play.api.Play.current

object Card {
  implicit val writes = new Writes[Card] {
    def writes(o: Card) = Json.obj(
      "word" -> o.word,
      "taboo" -> o.taboo
    )
  }

  def size = DB.withConnection { implicit c =>
    SQL("select count(*) from words").single(long("count"))
  }

  def exists(word: String) = DB.withConnection { implicit c =>
    SQL("select * from words where lower(word) = lower({word})")
      .on('word -> word)
      .list(str("word"))
      .nonEmpty
  }

  def add(card: Card) = DB.withTransaction { implicit c =>
    val id = SQL("insert into words values (default, {word})")
      .on('word -> card.word)
      .executeInsert()
    id.map { id =>
      card.taboo.map { word =>
        SQL("insert into taboo values (default, {id}, {word})")
          .on('id -> id, 'word -> word)
          .executeInsert()
      }
    }
  }

  def list() = DB.withConnection { implicit c =>
    val list = SQL("""
      select words.id as id, words.word as word, taboo.word as taboo
      from words left join taboo on word_id = words.id
    """)
    .list(int("id") ~ str("word") ~ str("taboo") map flatten)

    mapToCard(list)
  }

  def mapToCard(seq: Seq[(Int, String, String)]) = {
    seq.groupBy(_._1).map {
      case (id, taboos) => Card(taboos.map(_._2).head, taboos.map(_._3).toSet)
    }.toList
  }
}


case class Card(word: String, taboo: Set[String]) {

  lazy val tabooRegex = (taboo + word).flatMap(compoundWords).map { word =>
    ("\\b"+word.toLowerCase+"\\b").r
  }

  def compoundWords(text: String): Seq[String] = {
    text.split(" ") :+ text.replace(" ", "")
  }

  def isTaboo(text: String) = {
    val lower = text.toLowerCase

    // check if text contains word or anything in taboo
    tabooRegex.map(!_.findFirstIn(lower).isEmpty).foldLeft(false)(_ || _)
  }

  def isCorrect(text: String) = {
    text.toLowerCase.indexOf(word.toLowerCase) >= 0
  }

}

object CardPool {
  import scala.util.Random

  def get() = DB.withConnection { implicit c =>
    val list = Card.list()
    CardPool(Random.shuffle(list))
  }
}

case class CardPool(list: List[Card]) {
  var index = 0

  def hasNext = list.size > index

  def next() = {
    val card = list(index)
    index += 1
    card
  }
}
